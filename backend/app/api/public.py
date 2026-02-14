"""Public API - no auth, for contact forms and booking pages"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.workspace import Workspace
from app.models.contact import Contact
from app.models.conversation import Conversation, Message
from app.models.booking import Booking, BookingType
from app.models.form import Form, FormSubmission
from app.services.automation import on_new_contact, on_booking_created
from app.services.integrations import send_email, send_sms
from app.config import settings
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/public", tags=["public"])

class ContactFormSubmit(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    message: Optional[str] = None

class BookingSubmit(BaseModel):
    booking_type_id: int
    contact_name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    scheduled_at: str


class FormPublicSubmit(BaseModel):
    data: Dict[str, Any] = {}

@router.get("/workspace/{slug}")
def get_public_workspace(slug: str, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.slug == slug).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Not found")
    if not ws.is_active:
        raise HTTPException(status_code=404, detail="Workspace not active")
    return {"name": ws.name, "slug": ws.slug, "id": ws.id}

@router.post("/contact/{workspace_id}")
def submit_contact_form(workspace_id: int, data: ContactFormSubmit, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.is_active == True).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Not found")
    if not data.email and not data.phone:
        raise HTTPException(status_code=400, detail="Email or phone required")
    contact = Contact(
        workspace_id=workspace_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        source="form"
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    on_new_contact(db, contact, ws)
    return {"success": True, "contact_id": contact.id}

@router.get("/booking/{workspace_id}/types")
def get_booking_types(workspace_id: int, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.is_active == True).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Not found")
    types = db.query(BookingType).filter(BookingType.workspace_id == workspace_id, BookingType.is_active == True).all()
    return [{"id": t.id, "name": t.name, "duration_minutes": t.duration_minutes, "availability": t.availability, "location": t.location} for t in types]

@router.post("/booking/{workspace_id}")
def create_booking(workspace_id: int, data: BookingSubmit, db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id, Workspace.is_active == True).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Not found")
    bt = db.query(BookingType).filter(BookingType.id == data.booking_type_id, BookingType.workspace_id == workspace_id).first()
    if not bt:
        raise HTTPException(status_code=404, detail="Booking type not found")
    if not data.contact_email and not data.contact_phone:
        raise HTTPException(status_code=400, detail="Email or phone required")
    # Create or get contact
    contact = Contact(
        workspace_id=workspace_id,
        name=data.contact_name,
        email=data.contact_email,
        phone=data.contact_phone,
        source="booking"
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    scheduled = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
    booking = Booking(
        workspace_id=workspace_id,
        contact_id=contact.id,
        booking_type_id=bt.id,
        scheduled_at=scheduled,
        status="confirmed"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    on_booking_created(db, booking, ws)
    # Create form submissions for linked forms
    created_submissions = []
    for fid in (bt.form_ids or []):
        f = db.query(Form).filter(Form.id == fid, Form.workspace_id == workspace_id).first()
        if f:
            fs = FormSubmission(
                form_id=f.id,
                booking_id=booking.id,
                contact_id=contact.id,
                status="pending",
                sent_at=datetime.utcnow(),
            )
            db.add(fs)
            db.commit()
            db.refresh(fs)
            created_submissions.append((f, fs))

    # Send intake form links via email/SMS and log into Inbox
    if created_submissions:
        conv = db.query(Conversation).filter(Conversation.contact_id == contact.id).first()
        if not conv:
            conv = Conversation(contact_id=contact.id)
            db.add(conv)
            db.commit()
            db.refresh(conv)

        for form_obj, sub in created_submissions:
            url = f"{settings.FRONTEND_URL}/form/{sub.id}"
            text = f"Please complete your {form_obj.name}: {url}"

            channel = "email" if contact.email else ("sms" if contact.phone else "system")
            msg = Message(
                conversation_id=conv.id,
                channel=channel,
                direction="outbound",
                content=text,
                is_automated=True,
            )
            db.add(msg)
            conv.last_message_at = datetime.utcnow()
            db.commit()

            # External delivery (best-effort)
            if contact.email and ws.email_connected:
                send_email(
                    contact.email,
                    f"Please complete your {form_obj.name}",
                    f"<p>{text}</p>",
                    ws.from_email or ws.contact_email or settings.FROM_EMAIL,
                    ws.sendgrid_api_key,
                )
            elif contact.phone and ws.sms_connected:
                send_sms(
                    contact.phone,
                    text,
                    ws.twilio_account_sid,
                    ws.twilio_auth_token,
                    ws.twilio_phone_number,
                )

    return {"success": True, "booking_id": booking.id}


@router.get("/form/{submission_id}")
def get_public_form(submission_id: int, db: Session = Depends(get_db)):
    """Return form metadata for a public intake form link."""
    sub = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Form submission not found")
    form = db.query(Form).filter(Form.id == sub.form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    ws = db.query(Workspace).filter(Workspace.id == form.workspace_id, Workspace.is_active == True).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not active")
    # If no fields are defined (older forms), fall back to a
    # simple default intake layout so the form isn't blank.
    fields = form.fields or [
        {"name": "reason", "label": "Reason for visit", "type": "textarea", "required": True},
        {"name": "medical_history", "label": "Do you have any past medical history?", "type": "textarea", "required": False},
        {"name": "document_upload", "label": "Would you like to upload the respective documents? (Paste links or describe documents to share)", "type": "textarea", "required": False},
        {"name": "notes", "label": "Additional notes", "type": "textarea", "required": False},
    ]

    return {
        "id": sub.id,
        "form_name": form.name,
        "fields": fields,
        "status": sub.status,
    }


@router.post("/form/{submission_id}")
def submit_public_form(submission_id: int, data: FormPublicSubmit, db: Session = Depends(get_db)):
    """Submit data for a public intake form."""
    sub = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Form submission not found")
    form = db.query(Form).filter(Form.id == sub.form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    ws = db.query(Workspace).filter(Workspace.id == form.workspace_id, Workspace.is_active == True).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not active")

    sub.data = data.data or {}
    sub.status = "completed"
    sub.completed_at = datetime.utcnow()
    db.commit()
    return {"success": True}

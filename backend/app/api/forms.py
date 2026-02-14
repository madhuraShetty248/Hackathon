from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.form import Form, FormSubmission
from app.models.booking import Booking
from app.schemas import FormCreate
from app.api.workspaces import _get_workspace_access
from app.auth import get_current_user

router = APIRouter(prefix="/workspaces", tags=["forms"])

@router.get("/{workspace_id}/forms")
def list_forms(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    forms = db.query(Form).filter(Form.workspace_id == workspace_id).all()
    return [{"id": f.id, "name": f.name, "is_contact_form": f.is_contact_form, "fields": f.fields or []} for f in forms]

@router.post("/{workspace_id}/forms")
def create_form(workspace_id: int, data: FormCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    # If a form with the same name and type already exists for this
    # workspace, reuse it instead of creating duplicates.
    existing = db.query(Form).filter(
        Form.workspace_id == workspace_id,
        Form.name == data.name,
        Form.is_contact_form == data.is_contact_form,
    ).first()
    if existing:
        f = existing
    else:
        f = Form(
            workspace_id=workspace_id,
            name=data.name,
            description=data.description,
            fields=data.fields,
            is_contact_form=data.is_contact_form,
        )
        db.add(f)
        db.commit()
        db.refresh(f)
    # For non-contact forms, automatically link the new form
    # to all booking types in this workspace so that post-booking
    # forms are created without extra configuration.
    if not data.is_contact_form:
        from app.models.booking import BookingType

        bts = db.query(BookingType).filter(BookingType.workspace_id == workspace_id).all()
        for bt in bts:
            current = bt.form_ids or []
            if f.id not in current:
                bt.form_ids = current + [f.id]
        db.commit()

    return {"id": f.id, "name": f.name}

@router.get("/{workspace_id}/form-submissions")
def list_form_submissions(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    subs = db.query(FormSubmission).join(Form).filter(Form.workspace_id == workspace_id).order_by(FormSubmission.created_at.desc()).all()
    result = []
    for s in subs:
        f = db.query(Form).filter(Form.id == s.form_id).first()
        result.append({
            "id": s.id,
            "form_name": f.name if f else "",
            "booking_id": s.booking_id,
            "status": s.status,
            "data": s.data,
            "completed_at": str(s.completed_at) if s.completed_at else None
        })
    return result

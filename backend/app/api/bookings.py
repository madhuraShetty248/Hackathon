from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.models.booking import Booking, BookingType
from app.models.workspace import Workspace
from app.schemas import BookingTypeCreate, BookingCreate
from app.api.workspaces import _get_workspace_access
from app.auth import get_current_user
from app.services.automation import on_booking_created

router = APIRouter(prefix="/workspaces", tags=["bookings"])

@router.get("/{workspace_id}/booking-types")
def list_booking_types(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    types = db.query(BookingType).filter(BookingType.workspace_id == workspace_id).all()
    return [{"id": t.id, "name": t.name, "duration_minutes": t.duration_minutes, "availability": t.availability, "location": t.location, "form_ids": t.form_ids or []} for t in types]

@router.post("/{workspace_id}/booking-types")
def create_booking_type(workspace_id: int, data: BookingTypeCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    # Avoid creating duplicate booking types with the same name
    # and duration for this workspace.
    existing = db.query(BookingType).filter(
        BookingType.workspace_id == workspace_id,
        BookingType.name == data.name,
        BookingType.duration_minutes == data.duration_minutes,
    ).first()
    if existing:
        bt = existing
    else:
        bt = BookingType(
            workspace_id=workspace_id,
            name=data.name,
            duration_minutes=data.duration_minutes,
            availability=data.availability,
            location=data.location,
        )
        db.add(bt)
        db.commit()
        db.refresh(bt)
    return {"id": bt.id, "name": bt.name}

@router.patch("/{workspace_id}/booking-types/{type_id}")
def update_booking_type(workspace_id: int, type_id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    bt = db.query(BookingType).filter(BookingType.id == type_id, BookingType.workspace_id == workspace_id).first()
    if not bt:
        raise HTTPException(status_code=404, detail="Not found")
    if "form_ids" in data:
        bt.form_ids = data["form_ids"]
    db.commit()
    return {"id": bt.id}

@router.get("/{workspace_id}/bookings")
def list_bookings(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    bookings = db.query(Booking).filter(Booking.workspace_id == workspace_id).order_by(Booking.scheduled_at.desc()).all()
    result = []
    for b in bookings:
        c = db.query(Contact).filter(Contact.id == b.contact_id).first()
        bt = db.query(BookingType).filter(BookingType.id == b.booking_type_id).first()
        result.append({
            "id": b.id,
            "contact_name": c.name if c else "",
            "contact_email": c.email if c else "",
            "booking_type": bt.name if bt else "",
            "scheduled_at": str(b.scheduled_at),
            "status": b.status,
            "confirmation_sent": b.confirmation_sent
        })
    return result

@router.post("/{workspace_id}/bookings/{booking_id}/status")
def update_booking_status(workspace_id: int, booking_id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.workspace_id == workspace_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Not found")
    if "status" in data:
        b.status = data["status"]
    db.commit()
    return {"id": b.id, "status": b.status}

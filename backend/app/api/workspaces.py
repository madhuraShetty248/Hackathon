from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, WorkspaceMember
from app.models.workspace import Workspace
from app.schemas import WorkspaceCreate, WorkspaceUpdate, IntegrationConfig
from app.auth import get_current_user

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

def _get_workspace_access(workspace_id: int, user: User, db: Session) -> WorkspaceMember:
    m = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user.id
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Access denied")
    return m

@router.get("")
def list_workspaces(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    members = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).all()
    workspaces = []
    for m in members:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        if ws:
            workspaces.append({
                "id": ws.id,
                "slug": ws.slug,
                "name": ws.name,
                "is_active": ws.is_active,
                "onboarding_step": ws.onboarding_step,
                "role": m.role,
                "email_connected": ws.email_connected,
                "sms_connected": ws.sms_connected,
                "calendar_connected": getattr(ws, "calendar_connected", False),
                "storage_connected": getattr(ws, "storage_connected", False),
            })
    return workspaces

@router.post("")
def create_workspace(data: WorkspaceCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = Workspace(
        name=data.name,
        address=data.address,
        timezone=data.timezone,
        contact_email=data.contact_email
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    import re
    base = re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-')[:30]
    ws.slug = f"{base}-{ws.id}"
    db.commit()
    m = WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner", permissions='["inbox","bookings","forms","inventory"]')
    db.add(m)
    db.commit()
    return {"id": ws.id, "slug": ws.slug, "name": ws.name}

@router.get("/{workspace_id}")
def get_workspace(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {
        "id": ws.id,
        "slug": ws.slug,
        "name": ws.name,
        "address": ws.address,
        "timezone": ws.timezone,
        "contact_email": ws.contact_email,
        "is_active": ws.is_active,
        "onboarding_step": ws.onboarding_step,
        "email_connected": ws.email_connected,
        "sms_connected": ws.sms_connected,
        "calendar_connected": ws.calendar_connected,
        "storage_connected": ws.storage_connected,
    }

@router.patch("/{workspace_id}")
def update_workspace(workspace_id: int, data: WorkspaceUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(ws, k, v)
    db.commit()
    return {"id": ws.id}

@router.post("/{workspace_id}/integrations")
def save_integrations(workspace_id: int, data: IntegrationConfig, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if data.sendgrid_api_key is not None:
        ws.sendgrid_api_key = data.sendgrid_api_key
        ws.email_connected = bool(data.sendgrid_api_key)
    if data.from_email is not None:
        ws.from_email = data.from_email
    if data.twilio_account_sid is not None:
        ws.twilio_account_sid = data.twilio_account_sid
    if data.twilio_auth_token is not None:
        ws.twilio_auth_token = data.twilio_auth_token
    if data.twilio_phone_number is not None:
        ws.twilio_phone_number = data.twilio_phone_number
        ws.sms_connected = bool(data.twilio_account_sid and data.twilio_phone_number)
    # Calendar
    if data.google_calendar_id is not None:
        ws.google_calendar_id = data.google_calendar_id or None
    if data.google_credentials_json is not None:
        ws.google_credentials_json = data.google_credentials_json or None
        ws.calendar_connected = bool(ws.google_calendar_id and data.google_credentials_json)
    # File storage (S3)
    if data.s3_bucket is not None:
        ws.s3_bucket = data.s3_bucket or None
    if data.s3_credentials_json is not None:
        ws.s3_credentials_json = data.s3_credentials_json or None
        ws.storage_connected = bool(ws.s3_bucket and data.s3_credentials_json)
    db.commit()
    return {
        "email_connected": ws.email_connected,
        "sms_connected": ws.sms_connected,
        "calendar_connected": ws.calendar_connected,
        "storage_connected": ws.storage_connected,
    }

@router.post("/{workspace_id}/activate")
def activate_workspace(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # In this prototype we allow activation even without real
    # email/SMS integrations configured so the flow is not blocked
    # during demos. Integrations remain optional.
    from app.models.booking import BookingType
    bt_count = db.query(BookingType).filter(BookingType.workspace_id == workspace_id).count()
    if bt_count == 0:
        raise HTTPException(status_code=400, detail="Add at least one booking type")
    ws.is_active = True
    ws.onboarding_step = 8
    db.commit()
    return {"is_active": True}

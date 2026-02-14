from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.workspace import Workspace
from app.schemas import ContactCreate
from app.api.workspaces import _get_workspace_access
from app.auth import get_current_user
from app.services.automation import on_new_contact

router = APIRouter(prefix="/workspaces", tags=["contacts"])

@router.get("/{workspace_id}/contacts")
def list_contacts(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    contacts = db.query(Contact).filter(Contact.workspace_id == workspace_id).order_by(Contact.created_at.desc()).all()
    return [{"id": c.id, "name": c.name, "email": c.email, "phone": c.phone, "source": c.source, "created_at": str(c.created_at)} for c in contacts]

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.models.user import User, WorkspaceMember
from app.schemas import StaffInvite
from app.api.workspaces import _get_workspace_access
from app.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/workspaces", tags=["staff"])

@router.get("/{workspace_id}/staff")
def list_staff(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _get_workspace_access(workspace_id, user, db)
    if m.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can view staff")
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
    result = []
    for mem in members:
        u = db.get(User, mem.user_id)
        if u:
            result.append({
                "id": mem.id,
                "user_id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "role": mem.role,
                "permissions": json.loads(mem.permissions) if mem.permissions else []
            })
    return result

@router.post("/{workspace_id}/staff/invite")
def invite_staff(workspace_id: int, data: StaffInvite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _get_workspace_access(workspace_id, user, db)
    if m.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can invite staff")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        # Add to workspace if not already
        existing_m = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == existing.id
        ).first()
        if existing_m:
            raise HTTPException(status_code=400, detail="User already in workspace")
        new_m = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=existing.id,
            role="staff",
            permissions=json.dumps(data.permissions)
        )
        db.add(new_m)
        db.commit()
        return {"id": new_m.id, "email": existing.email, "role": "staff"}
    # Create new user with temp password
    temp_password = "temp" + data.email[:3] + "123!"
    new_user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(temp_password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    new_m = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=new_user.id,
        role="staff",
        permissions=json.dumps(data.permissions)
    )
    db.add(new_m)
    db.commit()
    return {"id": new_m.id, "email": new_user.email, "role": "staff", "temp_password": temp_password}

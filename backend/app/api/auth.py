from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, WorkspaceMember
from app.models.workspace import Workspace
from app.schemas import UserCreate, UserLogin, Token
from app.auth import get_password_hash, create_access_token, verify_password, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    role = m.role if m else "owner"
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": role}

@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Create default workspace
    ws = Workspace(name=f"{data.full_name}'s Workspace", contact_email=data.email)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    # Generate slug
    import re
    base = re.sub(r'[^a-z0-9]+', '-', data.email.split('@')[0].lower()).strip('-')
    ws.slug = f"{base}-{ws.id}"
    db.commit()
    # Add user as owner
    m = WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner", permissions='["inbox","bookings","forms","inventory"]')
    db.add(m)
    db.commit()
    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": "owner"
        }
    )

@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    m = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    role = m.role if m else "owner"
    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": role
        }
    )

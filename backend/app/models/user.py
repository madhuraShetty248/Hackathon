from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    OWNER = "owner"
    STAFF = "staff"

class StaffPermission(str, enum.Enum):
    INBOX = "inbox"
    BOOKINGS = "bookings"
    FORMS = "forms"
    INVENTORY = "inventory"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workspaces = relationship("Workspace", secondary="workspace_members", back_populates="owners")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="owner")  # owner, staff
    permissions = Column(String(500), default="")  # JSON array: ["inbox","bookings","forms","inventory"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

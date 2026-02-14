#!/usr/bin/env python3
"""Create a staff user for testing. Run from backend dir: python scripts/seed_staff.py

Staff login: staff@demo.com / staff123
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User, WorkspaceMember
from app.models.workspace import Workspace
from app.auth import get_password_hash

def main():
    db = SessionLocal()
    try:
        # Get or create owner workspace
        owner = db.query(User).filter(User.email == "owner@demo.com").first()
        if not owner:
            owner = User(
                email="owner@demo.com",
                full_name="Demo Owner",
                hashed_password=get_password_hash("owner123"),
            )
            db.add(owner)
            db.commit()
            db.refresh(owner)
            ws = Workspace(name="Demo Workspace", contact_email=owner.email)
            db.add(ws)
            db.commit()
            db.refresh(ws)
            import re
            base = re.sub(r'[^a-z0-9]+', '-', owner.email.split('@')[0].lower()).strip('-')
            ws.slug = f"{base}-{ws.id}"
            db.commit()
            m = WorkspaceMember(workspace_id=ws.id, user_id=owner.id, role="owner", permissions='["inbox","bookings","forms","inventory"]')
            db.add(m)
            db.commit()
            workspace_id = ws.id
        else:
            m = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == owner.id, WorkspaceMember.role == "owner").first()
            workspace_id = m.workspace_id if m else None
            if not workspace_id:
                ws = db.query(Workspace).first()
                workspace_id = ws.id if ws else None

        if not workspace_id:
            print("No workspace found. Create one via app first.")
            return

        staff = db.query(User).filter(User.email == "staff@demo.com").first()
        if staff:
            existing = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == staff.id
            ).first()
            if not existing:
                db.add(WorkspaceMember(workspace_id=workspace_id, user_id=staff.id, role="staff", permissions='["inbox","bookings","forms","inventory"]'))
                db.commit()
        else:
            staff = User(
                email="staff@demo.com",
                full_name="Demo Staff",
                hashed_password=get_password_hash("staff123"),
            )
            db.add(staff)
            db.commit()
            db.refresh(staff)
            db.add(WorkspaceMember(workspace_id=workspace_id, user_id=staff.id, role="staff", permissions='["inbox","bookings","forms","inventory"]'))
            db.commit()

        print("Staff user ready!")
        print("  Email: staff@demo.com")
        print("  Password: staff123")
        print("  Login at /login")
    finally:
        db.close()

if __name__ == "__main__":
    main()

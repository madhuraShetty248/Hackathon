"""File upload and storage API"""
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.stored_file import StoredFile
from app.api.workspaces import _get_workspace_access
from app.auth import get_current_user
from app.services.storage import upload_file, get_file_path, UPLOADS_DIR

router = APIRouter(prefix="/workspaces", tags=["files"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".txt", ".csv"}


@router.post("/{workspace_id}/files/upload")
def upload_workspace_file(
    workspace_id: int,
    file: UploadFile = File(...),
    subpath: str = "general",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a file. Uses local storage; S3 if workspace has it configured."""
    _get_workspace_access(workspace_id, user, db)
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    ext = Path(file.filename or "").suffix.lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    use_s3 = ws.storage_connected and ws.s3_bucket and ws.s3_credentials_json
    s3_creds = None
    if use_s3 and ws.s3_credentials_json:
        import json
        try:
            s3_creds = json.loads(ws.s3_credentials_json)
        except Exception:
            use_s3 = False

    ok, url_path, err = upload_file(
        file_content=content,
        filename=file.filename or "upload",
        workspace_id=workspace_id,
        subpath=subpath,
        content_type=file.content_type,
        use_s3=use_s3,
        s3_bucket=ws.s3_bucket if use_s3 else None,
        s3_credentials=s3_creds,
    )
    if not ok:
        raise HTTPException(status_code=500, detail=err or "Upload failed")

    stored = StoredFile(
        workspace_id=workspace_id,
        original_filename=file.filename or "upload",
        storage_path=url_path,
        content_type=file.content_type,
        subpath=subpath,
        file_size=len(content),
    )
    db.add(stored)
    db.commit()
    db.refresh(stored)
    # Full URL needs base - client will prepend API base
    return {"id": stored.id, "url": url_path, "filename": stored.original_filename}


@router.get("/{workspace_id}/files")
def list_workspace_files(
    workspace_id: int,
    subpath: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List uploaded files for workspace."""
    _get_workspace_access(workspace_id, user, db)
    q = db.query(StoredFile).filter(StoredFile.workspace_id == workspace_id)
    if subpath:
        q = q.filter(StoredFile.subpath == subpath)
    files = q.order_by(StoredFile.created_at.desc()).all()
    return [
        {
            "id": f.id,
            "filename": f.original_filename,
            "url": f.storage_path,
            "subpath": f.subpath,
            "file_size": f.file_size,
            "created_at": str(f.created_at),
        }
        for f in files
    ]


@router.get("/{workspace_id}/files/serve/{subpath}/{filename}")
def serve_file(
    workspace_id: int,
    subpath: str,
    filename: str,
    user: User = Depends(get_current_user),
):
    """Serve a locally stored file. For S3 files, URL is returned from list."""
    path = get_file_path(workspace_id, subpath, filename)
    if not path:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=filename)

"""File storage integration - local filesystem + optional S3. Abstracted for graceful failure."""
import logging
import os
import uuid
from pathlib import Path
from typing import Optional, BinaryIO

logger = logging.getLogger(__name__)

# Base directory for local uploads (relative to backend root)
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def upload_file(
    file_content: bytes,
    filename: str,
    workspace_id: int,
    subpath: str = "general",
    content_type: Optional[str] = None,
    use_s3: bool = False,
    s3_bucket: Optional[str] = None,
    s3_credentials: Optional[dict] = None,
) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Upload file to storage. Returns (success, url_or_path, error_message).
    Uses local filesystem by default; S3 if use_s3 and credentials provided.
    """
    ext = Path(filename).suffix or ""
    safe_name = f"{uuid.uuid4().hex[:12]}{ext}"

    if use_s3 and s3_bucket and s3_credentials:
        return _upload_s3(file_content, safe_name, workspace_id, subpath, content_type, s3_bucket, s3_credentials)
    return _upload_local(file_content, filename, safe_name, workspace_id, subpath)


def _upload_local(
    file_content: bytes,
    original_filename: str,
    safe_name: str,
    workspace_id: int,
    subpath: str,
) -> tuple[bool, Optional[str], Optional[str]]:
    """Store file on local filesystem."""
    try:
        rel = Path("workspace") / str(workspace_id) / subpath
        dir_path = UPLOADS_DIR / rel
        _ensure_dir(dir_path)
        file_path = dir_path / safe_name
        file_path.write_bytes(file_content)
        # Return path for API serve route: /workspaces/{id}/files/serve/{subpath}/{filename}
        url_path = f"/workspaces/{workspace_id}/files/serve/{subpath}/{safe_name}"
        return True, url_path, None
    except Exception as e:
        logger.exception("Local file upload failed")
        return False, None, str(e)


def _upload_s3(
    file_content: bytes,
    safe_name: str,
    workspace_id: int,
    subpath: str,
    content_type: Optional[str],
    bucket: str,
    creds: dict,
) -> tuple[bool, Optional[str], Optional[str]]:
    """Store file in S3-compatible storage."""
    try:
        import boto3
        key = f"workspace/{workspace_id}/{subpath}/{safe_name}"
        client = boto3.client(
            "s3",
            aws_access_key_id=creds.get("access_key_id"),
            aws_secret_access_key=creds.get("secret_access_key"),
            region_name=creds.get("region", "us-east-1"),
            endpoint_url=creds.get("endpoint_url"),
        )
        extra = {}
        if content_type:
            extra["ContentType"] = content_type
        client.put_object(Bucket=bucket, Key=key, Body=file_content, **extra)
        url = f"s3://{bucket}/{key}"
        if creds.get("public_url_base"):
            url = f"{creds['public_url_base'].rstrip('/')}/{key}"
        return True, url, None
    except Exception as e:
        logger.exception("S3 file upload failed")
        return False, None, str(e)


def get_file_path(workspace_id: int, subpath: str, filename: str) -> Optional[Path]:
    """Get local file path for serving. Returns None if not found or invalid."""
    rel = Path("workspace") / str(workspace_id) / subpath / filename
    full = UPLOADS_DIR / rel
    if not full.exists() or not full.is_file():
        return None
    # Basic path traversal check
    try:
        full.resolve().relative_to(UPLOADS_DIR.resolve())
    except ValueError:
        return None
    return full

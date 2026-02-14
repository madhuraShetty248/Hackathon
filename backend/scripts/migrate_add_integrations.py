"""Add calendar and storage columns to workspaces, calendar_event_id to bookings."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "careops.db")
if not os.path.exists(DB_PATH):
    print("No database found - migrations will run on first init.")
    exit(0)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# SQLite doesn't have IF NOT EXISTS for columns - use try/except
cols_workspace = [
    ("calendar_connected", "INTEGER DEFAULT 0"),
    ("google_calendar_id", "TEXT"),
    ("google_credentials_json", "TEXT"),
    ("storage_connected", "INTEGER DEFAULT 0"),
    ("s3_bucket", "TEXT"),
    ("s3_credentials_json", "TEXT"),
]
for col, typ in cols_workspace:
    try:
        cur.execute(f"ALTER TABLE workspaces ADD COLUMN {col} {typ}")
        print(f"Added workspaces.{col}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            pass
        else:
            raise

try:
    cur.execute("ALTER TABLE bookings ADD COLUMN calendar_event_id TEXT")
    print("Added bookings.calendar_event_id")
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e).lower():
        pass
    else:
        raise

# Create stored_files table if not exists
cur.execute("""
CREATE TABLE IF NOT EXISTS stored_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    content_type VARCHAR(100),
    subpath VARCHAR(100) DEFAULT 'general',
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
print("Ensured stored_files table exists")

conn.commit()
conn.close()
print("Migration complete.")

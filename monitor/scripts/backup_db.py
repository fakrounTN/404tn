# monitor/scripts/backup_db.py
import sqlite3
import os
import sys
from datetime import datetime, timezone

def backup_database(db_path=None, backup_dir=None):
    if not db_path:
        db_path = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "404tn.db"))
    if not backup_dir:
        backup_dir = os.environ.get("BACKUP_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "backups"))

    if not os.path.exists(db_path):
        print(f"Error: Source database file does not exist at {db_path}", file=sys.stderr)
        return False

    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    backup_file = os.path.join(backup_dir, f"404tn-{timestamp}.db")

    print(f"Initiating online SQLite backup from {db_path} to {backup_file}...")

    src_conn = sqlite3.connect(db_path)
    dst_conn = sqlite3.connect(backup_file)

    try:
        with dst_conn:
            src_conn.backup(dst_conn, pages=100, sleep=0.01)
        print(f"Backup completed successfully: {backup_file} ({os.path.getsize(backup_file)} bytes)")
        return True
    except Exception as e:
        print(f"Backup failed: {e}", file=sys.stderr)
        if os.path.exists(backup_file):
            try:
                os.remove(backup_file)
            except Exception:
                pass
        return False
    finally:
        src_conn.close()
        dst_conn.close()

if __name__ == "__main__":
    success = backup_database()
    sys.exit(0 if success else 1)

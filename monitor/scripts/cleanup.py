# monitor/scripts/cleanup.py
import os
import sys
import sqlite3

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import DB_PATH

def cleanup():
    print("Performing 404TN database optimization and VACUUM...")
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        conn.execute("VACUUM;")
        conn.execute("PRAGMA optimize;")
        conn.close()
        print("Database maintenance completed.")

if __name__ == "__main__":
    cleanup()

from flask import Flask, jsonify, request, send_from_directory
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_DIR = BASE_DIR / "database"
DB_PATH = DB_DIR / "service_requests.db"
app = Flask(__name__, static_folder=None)


def get_db():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS service_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_number TEXT UNIQUE,
                full_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                location TEXT NOT NULL,
                service TEXT NOT NULL,
                message TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'New',
                created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            )
        """)


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def website_files(filename):
    # Serve only files inside the website folder.
    return send_from_directory(BASE_DIR, filename)


@app.get("/api/next-job-number")
def next_job_number():
    with get_db() as conn:
        row = conn.execute("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM service_requests").fetchone()
        return jsonify(job_number=f"SWS{row['next_id']:05d}")


@app.post("/api/service-requests")
def create_service_request():
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("fullName", "")).strip()
    phone = str(data.get("phone", "")).strip()
    location = str(data.get("location", "")).strip()
    service = str(data.get("service", "")).strip()
    message = str(data.get("message", "")).strip()
    if not all([full_name, phone, location, service]):
        return jsonify(error="Please complete all required fields."), 400
    if len(full_name) > 150 or len(phone) > 40 or len(location) > 250 or len(service) > 120 or len(message) > 3000:
        return jsonify(error="One or more fields are too long."), 400

    # SQLite AUTOINCREMENT assigns a unique ID even when requests arrive together.
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO service_requests (job_number, full_name, phone, location, service, message) VALUES ('PENDING', ?, ?, ?, ?, ?)",
            (full_name, phone, location, service, message),
        )
        request_id = cursor.lastrowid
        job_number = f"SWS{request_id:05d}"
        conn.execute("UPDATE service_requests SET job_number = ? WHERE id = ?", (job_number, request_id))
    return jsonify(ok=True, job_number=job_number, message="Service request saved."), 201


@app.get("/api/service-requests")
def list_service_requests():
    # Local admin/testing endpoint; do not expose publicly without authentication.
    with get_db() as conn:
        rows = conn.execute("SELECT id, job_number, full_name, phone, location, service, message, status, created_at FROM service_requests ORDER BY id DESC").fetchall()
    return jsonify(requests=[dict(row) for row in rows])


if __name__ == "__main__":
    init_db()
    print("Sadaruwan Water Solution server starting at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)

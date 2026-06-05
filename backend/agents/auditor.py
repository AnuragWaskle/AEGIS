import sqlite3
import os
import io
from datetime import datetime, timedelta
from typing import Optional, List
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from models.schemas import AuditEvent, ThreatLevel

class AuditorAgent:
    def __init__(self):
        self.db_path = os.getenv("DB_PATH", "./database/aegis_audit.db")
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()
        
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''
        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            input_summary TEXT,
            decision TEXT NOT NULL,
            details TEXT,
            blast_radius_score INTEGER,
            blast_radius_category TEXT,
            request_id TEXT
        )
        ''')
        conn.commit()
        conn.close()
        
    async def log(self, event: AuditEvent, request_id: str = "") -> None:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        br_score = event.blast_radius.score if event.blast_radius else None
        br_cat = event.blast_radius.category if event.blast_radius else None
        
        c.execute('''
        INSERT INTO audit_events 
        (id, timestamp, event_type, severity, agent_name, input_summary, decision, details, blast_radius_score, blast_radius_category, request_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            event.id,
            event.timestamp.isoformat(),
            event.event_type,
            event.severity.value,
            event.agent_name,
            event.input_summary,
            event.decision,
            json.dumps(event.details),
            br_score,
            br_cat,
            request_id
        ))
        conn.commit()
        conn.close()

    async def get_events(self, limit=100, severity=None, since=None) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        query = "SELECT * FROM audit_events WHERE 1=1"
        params = []
        
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        if since:
            query += " AND timestamp >= ?"
            params.append(since)
            
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        c.execute(query, params)
        rows = c.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    async def get_stats(self) -> dict:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Total events
        c.execute("SELECT COUNT(*) FROM audit_events")
        total_events = c.fetchone()[0]
        
        # Blocked count
        c.execute("SELECT COUNT(*) FROM audit_events WHERE decision = 'BLOCKED'")
        blocked_count = c.fetchone()[0]
        
        # Threat breakdown
        breakdown = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        c.execute("SELECT severity, COUNT(*) FROM audit_events GROUP BY severity")
        for row in c.fetchall():
            if row[0] in breakdown:
                breakdown[row[0]] = row[1]
                
        # Last 24h
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        c.execute("SELECT COUNT(*) FROM audit_events WHERE timestamp >= ?", (yesterday,))
        last_24h = c.fetchone()[0]
        
        conn.close()
        
        return {
            "total_events": total_events,
            "blocked_count": blocked_count,
            "threat_breakdown": breakdown,
            "top_attack_types": [],  # Could be aggregated from details
            "last_24h_attacks": last_24h,
            "uptime_hours": 99.9  # Mock for demo
        }

    async def export_csv(self) -> str:
        events = await self.get_events(limit=1000)
        if not events:
            return "id,timestamp,event_type,severity,agent_name,decision,input_summary"
            
        header = "id,timestamp,event_type,severity,agent_name,decision,input_summary\n"
        lines = [header]
        for e in events:
            # Escape quotes
            summary = str(e['input_summary']).replace('"', '""')
            lines.append(f"{e['id']},{e['timestamp']},{e['event_type']},{e['severity']},{e['agent_name']},{e['decision']},\"{summary}\"\n")
            
        return "".join(lines)

    async def generate_compliance_report(self) -> bytes:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, 750, "AEGIS Security Audit Report")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, 720, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
        
        stats = await self.get_stats()
        c.drawString(50, 690, f"Total Events: {stats['total_events']}")
        c.drawString(50, 670, f"Blocked Attacks: {stats['blocked_count']}")
        
        c.drawString(50, 630, "Recent High/Critical Events:")
        
        events = await self.get_events(limit=20)
        y = 600
        c.setFont("Helvetica", 10)
        for e in events:
            if e['severity'] in ['HIGH', 'CRITICAL']:
                c.drawString(50, y, f"{e['timestamp'][:19]} | {e['severity']} | {e['agent_name']} | {e['decision']}")
                c.drawString(70, y-15, f"Input: {str(e['input_summary'])[:80]}...")
                y -= 40
                if y < 50:
                    c.showPage()
                    y = 750
        
        c.save()
        pdf = buffer.getvalue()
        buffer.close()
        return pdf

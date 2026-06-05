from fastapi import APIRouter, Query, Response
from typing import Optional
from agents.auditor import AuditorAgent
from agents.memory_sentinel import MemorySentinelAgent

router = APIRouter()
auditor = AuditorAgent()
memory_sentinel = MemorySentinelAgent()

@router.get("/events")
async def get_events(
    limit: int = Query(50, ge=1, le=500),
    severity: Optional[str] = None,
    since: Optional[str] = None,
    agent: Optional[str] = None,
    search: Optional[str] = None,
):
    return await auditor.get_events(
        limit=limit,
        severity=severity,
        since=since,
        agent=agent,
        search=search,
    )

@router.get("/stats")
async def get_stats():
    return await auditor.get_stats()

@router.get("/export/csv")
async def export_csv():
    csv_data = await auditor.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aegis_audit_export.csv"},
    )

@router.get("/export/pdf")
async def export_pdf():
    pdf_data = await auditor.generate_compliance_report()
    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=aegis_compliance_report.pdf"},
    )

@router.delete("/clear")
async def clear_audit():
    import sqlite3
    conn = sqlite3.connect(auditor.db_path)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM audit_events")
    count = c.fetchone()[0]
    c.execute("DELETE FROM audit_events")
    conn.commit()
    conn.close()
    return {"cleared": True, "count": count}

@router.get("/memory/stats")
async def get_memory_stats():
    return await memory_sentinel.get_memory_stats()

@router.get("/memory/quarantine")
async def get_memory_quarantine():
    import sqlite3
    conn = sqlite3.connect(memory_sentinel.db_path)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM agent_memories WHERE is_quarantined = 1 ORDER BY created_at DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/memory/audit")
async def audit_memory():
    return await memory_sentinel.audit_all_memories()

@router.delete("/memory/quarantine/{memory_id}")
async def delete_quarantine(memory_id: str):
    import sqlite3
    conn = sqlite3.connect(memory_sentinel.db_path)
    c = conn.cursor()
    c.execute("DELETE FROM agent_memories WHERE id = ?", (memory_id,))
    conn.commit()
    conn.close()
    return {"deleted": True, "memory_id": memory_id}

@router.post("/memory/restore/{memory_id}")
async def restore_quarantine(memory_id: str):
    import sqlite3
    conn = sqlite3.connect(memory_sentinel.db_path)
    c = conn.cursor()
    c.execute("UPDATE agent_memories SET is_quarantined = 0, quarantine_reason = quarantine_reason || ' [human_reviewed=true]' WHERE id = ?", (memory_id,))
    conn.commit()
    conn.close()
    return {"restored": True, "memory_id": memory_id}

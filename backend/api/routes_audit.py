from fastapi import APIRouter, Query, Response
from typing import Optional
from agents.auditor import AuditorAgent

router = APIRouter()
auditor = AuditorAgent()

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

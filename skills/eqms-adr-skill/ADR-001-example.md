# ADR-001: Dual-Layer Validation for JSON Fields

**Project:** EQMS  
**Status:** ACCEPTED  
**Date:** May 2026  
**Authors:** Senior Architect  
**Affected Layers:** Backend (FastAPI) · Database (SQL Server)

---

## Context

The EQMS schema includes JSON fields (`extra_data`, `query_definition`) to allow flexible, laboratory-specific attributes without schema bloat. However, unvalidated JSON is a security and data quality risk.

**Open Question:** Where should JSON validation happen—only in FastAPI, only in SQL, or both?

---

## Decision

**Primary Decision:** Validate JSON at both layers (dual-layer validation).

| Aspect | Details |
|--------|---------|
| **FastAPI (Pydantic)** | Validate JSON shape & type at the API boundary. Reject invalid requests before they hit the database. |
| **SQL Server** | `ISJSON()` constraint ensures no malformed JSON ever reaches the database. |
| **Rationale** | This follows the **Three Laws:** function contract is explicit (Pydantic schema), database enforces truth, frontend doesn't attempt validation. |
| **Trade-offs** | **Gain:** Defense in depth + audit trail clarity. **Lose:** Slightly more validation code. |

---

## Consequences

| Positive | Negative |
|----------|----------|
| Prevents injection via direct SQL clients | Requires Pydantic model per JSON structure |
| Clear error messages reach the user | Migration complexity for legacy JSON |
| Database constraint catches edge cases | Minimal performance cost (~0.1% latency) |
| Audit log captures failed attempts | Team must maintain both validators |

---

## Implementation Notes

### FastAPI Example
```python
from pydantic import BaseModel, field_validator

class DocumentExtraData(BaseModel):
    lab_id: str
    calibration_date: str
    notes: str | None = None
    
    @field_validator('calibration_date')
    def validate_iso_date(cls, v):
        # ISO 8601 or reject
        datetime.fromisoformat(v)
        return v

class DocumentCreate(BaseModel):
    title: str
    extra_data: DocumentExtraData  # Validates here
```

### SQL Server (Alembic Migration)
```sql
ALTER TABLE document
ADD CONSTRAINT chk_extra_data_valid
CHECK (ISJSON(extra_data) = 1);
```

### Testing
- **pytest:** Unit test Pydantic validators in `/Backend/app/tests/test_schemas.py`
- **pytest:** Integration test DB constraint rejection in `/Backend/app/tests/test_db_constraints.py`
- **Postman:** POST invalid JSON, expect 422 (Unprocessable Entity)

---

## Checklist
- [x] Names reveal intent (field names are business terms, not abbreviations)
- [x] Each function does one thing (validator is single-purpose)
- [x] Comments explain WHY (constraint justifies `ISJSON()`)
- [x] FastAPI enforces rules before DB access
- [x] SQL Server guarantees truth
- [x] No permission logic in validation

---

## Related ADRs
- (None yet — first decision in EQMS)

---

*Example only. Adapt to your actual `extra_data` schema.*

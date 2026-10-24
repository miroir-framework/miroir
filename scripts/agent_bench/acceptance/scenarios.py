"""Expected results of the acceptance scenarios (#550), computed from the Library data files.

The scenarios never copy expected values: they recompute them from
`packages/miroir-example-library/assets/library_data/`, so the expectations follow the data.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
LIBRARY_DATA = REPO_ROOT / "packages" / "miroir-example-library" / "assets" / "library_data"

USER_ENTITY = "ca794e28-b2dc-45b3-8137-00151557eea8"
BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
LOAN_ENTITY = "e81078f3-2de7-4301-bd79-d3a156aec149"

# Feature parameters, the ones the task prompts name. Overdue loans take a cutoff date rather than "N days before a
# date" because Miroir has no date arithmetic transformer (#550 slice 4 dry run).
STARTED_BEFORE = "2026-07-02"
LENDING_LIMIT = 8


@dataclass(frozen=True)
class Loan:
    uuid: str
    user: str
    book: str
    start: datetime
    end: datetime | None


def _instances(entity: str, data_dir: Path = LIBRARY_DATA) -> list[dict]:
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted((data_dir / entity).glob("*.json"))]


def _date(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def loans(data_dir: Path = LIBRARY_DATA) -> list[Loan]:
    return [
        Loan(
            uuid=item["uuid"],
            user=item["user"],
            book=item["book"],
            start=_date(item["startDate"]),
            end=_date(item["endDate"]) if item.get("endDate") else None,
        )
        for item in _instances(LOAN_ENTITY, data_dir)
    ]


def user_names(data_dir: Path = LIBRARY_DATA) -> dict[str, str]:
    """User uuid to "firstName lastName" as the Library data writes it in `name`."""
    return {item["uuid"]: item["name"] for item in _instances(USER_ENTITY, data_dir)}


def book_uuids(data_dir: Path = LIBRARY_DATA) -> list[str]:
    return [item["uuid"] for item in _instances(BOOK_ENTITY, data_dir)]


def open_loans(data_dir: Path = LIBRARY_DATA) -> list[Loan]:
    return [loan for loan in loans(data_dir) if loan.end is None]


def overdue_loans(started_before: str = STARTED_BEFORE, data_dir: Path = LIBRARY_DATA) -> set[str]:
    """Uuids of the loans with no endDate whose startDate is before `started_before`."""
    cutoff = _date(started_before)
    return {loan.uuid for loan in open_loans(data_dir) if loan.start < cutoff}


def open_loans_per_user(data_dir: Path = LIBRARY_DATA) -> Counter[str]:
    """Open loans per User uuid."""
    return Counter(loan.user for loan in open_loans(data_dir))


def users_at_limit(limit: int = LENDING_LIMIT, data_dir: Path = LIBRARY_DATA) -> list[str]:
    """Users whose next loan must be refused."""
    return sorted(user for user, count in open_loans_per_user(data_dir).items() if count >= limit)


def users_below_limit(limit: int = LENDING_LIMIT, data_dir: Path = LIBRARY_DATA) -> list[str]:
    """Users whose next loan must be accepted, with one free place at most so a second loan is refused."""
    counts = open_loans_per_user(data_dir)
    return sorted(user for user in user_names(data_dir) if counts.get(user, 0) < limit)

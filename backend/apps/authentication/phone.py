"""Validation helpers for normalized international phone numbers."""
import re

from database.mongodb import drivers_collection, users_collection


_PHONE_FORMAT = re.compile(r"^\+[1-9][0-9]{7,14}$")


def normalize_phone(value):
    """Return E.164-style phone text or raise ValueError for invalid input."""
    if not isinstance(value, str):
        raise ValueError("Enter a valid mobile number with its country code.")
    compact = re.sub(r"[\s().-]", "", value.strip())
    if not _PHONE_FORMAT.fullmatch(compact):
        raise ValueError("Enter a valid international number, for example +919876543210.")
    if compact.startswith("+91"):
        national = compact[3:]
        if len(national) != 10 or national[0] not in "6789":
            raise ValueError("Enter a valid 10-digit Indian mobile number.")
    return compact


def phone_in_use(phone, exclude_id=None):
    """Check normalized values across user/driver records without a risky unique index."""
    for collection in (users_collection, drivers_collection):
        for account in collection.find({"phone": {"$type": "string", "$ne": ""}}, {"_id": 1, "phone": 1}):
            if exclude_id is not None and account.get("_id") == exclude_id:
                continue
            try:
                if normalize_phone(account.get("phone")) == phone:
                    return True
            except ValueError:
                # Legacy records may contain unparseable phone text; it cannot
                # be equated safely to a valid E.164 number.
                continue
    return False

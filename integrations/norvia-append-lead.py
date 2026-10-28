#!/usr/bin/env python3
"""Kestra appender. Run in a flow with concurrency limit=1 and QUEUE behavior.

Uses only Python's standard library. OAuth credentials and lead bodies are never
logged. A successful output requires a confirmed row, including on reexecution.
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from uuid import UUID

try:
    from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
except ImportError:  # Python <3.9 is not the deployment runtime.
    ZoneInfo = None
    ZoneInfoNotFoundError = Exception

DEFAULT_SPREADSHEET_ID = "1yRGXffNhIA2lg4ZmI2nRSBSYhHs1LnLMZ2G4bu0B9O8"
TAB_NAME = "Leads LP"
HEADERS = [
    "request_id", "recebido_em", "nome", "empresa", "cargo", "email",
    "whatsapp", "consentimento", "origem", "utm_source", "utm_medium",
    "utm_campaign", "utm_content", "utm_term", "pagina", "status_comercial",
    "observacoes", "cliente", "versao_formulario",
]
ROLES = {"Dono ou diretor", "Gestor de TI", "Gestor de operações", "Outro"}
UTM_KEYS = tuple(HEADERS[9:14])
LEAD_KEYS = {"requestId", "name", "company", "role", "email", "whatsapp", "consent", "website", "landingPath", "attribution"}
IMMUTABLE_COLUMNS = tuple(i for i in range(19) if i not in {1, 15, 16})


class LeadError(Exception):
    """A safe error code, with no provider response, credential, or lead value."""


def _string(value: Any, maximum: int, minimum: int = 0, *, trim: bool = False, single_line: bool = False) -> str:
    if not isinstance(value, str):
        raise LeadError("INVALID_LEAD")
    value = value.strip() if trim else value
    length = len(value.encode("utf-16-le", errors="surrogatepass")) // 2
    if not minimum <= length <= maximum or (single_line and ("\r" in value or "\n" in value)):
        raise LeadError("INVALID_LEAD")
    return value


def decode_lead(raw: str) -> dict[str, Any]:
    """Accept an object JSON body or Kestra's one extra JSON-string envelope."""
    if not isinstance(raw, str) or len(raw.encode("utf-8", errors="surrogatepass")) > 16384:
        raise LeadError("INVALID_LEAD")
    try:
        body: Any = json.loads(raw)
        if isinstance(body, str):
            body = json.loads(body)
    except (ValueError, TypeError, RecursionError):
        raise LeadError("INVALID_LEAD") from None
    if not isinstance(body, dict) or set(body) - LEAD_KEYS:
        raise LeadError("INVALID_LEAD")
    request_id = _string(body.get("requestId"), 36, 36)
    canonical_id = request_id.lower()
    if canonical_id not in {"00000000-0000-0000-0000-000000000000", "ffffffff-ffff-ffff-ffff-ffffffffffff"} and not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", canonical_id):
        raise LeadError("INVALID_LEAD")
    try:
        UUID(request_id)
    except ValueError:
        raise LeadError("INVALID_LEAD") from None
    name = _string(body.get("name"), 120, 3, trim=True, single_line=True)
    company = _string(body.get("company"), 160, 2, trim=True, single_line=True)
    role = _string(body.get("role"), 80)
    if role not in ROLES or body.get("consent") is not True:
        raise LeadError("INVALID_LEAD")
    email = _string(body.get("email"), 160, 3, trim=True)
    # Same practical ASCII email boundary as the LP's Zod email validator.
    if not re.fullmatch(r"(?!\.)(?!.*\.\.)[A-Za-z0-9_'+\-.]*[A-Za-z0-9_+\-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}", email):
        raise LeadError("INVALID_LEAD")
    whatsapp = _string(body.get("whatsapp"), 24, 1, trim=True)
    digits = re.sub(r"[^0-9]", "", whatsapp)
    national = digits[2:] if digits.startswith("55") and len(digits) > 11 else digits
    if not re.fullmatch(r"[1-9]{2}(?:[2-5][0-9]{7}|9[0-9]{8})", national):
        raise LeadError("INVALID_LEAD")
    website = _string(body.get("website", ""), 200)
    if website:
        raise LeadError("INVALID_LEAD")
    landing_path = _string(body.get("landingPath", "/"), 250)
    if not re.fullmatch(r"/\S*", landing_path):
        raise LeadError("INVALID_LEAD")
    attribution = body.get("attribution", {})
    if not isinstance(attribution, dict) or set(attribution) - set(UTM_KEYS):
        raise LeadError("INVALID_LEAD")
    attribution = {key: _string(value, 160) for key, value in attribution.items()}
    return {
        "requestId": request_id, "name": name, "company": company, "role": role,
        "email": email, "whatsapp": "+55" + national, "consent": True,
        "landingPath": landing_path, "attribution": attribution,
    }


def received_timestamp() -> str:
    try:
        zone = ZoneInfo("America/Sao_Paulo") if ZoneInfo else timezone(timedelta(hours=-3))
    except ZoneInfoNotFoundError:
        # Current Sao Paulo offset. Keeps stdlib-only Windows execution usable.
        zone = timezone(timedelta(hours=-3), "America/Sao_Paulo")
    return datetime.now(zone).isoformat(timespec="seconds")


def lead_row(lead: dict[str, Any], timestamp: str | None = None) -> list[str]:
    return [
        lead["requestId"], timestamp or received_timestamp(), lead["name"],
        lead["company"], lead["role"], lead["email"], lead["whatsapp"], "true",
        "LP Norvia", *(lead["attribution"].get(key, "") for key in UTM_KEYS),
        lead["landingPath"], "Novo", "", "norvia-security", "v1",
    ]


def http_json(method: str, url: str, *, data: bytes | None = None, headers: dict[str, str] | None = None) -> dict[str, Any]:
    request = Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urlopen(request, timeout=25) as response:
            result = json.load(response)
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        raise LeadError("DESTINATION_UNAVAILABLE") from None
    if not isinstance(result, dict):
        raise LeadError("DESTINATION_INVALID_RESPONSE")
    return result


def oauth_access_token(source: str, request: Callable[..., dict[str, Any]] = http_json) -> str:
    """Read GOOGLE_OAUTH_JSON as private file path or an inline JSON object."""
    try:
        raw = source if source.lstrip().startswith("{") else Path(source).read_text(encoding="utf-8-sig")
        credentials = json.loads(raw)
        client = credentials.get("installed", credentials.get("web", credentials))
        client_id = client.get("client_id")
        client_secret = client.get("client_secret")
        refresh_token = credentials.get("refresh_token") or client.get("refresh_token") or credentials.get("token", {}).get("refresh_token")
        if not all(isinstance(value, str) and value for value in (client_id, client_secret, refresh_token)):
            raise ValueError
    except (OSError, ValueError, TypeError, AttributeError):
        raise LeadError("OAUTH_CONFIGURATION_INVALID") from None
    result = request("POST", "https://oauth2.googleapis.com/token", data=urlencode({
        "grant_type": "refresh_token", "client_id": client_id,
        "client_secret": client_secret, "refresh_token": refresh_token,
    }).encode("ascii"), headers={"Content-Type": "application/x-www-form-urlencoded"})
    token = result.get("access_token")
    if not isinstance(token, str) or not token or "\r" in token or "\n" in token:
        raise LeadError("OAUTH_REFRESH_FAILED")
    return token


class SheetsClient:
    def __init__(self, token: str, spreadsheet_id: str, request: Callable[..., dict[str, Any]] = http_json):
        if not re.fullmatch(r"[A-Za-z0-9_-]{10,}", spreadsheet_id):
            raise LeadError("SPREADSHEET_CONFIGURATION_INVALID")
        self.spreadsheet_id = spreadsheet_id
        self.base = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheet_id
        self.headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
        self.request = request

    def metadata(self) -> dict[str, Any]:
        return self.request("GET", self.base + "?" + urlencode({"fields": "sheets.properties(title,gridProperties.rowCount)"}), headers=self.headers)

    def values(self, address: str) -> list[list[Any]]:
        result = self.request("GET", self.base + "/values/" + quote(address, safe="") + "?valueRenderOption=UNFORMATTED_VALUE", headers=self.headers)
        rows = result.get("values", [])
        if not isinstance(rows, list) or any(not isinstance(row, list) for row in rows):
            raise LeadError("DESTINATION_INVALID_RESPONSE")
        return rows

    def append(self, row: list[str]) -> dict[str, Any]:
        address = quote("'Leads LP'!A:S", safe="")
        url = self.base + "/values/" + address + ":append?" + urlencode({"valueInputOption": "RAW", "insertDataOption": "INSERT_ROWS", "includeValuesInResponse": "false"})
        return self.request("POST", url, data=json.dumps({"majorDimension": "ROWS", "values": [row]}, ensure_ascii=False).encode("utf-8"), headers=self.headers)


def _immutable_matches(existing: list[Any], expected: list[str]) -> bool:
    padded = list(existing) + [""] * max(0, 19 - len(existing))
    return all(str(padded[i]).lower() == expected[i].lower() if i == 0 else padded[i] == expected[i] for i in IMMUTABLE_COLUMNS)


def append_lead(client: SheetsClient, lead: dict[str, Any]) -> dict[str, Any]:
    metadata = client.metadata()
    try:
        matches = [item["properties"] for item in metadata["sheets"] if item.get("properties", {}).get("title") == TAB_NAME]
        if len(matches) != 1:
            raise ValueError
        row_count = matches[0]["gridProperties"]["rowCount"]
        if not isinstance(row_count, int) or isinstance(row_count, bool) or row_count < 1:
            raise ValueError
    except (KeyError, TypeError, ValueError):
        raise LeadError("SHEET_CONFIGURATION_INVALID") from None
    if client.values("'Leads LP'!A1:S1") != [HEADERS]:
        raise LeadError("SHEET_HEADERS_MISMATCH")
    row = lead_row(lead)
    ids = client.values(f"'Leads LP'!A2:A{row_count}") if row_count > 1 else []
    duplicate_rows = [index + 2 for index, item in enumerate(ids) if item and str(item[0]).lower() == lead["requestId"].lower()]
    if len(duplicate_rows) > 1:
        raise LeadError("DUPLICATE_REQUEST_ROWS")
    if duplicate_rows:
        number = duplicate_rows[0]
        existing = client.values(f"'Leads LP'!A{number}:S{number}")
        if len(existing) != 1 or not _immutable_matches(existing[0], row):
            raise LeadError("REQUEST_ID_COLLISION")
    else:
        appended = client.append(row)
        update = appended.get("updates", {})
        updated_range = update.get("updatedRange", "") if isinstance(update, dict) else ""
        match = re.fullmatch(r"(?:'Leads LP'|Leads LP)!A([2-9][0-9]*|1[0-9]+):S([2-9][0-9]*|1[0-9]+)", updated_range)
        if not match or match.group(1) != match.group(2) or update.get("updatedRows") != 1 or update.get("updatedColumns") != 19:
            raise LeadError("APPEND_NOT_CONFIRMED")
        saved = client.values(updated_range)
        if saved != [row]:
            raise LeadError("APPEND_NOT_CONFIRMED")
    return {"ok": True, "stored": True, "requestId": lead["requestId"], "spreadsheetId": client.spreadsheet_id}


def main() -> int:
    try:
        lead = decode_lead(os.environ.get("LEAD_RAW_BODY", ""))
        source = os.environ.get("GOOGLE_OAUTH_JSON", "")
        if not source:
            raise LeadError("OAUTH_CONFIGURATION_INVALID")
        token = oauth_access_token(source)
        client = SheetsClient(token, os.environ.get("SPREADSHEET_ID", DEFAULT_SPREADSHEET_ID))
        result = append_lead(client, lead)
        print("::" + json.dumps({"outputs": result}, separators=(",", ":")) + "::")
        return 0
    except LeadError as error:
        print("Norvia lead storage failed: " + str(error), file=sys.stderr)
        return 1
    except Exception:
        print("Norvia lead storage failed: INTERNAL_ERROR", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

"""Isolated appender tests. Every HTTP call is replaced; no Google writes."""
import contextlib
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, unquote, urlparse

spec = importlib.util.spec_from_file_location("norvia_appender", Path(__file__).with_name("norvia-append-lead.py"))
appender = importlib.util.module_from_spec(spec)
spec.loader.exec_module(appender)


def example_lead():
    return {"requestId": "d29d373a-f80a-4791-85c0-589eb66fbeca", "name": "Teste Integração", "company": "Transportadora de Teste", "role": "Gestor de TI", "email": "teste@example.com", "whatsapp": "(11) 99999-9999", "consent": True, "website": "", "landingPath": "/", "attribution": {"utm_source": "test", "utm_campaign": "=SOMETHING()"}}


class FakeSheets:
    spreadsheet_id = appender.DEFAULT_SPREADSHEET_ID

    def __init__(self, rows=None, row_count=1000):
        self.rows = rows or {}
        self.row_count = row_count
        self.reads = []
        self.append_calls = []
        self.headers = list(appender.HEADERS)
        self.corrupt_readback = False

    def metadata(self):
        return {"sheets": [{"properties": {"title": "Leads LP", "gridProperties": {"rowCount": self.row_count}}}]}

    def values(self, address):
        self.reads.append(address)
        if address == "'Leads LP'!A1:S1":
            return [self.headers]
        if address.startswith("'Leads LP'!A2:A"):
            last = int(address.rsplit("A", 1)[1])
            return [[self.rows[number][0]] if number in self.rows else [] for number in range(2, last + 1)]
        start = int(address.split("!A", 1)[1].split(":", 1)[0])
        if self.corrupt_readback:
            return []
        return [self.rows[start]] if start in self.rows else []

    def append(self, row):
        self.append_calls.append(copy.deepcopy(row))
        number = max([1, *self.rows]) + 1
        self.rows[number] = copy.deepcopy(row)
        return {"updates": {"updatedRange": f"'Leads LP'!A{number}:S{number}", "updatedRows": 1, "updatedColumns": 19}}


class ValidationTests(unittest.TestCase):
    def test_direct_and_double_encoded_body_normalize_to_same_lead(self):
        body = json.dumps(example_lead())
        direct = appender.decode_lead(body)
        self.assertEqual(direct, appender.decode_lead(json.dumps(body)))
        self.assertEqual(direct["whatsapp"], "+5511999999999")

    def test_required_fields_types_enum_lengths_consent_and_honeypot(self):
        modifications = [
            {"requestId": "invalid"}, {"requestId": "{d29d373a-f80a-4791-85c0-589eb66fbeca}"},
            {"requestId": "d29d373a-f80a-0791-85c0-589eb66fbeca"},
            {"requestId": "d29d373a-f80a-4791-05c0-589eb66fbeca"},
            {"name": "ab"}, {"name": "A\nB"}, {"company": "X"},
            {"name": "a" * 121}, {"company": "b" * 161},
            {"role": "Unknown"}, {"email": "invalid"}, {"email": "a..b@example.com"},
            {"whatsapp": "123"}, {"whatsapp": "(01) 99999-9999"},
            {"consent": False}, {"consent": "true"}, {"consent": 1},
            {"website": "spam"}, {"landingPath": "https://example.com"},
            {"attribution": {"utm_source": "x" * 161}}, {"attribution": {"extra": "x"}},
            {"attribution": None}, {"extra": "not allowed"},
        ]
        for modification in modifications:
            with self.subTest(modification=list(modification)):
                with self.assertRaisesRegex(appender.LeadError, "^INVALID_LEAD$"):
                    appender.decode_lead(json.dumps({**example_lead(), **modification}))
        for field in ("name", "company", "role", "email", "whatsapp", "consent", "requestId"):
            body = example_lead()
            del body[field]
            with self.subTest(missing=field), self.assertRaises(appender.LeadError):
                appender.decode_lead(json.dumps(body))

    def test_invalid_json_arrays_triple_encoding_and_oversized_rejected(self):
        for raw in ("", "{", "[]", "null", json.dumps(json.dumps(json.dumps(example_lead()))), "x" * 16385):
            with self.subTest(raw_length=len(raw)), self.assertRaises(appender.LeadError):
                appender.decode_lead(raw)

    def test_optional_fields_default_and_fixed_mapping(self):
        lead = example_lead()
        for field in ("website", "landingPath", "attribution"):
            del lead[field]
        row = appender.lead_row(appender.decode_lead(json.dumps(lead)), "2026-10-29T08:00:00-03:00")
        self.assertEqual(len(row), len(appender.HEADERS))
        self.assertEqual(row[7:9], ["true", "LP Norvia"])
        self.assertEqual(row[9:14], [""] * 5)
        self.assertEqual(row[14:], ["/", "Novo", "", "norvia-security", "v1"])
        self.assertRegex(appender.received_timestamp(), r"T\d{2}:\d{2}:\d{2}-03:00$")


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.lead = appender.decode_lead(json.dumps(example_lead()))

    def test_new_lead_appends_once_and_readback_confirms(self):
        sheets = FakeSheets()
        result = appender.append_lead(sheets, self.lead)
        self.assertEqual(result, {"ok": True, "stored": True, "requestId": self.lead["requestId"], "spreadsheetId": sheets.spreadsheet_id})
        self.assertEqual(len(sheets.append_calls), 1)
        self.assertEqual(sheets.append_calls[0][6], "+5511999999999")
        self.assertIn("'Leads LP'!A2:S2", sheets.reads)

    def test_existing_uuid_beyond_old_fixed_bounds_is_not_appended(self):
        row = appender.lead_row(self.lead, "2026-10-01T08:00:00-03:00")
        row[15] = "Em negociação"
        row[16] = "Anotação comercial preservada"
        sheets = FakeSheets({5001: row}, row_count=6000)
        self.assertTrue(appender.append_lead(sheets, self.lead)["stored"])
        self.assertEqual(sheets.append_calls, [])
        self.assertIn("'Leads LP'!A2:A6000", sheets.reads)
        self.assertIn("'Leads LP'!A5001:S5001", sheets.reads)
        self.assertEqual(sheets.rows[5001][15], "Em negociação")

    def test_uuid_collision_with_changed_immutable_data_fails_without_append(self):
        for column in appender.IMMUTABLE_COLUMNS:
            if column == 0:
                continue
            row = appender.lead_row(self.lead)
            row[column] = "different"
            sheets = FakeSheets({2: row})
            with self.subTest(column=appender.HEADERS[column]), self.assertRaisesRegex(appender.LeadError, "REQUEST_ID_COLLISION"):
                appender.append_lead(sheets, self.lead)
            self.assertEqual(sheets.append_calls, [])

    def test_duplicate_existing_rows_are_exposed(self):
        row = appender.lead_row(self.lead)
        sheets = FakeSheets({2: row, 3: row})
        with self.assertRaisesRegex(appender.LeadError, "DUPLICATE_REQUEST_ROWS"):
            appender.append_lead(sheets, self.lead)
        self.assertEqual(sheets.append_calls, [])

    def test_wrong_headers_fail_before_append(self):
        sheets = FakeSheets()
        sheets.headers[0] = "wrong"
        with self.assertRaisesRegex(appender.LeadError, "SHEET_HEADERS_MISMATCH"):
            appender.append_lead(sheets, self.lead)
        self.assertEqual(sheets.append_calls, [])

    def test_append_without_matching_readback_is_not_success(self):
        sheets = FakeSheets()
        sheets.corrupt_readback = True
        with self.assertRaisesRegex(appender.LeadError, "APPEND_NOT_CONFIRMED"):
            appender.append_lead(sheets, self.lead)
        self.assertEqual(len(sheets.append_calls), 1)

    def test_ambiguous_failure_reexecution_finds_previously_written_row(self):
        sheets = FakeSheets()
        sheets.corrupt_readback = True
        with self.assertRaises(appender.LeadError):
            appender.append_lead(sheets, self.lead)
        sheets.corrupt_readback = False
        self.assertTrue(appender.append_lead(sheets, self.lead)["stored"])
        self.assertEqual(len(sheets.append_calls), 1)

    def test_no_preexisting_data_beyond_header_can_append(self):
        sheets = FakeSheets(row_count=1)
        self.assertTrue(appender.append_lead(sheets, self.lead)["stored"])
        self.assertNotIn("'Leads LP'!A2:A1", sheets.reads)


class TransportTests(unittest.TestCase):
    def test_append_uses_raw_and_encodes_untrusted_text_as_json(self):
        calls = []
        def fake_request(method, url, **kwargs):
            calls.append((method, url, kwargs))
            return {"updates": {}}
        client = appender.SheetsClient("private-token", appender.DEFAULT_SPREADSHEET_ID, fake_request)
        row = appender.lead_row(appender.decode_lead(json.dumps(example_lead())))
        client.append(row)
        method, url, options = calls[0]
        self.assertEqual(method, "POST")
        query = parse_qs(urlparse(url).query)
        self.assertEqual(query["valueInputOption"], ["RAW"])
        self.assertEqual(query["insertDataOption"], ["INSERT_ROWS"])
        self.assertEqual(json.loads(options["data"])["values"][0][11], "=SOMETHING()")
        self.assertIn("'Leads LP'!A:S:append", unquote(url))

    def test_oauth_refresh_uses_fixed_endpoint_and_private_form_body(self):
        calls = []
        def fake_request(method, url, **kwargs):
            calls.append((method, url, kwargs))
            return {"access_token": "access-token"}
        source = json.dumps({"installed": {"client_id": "client", "client_secret": "secret"}, "refresh_token": "refresh", "token_uri": "https://untrusted.invalid"})
        self.assertEqual(appender.oauth_access_token(source, fake_request), "access-token")
        self.assertEqual(calls[0][1], "https://oauth2.googleapis.com/token")
        self.assertEqual(parse_qs(calls[0][2]["data"].decode())["refresh_token"], ["refresh"])

    def test_oauth_invalid_config_and_missing_token_are_sanitized(self):
        for source in ("{}", "not-a-real-private-file", "[]"):
            with self.subTest(source=source), self.assertRaisesRegex(appender.LeadError, "OAUTH_CONFIGURATION_INVALID"):
                appender.oauth_access_token(source, lambda *_args, **_kwargs: self.fail("HTTP must not run"))
        with self.assertRaisesRegex(appender.LeadError, "OAUTH_REFRESH_FAILED"):
            appender.oauth_access_token(json.dumps({"client_id": "client", "client_secret": "private", "refresh_token": "private"}), lambda *_args, **_kwargs: {"error": "private provider details"})

    def test_http_errors_never_include_provider_body_or_credentials(self):
        failure = HTTPError("https://private-token.invalid", 403, "PII-containing provider detail", None, None)
        with patch.object(appender, "urlopen", side_effect=failure):
            with self.assertRaisesRegex(appender.LeadError, "^DESTINATION_UNAVAILABLE$"):
                appender.http_json("GET", "https://example.invalid")

    def test_main_outputs_kestra_protocol_without_lead_pii(self):
        output, errors = io.StringIO(), io.StringIO()
        lead = example_lead()
        result = {"ok": True, "stored": True, "requestId": lead["requestId"], "spreadsheetId": appender.DEFAULT_SPREADSHEET_ID}
        with patch.dict(os.environ, {"LEAD_RAW_BODY": json.dumps(lead), "GOOGLE_OAUTH_JSON": "private.json"}), patch.object(appender, "oauth_access_token", return_value="private-token"), patch.object(appender, "append_lead", return_value=result), contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            self.assertEqual(appender.main(), 0)
        self.assertTrue(output.getvalue().startswith('::{"outputs":'))
        self.assertTrue(output.getvalue().endswith("::\n"))
        self.assertNotIn(lead["email"], output.getvalue())
        self.assertNotIn("private-token", output.getvalue())
        self.assertEqual(errors.getvalue(), "")

    def test_main_invalid_input_has_no_network_and_no_pii_output(self):
        output, errors = io.StringIO(), io.StringIO()
        with patch.dict(os.environ, {"LEAD_RAW_BODY": '{"email":"private@example.com"}'}), patch.object(appender, "oauth_access_token", side_effect=AssertionError("must not run")), contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            self.assertEqual(appender.main(), 1)
        self.assertEqual(output.getvalue(), "")
        self.assertEqual(errors.getvalue(), "Norvia lead storage failed: INVALID_LEAD\n")


if __name__ == "__main__":
    unittest.main()

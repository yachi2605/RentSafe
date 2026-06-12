import os
from dataclasses import dataclass
from typing import Any

import requests


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


@dataclass
class RestResult:
    data: Any


class RestQuery:
    def __init__(self, client: "RestSupabaseClient", table: str):
        self.client = client
        self.table = table
        self.method = "GET"
        self.payload: Any = None
        self.params: dict[str, str] = {}
        self.headers: dict[str, str] = {}
        self.expect_single = False

    def select(self, columns: str):
        self.method = "GET"
        self.params["select"] = columns
        return self

    def insert(self, payload: dict[str, Any]):
        self.method = "POST"
        self.payload = payload
        self.headers["Prefer"] = "return=representation"
        return self

    def update(self, payload: dict[str, Any]):
        self.method = "PATCH"
        self.payload = payload
        self.headers["Prefer"] = "return=representation"
        return self

    def upsert(self, payload: dict[str, Any], on_conflict: str | None = None):
        self.method = "POST"
        self.payload = payload
        prefer = "resolution=merge-duplicates,return=representation"
        self.headers["Prefer"] = prefer
        if on_conflict:
            self.params["on_conflict"] = on_conflict
        return self

    def eq(self, column: str, value: Any):
        self.params[column] = f"eq.{value}"
        return self

    def ilike(self, column: str, value: str):
        self.params[column] = f"ilike.*{value}*"
        return self

    def lte(self, column: str, value: Any):
        self.params[column] = f"lte.{value}"
        return self

    def in_(self, column: str, values: list[Any]):
        joined = ",".join(str(value) for value in values)
        self.params[column] = f"in.({joined})"
        return self

    def single(self):
        self.expect_single = True
        self.params["limit"] = "1"
        return self

    def execute(self) -> RestResult:
        url = f"{self.client.base_url}/rest/v1/{self.table}"
        headers = dict(self.client.headers)
        headers.update(self.headers)

        response = requests.request(
            self.method,
            url,
            params=self.params,
            json=self.payload,
            headers=headers,
            timeout=30,
        )
        if not response.ok:
            # Surface the PostgREST error message (RLS, FK violations, etc.)
            # instead of an opaque HTTPError.
            try:
                detail = response.json().get("message", response.text)
            except ValueError:
                detail = response.text
            raise RuntimeError(
                f"Supabase error ({response.status_code}) on {self.method} {self.table}: {detail}"
            )

        if response.text.strip():
            body = response.json()
        else:
            body = None

        if self.expect_single:
            if isinstance(body, list):
                body = body[0] if body else None
        return RestResult(data=body)


class RestSupabaseClient:
    def __init__(self, base_url: str, api_key: str, auth_token: str | None = None):
        if not base_url or not api_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {auth_token or api_key}",
            "Content-Type": "application/json",
        }

    def table(self, table: str) -> RestQuery:
        return RestQuery(self, table)


supabase: RestSupabaseClient | None = None


def get_supabase(auth_token: str | None = None) -> RestSupabaseClient:
    """Return a Supabase client using the service role key.

    The backend is a trusted layer, so it always talks to Supabase with the
    service key (bypassing RLS). Forwarding the user's JWT here previously
    subjected backend writes to RLS policies that don't exist for these
    tables, rejecting every insert. ``auth_token`` is accepted for future
    use (e.g. verifying user identity) but no longer used for DB auth.
    """
    global supabase
    if supabase is None:
        supabase = RestSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return supabase

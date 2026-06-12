"""RentSafe smoke test — checks every backend feature in one run.

Usage (backend running on :8000):

    cd backend
    python scripts/smoke_test.py            # skips paid LLM endpoints
    python scripts/smoke_test.py --with-llm # also tests scam check + rights bot

Exits non-zero if anything fails.
"""
import argparse
import os
import sys

import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
PASSED, FAILED = [], []


def check(name: str, fn) -> None:
    try:
        fn()
        PASSED.append(name)
        print(f"  PASS  {name}")
    except Exception as exc:  # noqa: BLE001
        FAILED.append((name, str(exc)))
        print(f"  FAIL  {name}: {exc}")


def expect(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-llm", action="store_true", help="also test OpenAI-backed endpoints")
    args = parser.parse_args()

    print(f"Smoke testing {BACKEND_URL}\n")

    def health():
        r = requests.get(f"{BACKEND_URL}/health", timeout=10)
        expect(r.ok and r.json().get("status") == "ok", f"got {r.status_code}: {r.text[:200]}")
    check("GET /health", health)

    def states():
        r = requests.get(f"{BACKEND_URL}/rights/states", timeout=10)
        expect(r.ok, f"{r.status_code}: {r.text[:200]}")
        expect(len(r.json().get("states", [])) == 50, "expected 50 states")
    check("GET /rights/states", states)

    def spaces():
        r = requests.get(f"{BACKEND_URL}/match/spaces", timeout=30)
        expect(r.ok, f"{r.status_code}: {r.text[:300]}")
        expect("spaces" in r.json(), "missing 'spaces' key")
        print(f"        ({len(r.json()['spaces'])} active space posts)")
    check("GET /match/spaces (Supabase read)", spaces)

    def seekers():
        r = requests.get(f"{BACKEND_URL}/match/seekers", timeout=30)
        expect(r.ok, f"{r.status_code}: {r.text[:300]}")
        expect("seekers" in r.json(), "missing 'seekers' key")
        print(f"        ({len(r.json()['seekers'])} active seeker posts)")
    check("GET /match/seekers (Supabase read)", seekers)

    def my_matches_unknown_user():
        # A user with no posts must get an empty list, never other users' matches.
        r = requests.get(f"{BACKEND_URL}/match/my-matches/00000000-0000-0000-0000-000000000000", timeout=30)
        expect(r.ok, f"{r.status_code}: {r.text[:300]}")
        expect(r.json().get("matches") == [], "expected empty matches for unknown user")
    check("GET /match/my-matches (no-posts isolation)", my_matches_unknown_user)

    def bad_state():
        r = requests.post(f"{BACKEND_URL}/rights/ask", json={"question": "test", "state": "XX"}, timeout=10)
        expect(r.status_code == 400, f"expected 400 for invalid state, got {r.status_code}")
    check("POST /rights/ask rejects invalid state", bad_state)

    def bad_lease():
        r = requests.post(f"{BACKEND_URL}/lease/analyze", files={"file": ("x.txt", b"hi", "text/plain")}, timeout=10)
        expect(r.status_code == 400, f"expected 400 for non-PDF, got {r.status_code}")
    check("POST /lease/analyze rejects non-PDF", bad_lease)

    def llm_requires_login():
        r = requests.post(f"{BACKEND_URL}/scam/check", json={"listing_text": "test listing"}, timeout=10)
        expect(r.status_code == 401, f"expected 401 without login, got {r.status_code}")
    check("POST /scam/check requires login (cost protection)", llm_requires_login)

    if args.with_llm:
        # LLM endpoints require a logged-in user; sign in as a seeded demo account.
        import os as _os
        from dotenv import load_dotenv as _load
        _load(_os.path.join(_os.path.dirname(__file__), "..", ".env"))
        supabase_url = _os.environ["SUPABASE_URL"].rstrip("/")
        service_key = _os.environ["SUPABASE_SERVICE_KEY"]
        login = requests.post(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            headers={"apikey": service_key, "Content-Type": "application/json"},
            json={"email": "demo.seeker1@rentsafe.app", "password": "RentSafeDemo1!"},
            timeout=30,
        )
        if not login.ok:
            print(f"  FAIL  demo login for LLM tests: {login.status_code} {login.text[:200]}")
            FAILED.append(("demo login", login.text[:200]))
        else:
            auth = {"Authorization": f"Bearer {login.json()['access_token']}"}

            def scam():
                r = requests.post(
                    f"{BACKEND_URL}/scam/check",
                    json={"listing_text": "Luxury 3BR downtown $500/mo! Wire first month via Western Union to my pastor overseas. No viewings."},
                    headers=auth,
                    timeout=120,
                )
                expect(r.ok, f"{r.status_code}: {r.text[:300]}")
                body = r.json()
                expect("scam_score" in body and "verdict" in body, "missing scam fields")
                print(f"        (scam_score={body['scam_score']}, verdict={body['verdict']})")
            check("POST /scam/check (OpenAI + quota + cache)", scam)

            def rights():
                r = requests.post(
                    f"{BACKEND_URL}/rights/ask",
                    json={"question": "How much notice does my landlord need to give before entering?", "state": "Illinois"},
                    headers=auth,
                    timeout=120,
                )
                expect(r.ok, f"{r.status_code}: {r.text[:300]}")
                expect(bool(r.json().get("answer")), "empty answer")
            check("POST /rights/ask (OpenAI + quota + cache)", rights)
    else:
        print("  SKIP  LLM endpoints (run with --with-llm to include)")

    print(f"\n{len(PASSED)} passed, {len(FAILED)} failed")
    if FAILED:
        sys.exit(1)


if __name__ == "__main__":
    main()

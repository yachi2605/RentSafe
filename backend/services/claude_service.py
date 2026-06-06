import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def analyze_lease(lease_text: str) -> dict:
    prompt = f"""
You are a tenant-rights expert and legal assistant specializing in US rental law.

Analyze the following lease agreement and return a JSON response with exactly these keys:
- "summary": A 3-4 sentence plain-English overview of the lease.
- "red_flags": A list of objects, each with "clause" (short name), "text" (problematic text from lease),
  "risk_level" ("high"/"medium"/"low"), and "explanation" (why it matters to a renter).
- "negotiation_tips": A list of strings with actionable negotiation advice based on the red flags found.
- "tenant_friendly_score": An integer from 1-10 (10 = very tenant-friendly).

Lease text:
{lease_text}

Return ONLY valid JSON. No markdown, no preamble.
"""
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(message.content[0].text)


def check_scam(listing_text: str) -> dict:
    prompt = f"""
You are a rental scam detection expert familiar with all common US rental fraud patterns.

Analyze the following rental listing and return a JSON response with exactly these keys:
- "scam_score": An integer from 0-100 (0 = definitely legit, 100 = definitely scam).
- "verdict": One of "likely_scam", "suspicious", "possibly_legit", "likely_legit".
- "red_flags": A list of objects with "flag" (short label) and "explanation".
- "hidden_fees": A list of objects with "fee_type" and "estimated_amount" if detectable.
- "tips": A list of 3-5 actionable safety tips specific to this listing.

Listing:
{listing_text}

Return ONLY valid JSON. No markdown, no preamble.
"""
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(message.content[0].text)


def answer_tenant_rights(question: str, state: str, context: str) -> str:
    prompt = f"""
You are a US tenant rights expert. The user is in {state}.

Use the following legal context to answer their question in plain English.
Be specific, practical, and cite the type of law or regulation when possible.

Context:
{context}

Question: {question}

Answer in 2-4 clear paragraphs. Do not use legal jargon unnecessarily.
"""
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text

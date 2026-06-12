"""
Tenant Rights Service — answered by the configured OpenAI model directly,
with a structured prompt that forces citation and refusal on unknown topics.
"""
import os

from openai import OpenAI

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")


def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")
    return OpenAI(api_key=api_key)

# All 50 US states for validation
US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming"
]

def ask_tenant_rights(question: str, state: str) -> dict:
    """
    Answer tenant rights questions using Claude with hallucination guard.
    Returns answer text, state, and a disclaimer.
    """

    prompt = f"""
You are a US tenant rights expert specializing in residential rental law.
The user is a renter in {state}.

Answer their question based on {state} tenant law. Follow these rules strictly:

1. Be specific to {state} law — mention the relevant statute type when possible
   (e.g. "Under Illinois law", "The {state} Landlord-Tenant Act states...")
2. Use plain English — no legal jargon unless you explain it immediately after
3. Be practical — tell the renter what they can actually DO
4. If the answer varies by city within {state}, mention that
5. HALLUCINATION GUARD: If you are not confident about the specific law in {state},
   respond with exactly:
   "I cannot provide reliable legal information on this specific issue for {state}.
   Please contact a licensed tenant rights attorney or your local tenant advocacy
   organization for accurate guidance."
6. Never guess or infer specific statutes. Only answer what you know with confidence.
7. Keep your answer to 3-5 sentences maximum. Be concise and actionable.

Renter's question: {question}
"""

    client = _get_client()
    completion = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    answer = completion.choices[0].message.content or ""

    return {
        "answer": answer,
        "state": state,
        "disclaimer": "This is AI-generated information, not legal advice. Always verify with a licensed attorney or your local tenant advocacy organization before taking legal action.",
        "powered_by": "RentSafe AI",
    }

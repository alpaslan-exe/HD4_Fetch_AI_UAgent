from __future__ import annotations
import os
from typing import Optional

ASI_KEY = os.getenv("ASI_ONE_API_KEY")
ASI_URL = os.getenv("ASI_ONE_BASE_URL", "https://api.asi1.ai/v1")
ASI_MODEL = os.getenv("ASI_ONE_MODEL", "asi1-mini")
ASI_TEMP = float(os.getenv("ASI_ONE_TEMPERATURE", "0.2"))

def llm_call(prompt: str) -> Optional[str]:
    """
    Call Fetch.ai ASI:One (OpenAI-compatible). Returns raw text or None on error.
    """
    if not ASI_KEY:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=ASI_KEY, base_url=ASI_URL)
        resp = client.chat.completions.create(
            model=ASI_MODEL,
            temperature=ASI_TEMP,
            messages=[{"role": "user", "content": prompt}],
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        return None

import json
import logging
from typing import Any

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a party planning assistant. Given a natural language description of an event, return a JSON object with:
- "title": event title
- "description": short description
- "timeline_items": array of {"title": str, "sort_order": int}
- "vendor_suggestions": array of {"name": str, "category": str}
- "budget_estimates": array of {"category": str, "allocated": number}

Return ONLY valid JSON, no markdown fences, no extra text."""

VOICE_SYSTEM_PROMPT = """Given a voice transcript about updating a party plan, extract the intent and return a JSON object with:
- "action": one of "update_timeline", "add_vendor", "update_budget", "add_rsvp"
- "item": the item name or person name
- "value": the new value or detail

Return ONLY valid JSON, no markdown fences, no extra text."""


def _call_llm(prompt: str, system: str) -> dict[str, Any]:
    if not settings.deep_infra_token:
        return _mock_response(prompt, system)

    try:
        client = OpenAI(
            api_key=settings.deep_infra_token,
            base_url="https://api.deepinfra.com/v1/openai",
        )
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-V4-Flash",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=512,
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
            text = text.rsplit("```", 1)[0]
        return json.loads(text.strip())
    except Exception as e:
        logger.warning("DeepInfra API call failed: %s", e)
        return _mock_response(prompt, system)


def _mock_response(prompt: str, system: str) -> dict[str, Any]:
    if "voice" in system.lower() or system == VOICE_SYSTEM_PROMPT:
        return {"action": "update_timeline", "item": "toast", "value": "21:00"}
    return {
        "title": "Generated Party",
        "description": "A party planned from your description.",
        "timeline_items": [
            {"title": "Send invitations", "sort_order": 1},
            {"title": "Book venue", "sort_order": 2},
            {"title": "Order catering", "sort_order": 3},
        ],
        "vendor_suggestions": [
            {"name": "Local Catering Co.", "category": "catering"},
            {"name": "Party Sounds DJ", "category": "entertainment"},
        ],
        "budget_estimates": [
            {"category": "Venue", "allocated": 500},
            {"category": "Catering", "allocated": 300},
            {"category": "Entertainment", "allocated": 200},
        ],
    }


async def generate_from_intent(prompt: str) -> dict[str, Any]:
    return _call_llm(prompt, SYSTEM_PROMPT)


async def process_voice_command(transcript: str) -> dict[str, Any]:
    return _call_llm(transcript, VOICE_SYSTEM_PROMPT)

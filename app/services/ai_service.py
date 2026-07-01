import json
import logging
import re
from datetime import date
from typing import Any

from openai import OpenAI

from app.config import settings
from app.schemas import AIGeneratedEvent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a party planning assistant. Given a natural language description of an event, infer all relevant details and return a complete JSON object with this exact structure:

{
  "title": "Event title (required)",
  "description": "Short description of the event",
  "event_date": "YYYY-MM-DD or null",
  "location": "Venue or location name",
  "budget_cap": total budget number (0 if not specified),
  "timeline_items": [
    {"title": "Step name", "sort_order": 1, "event_datetime": "ISO datetime or null", "completed": false}
  ],
  "vendor_suggestions": [
    {"name": "Vendor name", "category": "category", "contact": "", "cost": 0, "eco_verified": false}
  ],
  "budget_estimates": [
    {"category": "Category name", "allocated": 500, "spent": 0}
  ],
  "guest_suggestions": [
    {"guest_name": "Full name", "email": "", "status": "pending", "plus_ones": 0}
  ],
  "sustainability": null or {"carbon_offset_kg": 0, "local_sourcing_pct": 0, "waste_reduction_kg": 0}
}

Example:
{
  "title": "Birthday Party",
  "description": "A birthday celebration for 30 guests featuring a taco bar.",
  "event_date": "2026-07-12",
  "location": "Community Center",
  "budget_cap": 1500,
  "timeline_items": [
    {"title": "Send invitations", "sort_order": 1, "event_datetime": null, "completed": true},
    {"title": "Finalize guest count", "sort_order": 2, "event_datetime": null, "completed": true},
    {"title": "Order catering", "sort_order": 3, "event_datetime": null, "completed": false},
    {"title": "Set up decorations", "sort_order": 4, "event_datetime": "2026-07-12T14:00:00", "completed": false},
    {"title": "Party starts", "sort_order": 5, "event_datetime": "2026-07-12T16:00:00", "completed": false}
  ],
  "vendor_suggestions": [
    {"name": "Taco Catering Co.", "category": "catering", "contact": "chef@example.com", "cost": 400, "eco_verified": false},
    {"name": "Party Decor Rentals", "category": "decorations", "contact": "", "cost": 150, "eco_verified": true}
  ],
  "budget_estimates": [
    {"category": "Catering", "allocated": 400, "spent": 0},
    {"category": "Decorations", "allocated": 150, "spent": 0},
    {"category": "Entertainment", "allocated": 300, "spent": 0}
  ],
  "guest_suggestions": [
    {"guest_name": "Alex", "email": "", "status": "pending", "plus_ones": 1},
    {"guest_name": "Jordan", "email": "", "status": "pending", "plus_ones": 0},
    {"guest_name": "Taylor", "email": "", "status": "confirmed", "plus_ones": 2}
  ],
  "sustainability": {
    "carbon_offset_kg": 50,
    "local_sourcing_pct": 30,
    "waste_reduction_kg": 10
  }
}

Infer dates relative to today's date included in the prompt. Use your knowledge to fill in realistic costs, guest names, vendor types, timelines, and sustainability metrics based on the description. For vendor categories use common categories: catering, venue, decorations, entertainment, photography, transportation, florist, bakery, staffing, equipment. Guest statuses should be "pending", "confirmed", or "declined".

Return ONLY valid JSON matching the structure above. No markdown fences, no extra text, no explanations."""

VOICE_SYSTEM_PROMPT = """Given a voice transcript about updating a party plan, extract the intent and return a JSON object with:
- "action": one of "update_timeline", "add_vendor", "update_budget", "add_rsvp"
- "item": the item name or person name
- "value": the new value or detail

Return ONLY valid JSON, no markdown fences, no extra text."""


def _parse_json(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        text = text.rsplit("```", 1)[0]
        text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError("Could not parse JSON from LLM response")


def _validate_response(data: dict[str, Any]) -> dict[str, Any]:
    try:
        validated = AIGeneratedEvent.model_validate(data)
        return validated.model_dump(exclude_none=True)
    except Exception as e:
        logger.warning("AI response validation failed: %s", e)
        raise


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
            max_tokens=2048,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content.strip()
        parsed = _parse_json(text)
        return _validate_response(parsed)
    except Exception as e:
        logger.warning("DeepInfra API call failed: %s", e)
        return _mock_response(prompt, system)


def _mock_response(prompt: str, system: str) -> dict[str, Any]:
    if "voice" in system.lower() or system == VOICE_SYSTEM_PROMPT:
        return {"action": "update_timeline", "item": "toast", "value": "21:00"}
    return {
        "title": "Generated Party",
        "description": "A party planned from your description.",
        "event_date": None,
        "location": "",
        "budget_cap": 0,
        "timeline_items": [
            {"title": "Send invitations", "sort_order": 1, "event_datetime": None, "completed": True},
            {"title": "Book venue", "sort_order": 2, "event_datetime": None, "completed": True},
            {"title": "Order catering", "sort_order": 3, "event_datetime": None, "completed": False},
            {"title": "Set up decorations", "sort_order": 4, "event_datetime": None, "completed": False},
        ],
        "vendor_suggestions": [
            {"name": "Local Catering Co.", "category": "catering", "contact": "info@catering.com", "cost": 400, "eco_verified": False},
            {"name": "Party Sounds DJ", "category": "entertainment", "contact": "", "cost": 300, "eco_verified": False},
        ],
        "budget_estimates": [
            {"category": "Venue", "allocated": 500, "spent": 0},
            {"category": "Catering", "allocated": 300, "spent": 0},
            {"category": "Entertainment", "allocated": 200, "spent": 0},
        ],
        "guest_suggestions": [
            {"guest_name": "Guest 1", "email": "", "status": "pending", "plus_ones": 0},
            {"guest_name": "Guest 2", "email": "", "status": "pending", "plus_ones": 1},
        ],
        "sustainability": None,
    }


async def generate_from_intent(prompt: str) -> dict[str, Any]:
    today = date.today().isoformat()
    full_prompt = f"Today's date is {today}. {prompt}"
    return _call_llm(full_prompt, SYSTEM_PROMPT)


async def process_voice_command(transcript: str) -> dict[str, Any]:
    return _call_llm(transcript, VOICE_SYSTEM_PROMPT)

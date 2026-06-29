from fastapi import APIRouter, HTTPException

from app.schemas import AIAction, AIGenerateRequest
from app.services.ai_service import generate_from_intent, process_voice_command

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/generate")
async def ai_generate(data: AIGenerateRequest):
    try:
        result = await generate_from_intent(data.prompt)
        return result
    except Exception as e:
        raise HTTPException(500, f"AI generation failed: {e}")


@router.post("/voice")
async def ai_voice(data: AIGenerateRequest):
    try:
        result = await process_voice_command(data.prompt)
        return result
    except Exception as e:
        raise HTTPException(500, f"Voice processing failed: {e}")

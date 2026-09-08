from functools import lru_cache
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.agents.con_agent import ConAgent
from app.agents.judge_agent import JudgeAgent
from app.agents.pro_agent import ProAgent
from app.core.config import get_settings
from app.core.errors import DebateError
from app.models.debate import Debate, DebateEvent, DebateRequest
from app.services.debate_service import DebateService
from app.services.llm_service import LLMService, OpenAICompatibleProvider

router = APIRouter(prefix="/api", tags=["debates"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/models")
async def list_models() -> dict[str, Any]:
    settings = get_settings()
    return {
        "default_model": settings.model_name,
        "presets": [
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "category": "Fast & Efficient", "description": "Fast, high-quality, cost-efficient default"},
            {"id": "gpt-4o", "name": "GPT-4o", "category": "Flagship", "description": "Flagship multi-modal debate intelligence"},
            {"id": "o3-mini", "name": "o3-mini", "category": "Reasoning", "description": "Next-gen deep logical deduction & step-by-step reasoning"},
            {"id": "o1-mini", "name": "o1-mini", "category": "Reasoning", "description": "Fast analytical chain-of-thought for STEM & debate logic"},
            {"id": "o1", "name": "o1", "category": "Deep Reasoning", "description": "Full deep reasoning model for complex propositions"},
            {"id": "gpt-4.5-preview", "name": "GPT-4.5 Preview", "category": "Advanced", "description": "Advanced nuanced debate reasoning & style"},
            {"id": "chatgpt-4o-latest", "name": "ChatGPT-4o Latest", "category": "Dynamic", "description": "Dynamic ChatGPT production model"},
        ],
    }


@lru_cache
def get_debate_service() -> DebateService:
    settings = get_settings()
    llm_service = LLMService(OpenAICompatibleProvider(settings), settings)
    return DebateService(
        pro_agent=ProAgent(llm_service),
        con_agent=ConAgent(llm_service),
        judge_agent=JudgeAgent(llm_service),
        llm_service=llm_service,
    )


@router.post("/debates", response_model=Debate)
async def start_debate(
    request: DebateRequest,
    service: DebateService = Depends(get_debate_service),
) -> Debate:
    return await service.run_debate(
        request.topic,
        pro_model=request.pro_model,
        con_model=request.con_model,
        judge_model=request.judge_model,
    )


@router.post("/debates/stream")
async def stream_debate(
    request: DebateRequest,
    service: DebateService = Depends(get_debate_service),
) -> StreamingResponse:
    async def event_stream():
        try:
            async for event in service.stream_debate(
                request.topic,
                pro_model=request.pro_model,
                con_model=request.con_model,
                judge_model=request.judge_model,
            ):
                yield f"data: {event.model_dump_json()}\n\n"
        except DebateError as exc:
            failure = DebateEvent(type="debate_failed", message=str(exc))
            yield f"data: {failure.model_dump_json()}\n\n"
        except Exception:
            failure = DebateEvent(
                type="debate_failed",
                message="The debate could not be completed. Please try again.",
            )
            yield f"data: {failure.model_dump_json()}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

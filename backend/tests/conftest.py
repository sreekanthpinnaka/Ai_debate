from collections.abc import AsyncIterator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.agents.con_agent import ConAgent
from app.agents.judge_agent import JudgeAgent
from app.agents.pro_agent import ProAgent
from app.main import app
from app.models.judge import JudgeResult
from app.services.debate_service import DebateService


VALID_JUDGE_DATA = {
    "winner": "PRO",
    "pro_scores": {
        "argument_quality": 8,
        "logical_consistency": 8,
        "rebuttal_quality": 9,
        "clarity": 9,
        "persuasiveness": 8,
        "overall": 8.4,
    },
    "con_scores": {
        "argument_quality": 7,
        "logical_consistency": 8,
        "rebuttal_quality": 7,
        "clarity": 8,
        "persuasiveness": 7,
        "overall": 7.4,
    },
    "pro_strengths": ["Directly answered the central operational concern."],
    "con_strengths": ["Raised a relevant implementation risk."],
    "pro_weaknesses": ["One benefit was not quantified."],
    "con_weaknesses": ["The rebuttal left the strongest PRO claim unanswered."],
    "pro_logical_issues": ["A limited unsupported assumption."],
    "con_logical_issues": ["A mild slippery-slope inference."],
    "strongest_argument": "PRO connected the policy to a concrete outcome.",
    "debate_summary": "Both sides addressed benefits and implementation risks.",
    "decision_reason": "PRO won through a more direct and complete rebuttal.",
}


class StubLLMService:
    def __init__(self) -> None:
        self.settings = type("Settings", (), {"model_name": "gpt-4o-mini"})()

    async def validate_topic(self, topic: str) -> str:
        return topic.strip()

    async def generate_text(
        self, *, system_prompt: str, user_prompt: str, model_name: str | None = None
    ) -> str:
        side = "PRO" if "PRO participant" in system_prompt else "CON"
        if "Opening argument" in user_prompt:
            return f"{side} opening response"
        if "ROUND TASK: Rebuttal" in user_prompt:
            return f"{side} rebuttal response"
        return f"{side} closing response"

    async def generate_text_stream(
        self, *, system_prompt: str, user_prompt: str, model_name: str | None = None
    ) -> AsyncIterator[str]:
        text = await self.generate_text(
            system_prompt=system_prompt, user_prompt=user_prompt, model_name=model_name
        )
        words = text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == len(words) - 1 else f"{word} "
            yield chunk

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: type[JudgeResult],
        model_name: str | None = None,
        retries: int = 1,
    ) -> JudgeResult:
        return schema.model_validate(VALID_JUDGE_DATA)


@pytest.fixture
def debate_service() -> DebateService:
    llm = StubLLMService()
    return DebateService(  # type: ignore[arg-type]
        ProAgent(llm),
        ConAgent(llm),
        JudgeAgent(llm),
        llm,
    )


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as async_client:
        yield async_client

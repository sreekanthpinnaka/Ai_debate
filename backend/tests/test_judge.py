import json

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.errors import StructuredOutputError
from app.models.judge import JudgeResult
from app.services.llm_service import LLMService
from tests.conftest import VALID_JUDGE_DATA


class InvalidProvider:
    def __init__(self) -> None:
        self.calls = 0

    async def complete(self, **_: object) -> str:
        self.calls += 1
        return "not valid json"

    async def moderate(self, _: str) -> bool:
        return False


def test_judge_result_validates_scores_and_winner() -> None:
    result = JudgeResult.model_validate(VALID_JUDGE_DATA)
    assert result.pro_scores.overall == 8.4

    invalid = json.loads(json.dumps(VALID_JUDGE_DATA))
    invalid["winner"] = "MAYBE"
    with pytest.raises(ValidationError):
        JudgeResult.model_validate(invalid)


@pytest.mark.asyncio
async def test_invalid_judge_output_retries_once_then_fails() -> None:
    provider = InvalidProvider()
    service = LLMService(provider, Settings())  # type: ignore[arg-type]

    with pytest.raises(StructuredOutputError):
        await service.generate_structured(
            system_prompt="judge",
            user_prompt="transcript",
            schema=JudgeResult,
            retries=1,
        )
    assert provider.calls == 2

from datetime import datetime, timezone
from enum import StrEnum
import re
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.agent import RoundType
from app.models.judge import JudgeResult


class DebateStatus(StrEnum):
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class DebateRequest(BaseModel):
    topic: str = Field(min_length=5, max_length=500)
    pro_model: str | None = None
    con_model: str | None = None
    judge_model: str | None = None

    @field_validator("topic", mode="before")
    @classmethod
    def normalize_topic(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        cleaned = value.strip()
        words = re.findall(r"[^\W\d_]+", cleaned, flags=re.UNICODE)
        letter_count = sum(character.isalpha() for character in cleaned)
        if len(words) < 3 or letter_count < 8:
            raise ValueError("Enter a complete, meaningful debate proposition.")
        return cleaned


class DebateRound(BaseModel):
    model_config = ConfigDict(extra="forbid")

    round_number: int = Field(ge=1, le=3)
    round_type: RoundType
    pro_response: str = Field(min_length=1)
    con_response: str = Field(min_length=1)


class Debate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID = Field(default_factory=uuid4)
    topic: str
    status: DebateStatus = DebateStatus.CREATED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    pro_model: str = "gpt-4o-mini"
    con_model: str = "gpt-4o-mini"
    judge_model: str = "gpt-4o-mini"
    rounds: list[DebateRound] = Field(default_factory=list)
    judge_result: JudgeResult | None = None


class DebateEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal[
        "debate_started",
        "round_started",
        "agent_started",
        "agent_chunk",
        "agent_completed",
        "judge_started",
        "judge_completed",
        "debate_completed",
        "debate_failed",
    ]
    debate_id: UUID | None = None
    topic: str | None = None
    round_number: int | None = None
    round_type: RoundType | None = None
    side: Literal["PRO", "CON"] | None = None
    delta: str | None = None
    content: str | None = None
    pro_model: str | None = None
    con_model: str | None = None
    judge_model: str | None = None
    judge_result: JudgeResult | None = None
    debate: Debate | None = None
    message: str | None = None

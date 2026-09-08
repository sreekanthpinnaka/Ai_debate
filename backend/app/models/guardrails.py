from enum import StrEnum

from pydantic import BaseModel, ConfigDict, model_validator


class TopicReason(StrEnum):
    ACCEPTABLE = "acceptable"
    NOT_A_PROPOSITION = "not_a_proposition"
    NONSENSICAL = "nonsensical"
    TOO_VAGUE = "too_vague"
    PROMPT_INJECTION = "prompt_injection"
    UNSAFE = "unsafe"


class TopicAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    acceptable: bool
    reason: TopicReason

    @model_validator(mode="after")
    def decision_matches_reason(self) -> "TopicAssessment":
        if self.acceptable != (self.reason is TopicReason.ACCEPTABLE):
            raise ValueError("acceptable and reason are inconsistent")
        return self

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ScoreBreakdown(BaseModel):
    model_config = ConfigDict(extra="forbid")

    argument_quality: int = Field(ge=1, le=10)
    logical_consistency: int = Field(ge=1, le=10)
    rebuttal_quality: int = Field(ge=1, le=10)
    clarity: int = Field(ge=1, le=10)
    persuasiveness: int = Field(ge=1, le=10)
    overall: float = Field(ge=1, le=10)

    @model_validator(mode="after")
    def validate_overall(self) -> "ScoreBreakdown":
        expected = round(
            (
                self.argument_quality
                + self.logical_consistency
                + self.rebuttal_quality
                + self.clarity
                + self.persuasiveness
            )
            / 5,
            1,
        )
        if abs(self.overall - expected) > 0.05:
            raise ValueError(f"overall must equal the category average ({expected})")
        return self


class JudgeResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    winner: Literal["PRO", "CON", "TIE"]
    pro_scores: ScoreBreakdown
    con_scores: ScoreBreakdown
    pro_strengths: list[str] = Field(min_length=1)
    con_strengths: list[str] = Field(min_length=1)
    pro_weaknesses: list[str] = Field(min_length=1)
    con_weaknesses: list[str] = Field(min_length=1)
    pro_logical_issues: list[str]
    con_logical_issues: list[str]
    strongest_argument: str = Field(min_length=1)
    debate_summary: str = Field(min_length=1)
    decision_reason: str = Field(min_length=1)

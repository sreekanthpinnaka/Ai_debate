from app.agents.base_agent import BaseAgent
from app.models.debate import DebateRound
from app.models.judge import JudgeResult
from app.prompts import judge_prompts


class JudgeAgent(BaseAgent):
    async def evaluate(
        self, topic: str, rounds: list[DebateRound], model_name: str | None = None
    ) -> JudgeResult:
        return await self.llm_service.generate_structured(
            system_prompt=judge_prompts.SYSTEM_PROMPT,
            user_prompt=judge_prompts.evaluation_prompt(topic, rounds),
            schema=JudgeResult,
            model_name=model_name,
            retries=1,
        )

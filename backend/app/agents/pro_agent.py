from collections.abc import AsyncIterator

from app.agents.base_agent import BaseAgent
from app.prompts import pro_prompts


class ProAgent(BaseAgent):
    async def opening(self, topic: str, model_name: str | None = None) -> str:
        return await self._generate(
            system_prompt=pro_prompts.SYSTEM_PROMPT,
            user_prompt=pro_prompts.opening_prompt(topic),
            model_name=model_name,
        )

    async def opening_stream(
        self, topic: str, model_name: str | None = None
    ) -> AsyncIterator[str]:
        async for chunk in self._generate_stream(
            system_prompt=pro_prompts.SYSTEM_PROMPT,
            user_prompt=pro_prompts.opening_prompt(topic),
            model_name=model_name,
        ):
            yield chunk

    async def rebuttal(
        self,
        topic: str,
        own_opening: str,
        opponent_opening: str,
        model_name: str | None = None,
    ) -> str:
        return await self._generate(
            system_prompt=pro_prompts.SYSTEM_PROMPT,
            user_prompt=pro_prompts.rebuttal_prompt(topic, own_opening, opponent_opening),
            model_name=model_name,
        )

    async def rebuttal_stream(
        self,
        topic: str,
        own_opening: str,
        opponent_opening: str,
        model_name: str | None = None,
    ) -> AsyncIterator[str]:
        async for chunk in self._generate_stream(
            system_prompt=pro_prompts.SYSTEM_PROMPT,
            user_prompt=pro_prompts.rebuttal_prompt(topic, own_opening, opponent_opening),
            model_name=model_name,
        ):
            yield chunk

    async def closing(
        self,
        topic: str,
        own_opening: str,
        opponent_opening: str,
        own_rebuttal: str,
        opponent_rebuttal: str,
        model_name: str | None = None,
    ) -> str:
        return await self._generate(
            system_prompt=pro_prompts.SYSTEM_PROMPT,
            user_prompt=pro_prompts.closing_prompt(
                topic,
                own_opening,
                opponent_opening,
                own_rebuttal,
                opponent_rebuttal,
            ),
            model_name=model_name,
        )

    async def closing_stream(
        self,
        topic: str,
        own_opening: str,
        opponent_opening: str,
        own_rebuttal: str,
        opponent_rebuttal: str,
        model_name: str | None = None,
    ) -> AsyncIterator[str]:
        async for chunk in self._generate_stream(
            system_prompt=pro_prompts.SYSTEM_PROMPT,
            user_prompt=pro_prompts.closing_prompt(
                topic,
                own_opening,
                opponent_opening,
                own_rebuttal,
                opponent_rebuttal,
            ),
            model_name=model_name,
        ):
            yield chunk

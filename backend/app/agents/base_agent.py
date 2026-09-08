from collections.abc import AsyncIterator

from app.services.llm_service import LLMService


class BaseAgent:
    def __init__(self, llm_service: LLMService) -> None:
        self.llm_service = llm_service

    async def _generate(
        self, *, system_prompt: str, user_prompt: str, model_name: str | None = None
    ) -> str:
        return await self.llm_service.generate_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model_name=model_name,
        )

    async def _generate_stream(
        self, *, system_prompt: str, user_prompt: str, model_name: str | None = None
    ) -> AsyncIterator[str]:
        async for chunk in self.llm_service.generate_text_stream(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model_name=model_name,
        ):
            yield chunk

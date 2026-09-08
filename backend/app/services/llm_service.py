import asyncio
from collections.abc import AsyncIterator
from typing import Any, Protocol, TypeVar

from openai import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AsyncOpenAI,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    RateLimitError,
)
from pydantic import BaseModel, ValidationError

from app.core.config import Settings
from app.core.errors import ContentPolicyError, LLMConfigurationError, LLMProviderError, StructuredOutputError
from app.models.guardrails import TopicAssessment, TopicReason
from app.prompts import topic_review_prompts
from app.services.content_guard import ContentGuard

StructuredModel = TypeVar("StructuredModel", bound=BaseModel)


class ModelProvider(Protocol):
    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        response_schema: type[BaseModel] | None = None,
        model_name: str | None = None,
    ) -> str: ...

    async def complete_stream(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        model_name: str | None = None,
    ) -> AsyncIterator[str]: ...

    async def moderate(self, text: str) -> bool: ...


class OpenAICompatibleProvider:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client: AsyncOpenAI | None = None

    def _get_client(self) -> AsyncOpenAI:
        if not self.settings.openai_api_key:
            raise LLMConfigurationError(
                "OPENAI_API_KEY is not configured. Add it to backend/.env and restart the API."
            )
        if self.client is None:
            kwargs: dict[str, Any] = {
                "api_key": self.settings.openai_api_key,
                "timeout": self.settings.model_timeout_seconds,
            }
            if self.settings.openai_base_url:
                kwargs["base_url"] = self.settings.openai_base_url
            self.client = AsyncOpenAI(**kwargs)
        return self.client

    def _handle_provider_error(self, exc: Exception, model_name: str | None = None) -> Exception:
        target_model = model_name or self.settings.model_name
        if isinstance(exc, (asyncio.TimeoutError, APITimeoutError)):
            return LLMProviderError("The model request timed out. Please try again.")
        if isinstance(exc, NotFoundError):
            return LLMProviderError(
                f"Model '{target_model}' was not found on this provider API. If you are using a third-party model (e.g. Claude, DeepSeek, Llama), please configure OPENAI_BASE_URL in backend/.env to an aggregator like OpenRouter (https://openrouter.ai/api/v1) or local Ollama."
            )
        if isinstance(exc, AuthenticationError):
            msg = getattr(exc, "message", str(exc))
            return LLMProviderError(f"Authentication failed: {msg}. Please check your OPENAI_API_KEY.")
        if isinstance(exc, RateLimitError):
            msg = getattr(exc, "message", str(exc))
            return LLMProviderError(f"Model quota or rate limit exceeded: {msg}")
        if isinstance(exc, BadRequestError):
            msg = getattr(exc, "message", str(exc))
            return LLMProviderError(f"Invalid request for model '{target_model}': {msg}")
        if isinstance(exc, APIConnectionError):
            return LLMProviderError(
                "Could not connect to model provider API. Check network connectivity and OPENAI_BASE_URL."
            )
        if isinstance(exc, APIError):
            msg = getattr(exc, "message", str(exc))
            return LLMProviderError(f"Model provider error ({target_model}): {msg}")
        return LLMProviderError(f"The model provider could not complete the request: {exc}")

    @staticmethod
    def _is_reasoning_model(model_name: str | None) -> bool:
        if not model_name:
            return False
        normalized = model_name.lower().strip()
        return (
            normalized.startswith(("o1", "o3"))
            or "-o1-" in normalized
            or "-o3-" in normalized
            or "reasoner" in normalized
            or "deepseek-r1" in normalized
        )

    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        response_schema: type[BaseModel] | None = None,
        model_name: str | None = None,
    ) -> str:
        client = self._get_client()
        target_model = model_name or self.settings.model_name
        is_reasoning = self._is_reasoning_model(target_model)
        system_role = "developer" if is_reasoning else "system"

        create_kwargs: dict[str, Any] = {
            "model": target_model,
            "messages": [
                {"role": system_role, "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        if not is_reasoning:
            create_kwargs["temperature"] = temperature

        if response_schema is not None:
            create_kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": response_schema.__name__,
                    "strict": True,
                    "schema": response_schema.model_json_schema(),
                },
            }

        try:
            response = await client.chat.completions.create(**create_kwargs)
        except Exception as exc:
            raise self._handle_provider_error(exc, model_name) from exc

        content = response.choices[0].message.content
        if not content or not content.strip():
            raise LLMProviderError("The model returned an empty response.")
        return content.strip()

    async def complete_stream(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        model_name: str | None = None,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        target_model = model_name or self.settings.model_name
        is_reasoning = self._is_reasoning_model(target_model)
        system_role = "developer" if is_reasoning else "system"

        stream_kwargs: dict[str, Any] = {
            "model": target_model,
            "messages": [
                {"role": system_role, "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": True,
        }
        if not is_reasoning:
            stream_kwargs["temperature"] = temperature

        try:
            stream = await client.chat.completions.create(**stream_kwargs)
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as exc:
            raise self._handle_provider_error(exc, model_name) from exc

    async def moderate(self, text: str) -> bool:
        # If using a custom base URL (e.g. OpenRouter, Groq, Ollama), skip /v1/moderations
        if self.settings.openai_base_url and "api.openai.com" not in self.settings.openai_base_url:
            return False
        client = self._get_client()
        try:
            response = await client.moderations.create(
                model=self.settings.moderation_model,
                input=text,
            )
            if not response.results:
                return False
            return response.results[0].flagged
        except Exception:
            # Fall back safely to False (guardrails regex & semantic checks still apply)
            return False


class LLMService:
    def __init__(
        self,
        provider: ModelProvider,
        settings: Settings,
        content_guard: ContentGuard | None = None,
    ) -> None:
        self.provider = provider
        self.settings = settings
        self.content_guard = content_guard or ContentGuard()

    async def validate_topic(self, topic: str) -> str:
        cleaned = self.content_guard.validate_topic(topic)
        if self.settings.enable_moderation and await self.provider.moderate(cleaned):
            raise ContentPolicyError(
                "Please use a family-friendly topic without explicit, hateful, violent, self-harm, or illegal content."
            )
        if self.settings.enable_topic_review:
            assessment = await self._review_topic(cleaned)
            if not assessment.acceptable:
                messages = {
                    TopicReason.NOT_A_PROPOSITION: "Please enter a complete proposition that has meaningful PRO and CON positions.",
                    TopicReason.NONSENSICAL: "That proposition could not be understood. Please rewrite it as a clear debate topic.",
                    TopicReason.TOO_VAGUE: "That proposition is too vague to debate. Please make the question more specific.",
                    TopicReason.PROMPT_INJECTION: "Please enter only a debate proposition, not instructions for the AI agents.",
                    TopicReason.UNSAFE: "Please use a family-friendly proposition without explicit or harmful content.",
                }
                raise ContentPolicyError(messages[assessment.reason])
        return cleaned

    async def _review_topic(self, topic: str) -> TopicAssessment:
        raw = await self.provider.complete(
            system_prompt=topic_review_prompts.SYSTEM_PROMPT,
            user_prompt=topic_review_prompts.assessment_prompt(topic),
            temperature=self.settings.judge_temperature,
            response_schema=TopicAssessment,
            model_name=self.settings.topic_review_model,
        )
        try:
            return TopicAssessment.model_validate_json(raw)
        except (ValidationError, ValueError) as exc:
            raise StructuredOutputError(
                "The topic quality review returned invalid data. No debate tokens were generated; please try again."
            ) from exc

    async def _validate_output(self, text: str) -> None:
        self.content_guard.validate_family_safe(text)
        if self.settings.enable_moderation and await self.provider.moderate(text):
            raise ContentPolicyError(
                "A generated response did not meet the family-friendly content policy. Please try again."
            )

    async def generate_text(
        self, *, system_prompt: str, user_prompt: str, model_name: str | None = None
    ) -> str:
        result = await self.provider.complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=self.settings.model_temperature,
            model_name=model_name,
        )
        await self._validate_output(result)
        return result

    async def generate_text_stream(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model_name: str | None = None,
    ) -> AsyncIterator[str]:
        full_text: list[str] = []
        if hasattr(self.provider, "complete_stream"):
            async for chunk in self.provider.complete_stream(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=self.settings.model_temperature,
                model_name=model_name,
            ):
                full_text.append(chunk)
                yield chunk
        else:
            chunk = await self.provider.complete(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=self.settings.model_temperature,
                model_name=model_name,
            )
            full_text.append(chunk)
            yield chunk

        combined = "".join(full_text)
        await self._validate_output(combined)

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: type[StructuredModel],
        model_name: str | None = None,
        retries: int = 1,
    ) -> StructuredModel:
        last_error: Exception | None = None
        prompt = user_prompt
        for attempt in range(retries + 1):
            raw = await self.provider.complete(
                system_prompt=system_prompt,
                user_prompt=prompt,
                temperature=self.settings.judge_temperature,
                response_schema=schema,
                model_name=model_name,
            )
            await self._validate_output(raw)
            try:
                return schema.model_validate_json(raw)
            except (ValidationError, ValueError) as exc:
                last_error = exc
                prompt = (
                    f"{user_prompt}\n\nYour previous JSON failed schema validation. "
                    "Return only corrected JSON with every required field and mathematically correct overall averages."
                )
        raise StructuredOutputError(
            "The judge returned invalid structured data after a retry. Please try the debate again."
        ) from last_error

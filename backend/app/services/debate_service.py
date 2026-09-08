import asyncio
import logging
from collections.abc import AsyncIterator, Awaitable
from typing import Any
from uuid import UUID

from app.agents.con_agent import ConAgent
from app.agents.judge_agent import JudgeAgent
from app.agents.pro_agent import ProAgent
from app.models.agent import DebateSide, RoundType
from app.models.debate import Debate, DebateEvent, DebateRound, DebateStatus
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class DebateService:
    def __init__(
        self,
        pro_agent: ProAgent,
        con_agent: ConAgent,
        judge_agent: JudgeAgent,
        llm_service: LLMService,
    ) -> None:
        self.pro_agent = pro_agent
        self.con_agent = con_agent
        self.judge_agent = judge_agent
        self.llm_service = llm_service

    async def _responses_as_completed(
        self,
        pro_call: Awaitable[str],
        con_call: Awaitable[str],
    ) -> AsyncIterator[tuple[DebateSide, str]]:
        tasks = {
            asyncio.create_task(pro_call): DebateSide.PRO,
            asyncio.create_task(con_call): DebateSide.CON,
        }
        try:
            while tasks:
                completed, _ = await asyncio.wait(
                    tasks,
                    return_when=asyncio.FIRST_COMPLETED,
                )
                for task in completed:
                    side = tasks.pop(task)
                    yield side, task.result()
        finally:
            for task in tasks:
                task.cancel()
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

    async def _stream_side_worker(
        self,
        side: DebateSide,
        stream_or_awaitable: Any,
        queue: asyncio.Queue[tuple[str, DebateSide, Any]],
    ) -> None:
        try:
            chunks: list[str] = []
            if hasattr(stream_or_awaitable, "__aiter__"):
                async for chunk in stream_or_awaitable:
                    chunks.append(chunk)
                    await queue.put(("chunk", side, chunk))
                full_text = "".join(chunks)
            else:
                full_text = await stream_or_awaitable
            await queue.put(("completed", side, full_text))
        except Exception as exc:
            await queue.put(("error", side, exc))

    async def _stream_round_events(
        self,
        debate_id: UUID,
        round_number: int,
        round_type: RoundType,
        pro_source: Any,
        con_source: Any,
    ) -> AsyncIterator[DebateEvent]:
        queue: asyncio.Queue[tuple[str, DebateSide, Any]] = asyncio.Queue()
        pro_task = asyncio.create_task(
            self._stream_side_worker(DebateSide.PRO, pro_source, queue)
        )
        con_task = asyncio.create_task(
            self._stream_side_worker(DebateSide.CON, con_source, queue)
        )

        completed_count = 0
        try:
            while completed_count < 2:
                event_kind, side, payload = await queue.get()
                if event_kind == "error":
                    raise payload
                elif event_kind == "chunk":
                    yield DebateEvent(
                        type="agent_chunk",
                        debate_id=debate_id,
                        round_number=round_number,
                        round_type=round_type,
                        side=side.value,
                        delta=payload,
                    )
                elif event_kind == "completed":
                    completed_count += 1
                    yield DebateEvent(
                        type="agent_completed",
                        debate_id=debate_id,
                        round_number=round_number,
                        round_type=round_type,
                        side=side.value,
                        content=payload,
                    )
        finally:
            for task in (pro_task, con_task):
                if not task.done():
                    task.cancel()
            await asyncio.gather(pro_task, con_task, return_exceptions=True)

    async def generate_opening(self, topic: str) -> DebateRound:
        logger.info("opening_round_started")
        pro_response, con_response = await asyncio.gather(
            self.pro_agent.opening(topic),
            self.con_agent.opening(topic),
        )
        logger.info("opening_round_completed")
        return DebateRound(
            round_number=1,
            round_type=RoundType.OPENING,
            pro_response=pro_response,
            con_response=con_response,
        )

    async def generate_rebuttal(self, topic: str, opening: DebateRound) -> DebateRound:
        logger.info("rebuttal_round_started")
        pro_response, con_response = await asyncio.gather(
            self.pro_agent.rebuttal(topic, opening.pro_response, opening.con_response),
            self.con_agent.rebuttal(topic, opening.con_response, opening.pro_response),
        )
        logger.info("rebuttal_round_completed")
        return DebateRound(
            round_number=2,
            round_type=RoundType.REBUTTAL,
            pro_response=pro_response,
            con_response=con_response,
        )

    async def generate_closing(
        self,
        topic: str,
        opening: DebateRound,
        rebuttal: DebateRound,
    ) -> DebateRound:
        logger.info("closing_round_started")
        pro_response, con_response = await asyncio.gather(
            self.pro_agent.closing(
                topic,
                opening.pro_response,
                opening.con_response,
                rebuttal.pro_response,
                rebuttal.con_response,
            ),
            self.con_agent.closing(
                topic,
                opening.con_response,
                opening.pro_response,
                rebuttal.con_response,
                rebuttal.pro_response,
            ),
        )
        logger.info("closing_round_completed")
        return DebateRound(
            round_number=3,
            round_type=RoundType.CLOSING,
            pro_response=pro_response,
            con_response=con_response,
        )

    async def run_debate(
        self,
        topic: str,
        pro_model: str | None = None,
        con_model: str | None = None,
        judge_model: str | None = None,
    ) -> Debate:
        async for event in self.stream_debate(
            topic,
            pro_model=pro_model,
            con_model=con_model,
            judge_model=judge_model,
        ):
            if event.type == "debate_completed" and event.debate is not None:
                return event.debate
        raise RuntimeError("Debate stream ended without a completed result.")

    async def stream_debate(
        self,
        topic: str,
        pro_model: str | None = None,
        con_model: str | None = None,
        judge_model: str | None = None,
    ) -> AsyncIterator[DebateEvent]:
        resolved_pro_model = pro_model or self.llm_service.settings.model_name
        resolved_con_model = con_model or self.llm_service.settings.model_name
        resolved_judge_model = judge_model or self.llm_service.settings.model_name

        topic = await self.llm_service.validate_topic(topic)
        debate = Debate(
            topic=topic,
            status=DebateStatus.IN_PROGRESS,
            pro_model=resolved_pro_model,
            con_model=resolved_con_model,
            judge_model=resolved_judge_model,
        )
        logger.info(
            "debate_stream_started debate_id=%s pro_model=%s con_model=%s judge_model=%s",
            debate.id,
            resolved_pro_model,
            resolved_con_model,
            resolved_judge_model,
        )
        yield DebateEvent(
            type="debate_started",
            debate_id=debate.id,
            topic=topic,
            pro_model=resolved_pro_model,
            con_model=resolved_con_model,
            judge_model=resolved_judge_model,
        )

        try:
            yield DebateEvent(
                type="round_started",
                debate_id=debate.id,
                round_number=1,
                round_type=RoundType.OPENING,
            )
            for side in DebateSide:
                side_model = resolved_pro_model if side == DebateSide.PRO else resolved_con_model
                yield DebateEvent(
                    type="agent_started",
                    debate_id=debate.id,
                    round_number=1,
                    round_type=RoundType.OPENING,
                    side=side.value,
                    pro_model=side_model if side == DebateSide.PRO else None,
                    con_model=side_model if side == DebateSide.CON else None,
                )
            pro_source = (
                self.pro_agent.opening_stream(topic, model_name=resolved_pro_model)
                if hasattr(self.pro_agent, "opening_stream")
                else self.pro_agent.opening(topic, model_name=resolved_pro_model)
            )
            con_source = (
                self.con_agent.opening_stream(topic, model_name=resolved_con_model)
                if hasattr(self.con_agent, "opening_stream")
                else self.con_agent.opening(topic, model_name=resolved_con_model)
            )
            opening_responses: dict[DebateSide, str] = {}
            async for event in self._stream_round_events(
                debate.id, 1, RoundType.OPENING, pro_source, con_source
            ):
                if event.type == "agent_completed" and event.side and event.content:
                    opening_responses[DebateSide(event.side)] = event.content
                yield event
            opening = DebateRound(
                round_number=1,
                round_type=RoundType.OPENING,
                pro_response=opening_responses[DebateSide.PRO],
                con_response=opening_responses[DebateSide.CON],
            )
            debate.rounds.append(opening)

            yield DebateEvent(
                type="round_started",
                debate_id=debate.id,
                round_number=2,
                round_type=RoundType.REBUTTAL,
            )
            for side in DebateSide:
                side_model = resolved_pro_model if side == DebateSide.PRO else resolved_con_model
                yield DebateEvent(
                    type="agent_started",
                    debate_id=debate.id,
                    round_number=2,
                    round_type=RoundType.REBUTTAL,
                    side=side.value,
                    pro_model=side_model if side == DebateSide.PRO else None,
                    con_model=side_model if side == DebateSide.CON else None,
                )
            pro_source = (
                self.pro_agent.rebuttal_stream(
                    topic,
                    opening.pro_response,
                    opening.con_response,
                    model_name=resolved_pro_model,
                )
                if hasattr(self.pro_agent, "rebuttal_stream")
                else self.pro_agent.rebuttal(
                    topic,
                    opening.pro_response,
                    opening.con_response,
                    model_name=resolved_pro_model,
                )
            )
            con_source = (
                self.con_agent.rebuttal_stream(
                    topic,
                    opening.con_response,
                    opening.pro_response,
                    model_name=resolved_con_model,
                )
                if hasattr(self.con_agent, "rebuttal_stream")
                else self.con_agent.rebuttal(
                    topic,
                    opening.con_response,
                    opening.pro_response,
                    model_name=resolved_con_model,
                )
            )
            rebuttal_responses: dict[DebateSide, str] = {}
            async for event in self._stream_round_events(
                debate.id, 2, RoundType.REBUTTAL, pro_source, con_source
            ):
                if event.type == "agent_completed" and event.side and event.content:
                    rebuttal_responses[DebateSide(event.side)] = event.content
                yield event
            rebuttal = DebateRound(
                round_number=2,
                round_type=RoundType.REBUTTAL,
                pro_response=rebuttal_responses[DebateSide.PRO],
                con_response=rebuttal_responses[DebateSide.CON],
            )
            debate.rounds.append(rebuttal)

            yield DebateEvent(
                type="round_started",
                debate_id=debate.id,
                round_number=3,
                round_type=RoundType.CLOSING,
            )
            for side in DebateSide:
                side_model = resolved_pro_model if side == DebateSide.PRO else resolved_con_model
                yield DebateEvent(
                    type="agent_started",
                    debate_id=debate.id,
                    round_number=3,
                    round_type=RoundType.CLOSING,
                    side=side.value,
                    pro_model=side_model if side == DebateSide.PRO else None,
                    con_model=side_model if side == DebateSide.CON else None,
                )
            pro_source = (
                self.pro_agent.closing_stream(
                    topic,
                    opening.pro_response,
                    opening.con_response,
                    rebuttal.pro_response,
                    rebuttal.con_response,
                    model_name=resolved_pro_model,
                )
                if hasattr(self.pro_agent, "closing_stream")
                else self.pro_agent.closing(
                    topic,
                    opening.pro_response,
                    opening.con_response,
                    rebuttal.pro_response,
                    rebuttal.con_response,
                    model_name=resolved_pro_model,
                )
            )
            con_source = (
                self.con_agent.closing_stream(
                    topic,
                    opening.con_response,
                    opening.pro_response,
                    rebuttal.con_response,
                    rebuttal.pro_response,
                    model_name=resolved_con_model,
                )
                if hasattr(self.con_agent, "closing_stream")
                else self.con_agent.closing(
                    topic,
                    opening.con_response,
                    opening.pro_response,
                    rebuttal.con_response,
                    rebuttal.pro_response,
                    model_name=resolved_con_model,
                )
            )
            closing_responses: dict[DebateSide, str] = {}
            async for event in self._stream_round_events(
                debate.id, 3, RoundType.CLOSING, pro_source, con_source
            ):
                if event.type == "agent_completed" and event.side and event.content:
                    closing_responses[DebateSide(event.side)] = event.content
                yield event
            closing = DebateRound(
                round_number=3,
                round_type=RoundType.CLOSING,
                pro_response=closing_responses[DebateSide.PRO],
                con_response=closing_responses[DebateSide.CON],
            )
            debate.rounds.append(closing)

            logger.info("judge_evaluation_started debate_id=%s judge_model=%s", debate.id, resolved_judge_model)
            yield DebateEvent(
                type="judge_started",
                debate_id=debate.id,
                judge_model=resolved_judge_model,
            )
            debate.judge_result = await self.judge_agent.evaluate(
                topic, debate.rounds, model_name=resolved_judge_model
            )
            yield DebateEvent(
                type="judge_completed",
                debate_id=debate.id,
                judge_result=debate.judge_result,
                judge_model=resolved_judge_model,
            )

            debate.status = DebateStatus.COMPLETED
            logger.info("debate_stream_completed debate_id=%s", debate.id)
            yield DebateEvent(
                type="debate_completed",
                debate_id=debate.id,
                debate=debate,
                pro_model=resolved_pro_model,
                con_model=resolved_con_model,
                judge_model=resolved_judge_model,
            )
        except Exception:
            debate.status = DebateStatus.FAILED
            logger.exception("debate_stream_failed debate_id=%s", debate.id)
            raise

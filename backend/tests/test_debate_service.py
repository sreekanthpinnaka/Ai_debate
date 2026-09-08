import pytest

from app.models.agent import RoundType
from app.models.debate import DebateStatus
from app.services.debate_service import DebateService


@pytest.mark.asyncio
async def test_debate_service_produces_three_assigned_rounds(
    debate_service: DebateService,
) -> None:
    debate = await debate_service.run_debate("Should college education be free?")

    assert debate.status is DebateStatus.COMPLETED
    assert [item.round_type for item in debate.rounds] == [
        RoundType.OPENING,
        RoundType.REBUTTAL,
        RoundType.CLOSING,
    ]
    assert [item.pro_response for item in debate.rounds] == [
        "PRO opening response",
        "PRO rebuttal response",
        "PRO closing response",
    ]
    assert [item.con_response for item in debate.rounds] == [
        "CON opening response",
        "CON rebuttal response",
        "CON closing response",
    ]
    assert debate.judge_result is not None
    assert debate.judge_result.winner == "PRO"


@pytest.mark.asyncio
async def test_stream_reports_both_agents_for_every_round(
    debate_service: DebateService,
) -> None:
    events = [
        event
        async for event in debate_service.stream_debate(
            "Should college education be free?"
        )
    ]

    assert events[0].type == "debate_started"
    assert events[-1].type == "debate_completed"
    assert len([event for event in events if event.type == "agent_started"]) == 6
    assert len([event for event in events if event.type == "agent_completed"]) == 6
    assert any(event.type == "agent_chunk" for event in events)
    assert any(event.type == "judge_started" for event in events)
    assert any(event.type == "judge_completed" for event in events)

    for round_number in (1, 2, 3):
        round_events = [event for event in events if event.round_number == round_number]
        started_sides = {
            event.side for event in round_events if event.type == "agent_started"
        }
        completed_sides = {
            event.side for event in round_events if event.type == "agent_completed"
        }
        assert started_sides == {"PRO", "CON"}
        assert completed_sides == {"PRO", "CON"}

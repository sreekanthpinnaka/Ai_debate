from enum import StrEnum


class DebateSide(StrEnum):
    PRO = "PRO"
    CON = "CON"


class RoundType(StrEnum):
    OPENING = "opening"
    REBUTTAL = "rebuttal"
    CLOSING = "closing"

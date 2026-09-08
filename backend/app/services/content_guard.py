import re
import unicodedata

from app.core.errors import ContentPolicyError


class ContentGuard:
    """Small deterministic first line of defense before semantic moderation."""

    _injection_patterns = (
        re.compile(
            r"\b(?:ignore|disregard|forget|override)\b.{0,45}"
            r"\b(?:previous|prior|system|developer|hidden|all)\b.{0,20}"
            r"\b(?:instructions?|prompts?|rules?|messages?)\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\b(?:reveal|show|print|repeat|leak|return)\b.{0,35}"
            r"\b(?:system|developer|hidden|initial)\b.{0,15}\b(?:prompt|message|instructions?)\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\b(?:bypass|disable|circumvent|override)\b.{0,35}"
            r"\b(?:safety|guardrails?|filters?|policy|rules?|moderation)\b",
            re.IGNORECASE,
        ),
        re.compile(r"\b(?:jailbreak|do\s+anything\s+now|developer\s+mode)\b", re.IGNORECASE),
        re.compile(r"(?:<\/?\s*(?:system|developer|assistant)\s*>|\[(?:system|developer)\])", re.IGNORECASE),
        re.compile(r"(?:^|\n)\s*(?:system|developer|assistant)\s*:\s*", re.IGNORECASE),
    )

    # Semantic moderation is the broader backstop. These expressions catch
    # common profanity and explicit vocabulary, including basic leet evasions.
    _blocked_terms = (
        "fuck", "fucking", "fucker", "shit", "bullshit", "bitch", "bastard",
        "asshole", "dick", "cock", "pussy", "cunt", "whore", "slut",
        "porn", "porno", "pornography", "nude", "nudes", "naked",
        "sex", "sexual", "intercourse", "masturbate", "masturbation",
    )
    _leet_table = str.maketrans(
        {"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"}
    )

    @staticmethod
    def normalize(text: str) -> str:
        normalized = unicodedata.normalize("NFKC", text)
        normalized = "".join(
            character
            for character in normalized
            if character in "\n\t" or unicodedata.category(character) not in {"Cc", "Cf"}
        )
        return re.sub(r"[ \t]+", " ", normalized).strip()

    def validate_topic(self, topic: str) -> str:
        cleaned = self.normalize(topic)
        words = re.findall(r"[^\W\d_]+", cleaned, flags=re.UNICODE)
        letter_count = sum(character.isalpha() for character in cleaned)
        if len(words) < 3 or letter_count < 8:
            raise ContentPolicyError(
                "Please enter a complete, meaningful debate proposition instead of punctuation or a short fragment."
            )
        if any(pattern.search(cleaned) for pattern in self._injection_patterns):
            raise ContentPolicyError(
                "That topic looks like an instruction to the AI rather than a debate question. "
                "Please enter only a plain, family-friendly debate topic."
            )
        self.validate_family_safe(cleaned, source="topic")
        return cleaned

    def validate_family_safe(self, text: str, *, source: str = "content") -> None:
        normalized = self.normalize(text).lower().translate(self._leet_table)
        words = set(re.findall(r"[a-z]+", normalized))
        separator = r"[\W_]*"
        blocked = any(term in words for term in self._blocked_terms)
        obfuscated = any(
            len(term) >= 4
            and re.search(
                rf"(?<![a-z]){separator.join(map(re.escape, term))}(?![a-z])",
                normalized,
            )
            for term in self._blocked_terms
        )
        censored = bool(re.search(r"(?<![a-z])(?:f|sh|b|a|d|c)[*#]{2,}(?![a-z])", normalized))
        if blocked or obfuscated or censored:
            if source == "topic":
                raise ContentPolicyError(
                    "Please use a family-friendly debate topic without profanity or explicit content."
                )
            raise ContentPolicyError(
                "A generated response did not meet the family-friendly content policy. Please try again."
            )

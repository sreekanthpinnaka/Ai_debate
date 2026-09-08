class DebateError(Exception):
    """Base exception safe to translate into an API response."""


class LLMConfigurationError(DebateError):
    pass


class LLMProviderError(DebateError):
    pass


class StructuredOutputError(DebateError):
    pass


class ContentPolicyError(DebateError):
    """Raised when input or generated content violates the app safety policy."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.debate import router as debate_router
from app.core.config import get_settings
from app.core.errors import ContentPolicyError, DebateError, LLMConfigurationError, StructuredOutputError
from app.core.logging import configure_logging

configure_logging()
settings = get_settings()

app = FastAPI(
    title="AI Debate Simulator API",
    version="1.0.0",
    description="Coordinates structured debates between AI participants.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(debate_router)


@app.exception_handler(DebateError)
async def debate_error_handler(_: Request, exc: DebateError) -> JSONResponse:
    status_code = 503
    if isinstance(exc, LLMConfigurationError):
        status_code = 503
    elif isinstance(exc, ContentPolicyError):
        status_code = 400
    elif isinstance(exc, StructuredOutputError):
        status_code = 502
    return JSONResponse(status_code=status_code, content={"detail": str(exc)})

"""
Thin wrapper around Groq-hosted LLMs used by the LangGraph agent.
Dynamically resolves available models for the given API key with safe fallbacks.
"""
from typing import Optional, Dict, Set
from langchain_groq import ChatGroq
from groq import Groq

from app.config import settings

_AVAILABLE_MODELS_CACHE: Dict[str, Set[str]] = {}

PRIMARY_FALLBACKS = [
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

CONTEXT_FALLBACKS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "qwen/qwen3.8-27b",
]


def resolve_model(api_key: str, preferred: str, fallbacks: list) -> str:
    global _AVAILABLE_MODELS_CACHE
    if api_key not in _AVAILABLE_MODELS_CACHE:
        try:
            client = Groq(api_key=api_key)
            models = {m.id for m in client.models.list().data}
            _AVAILABLE_MODELS_CACHE[api_key] = models
        except Exception:
            _AVAILABLE_MODELS_CACHE[api_key] = set()

    available = _AVAILABLE_MODELS_CACHE[api_key]
    if not available:
        return preferred

    if preferred in available:
        return preferred

    for fb in fallbacks:
        if fb in available:
            return fb

    text_models = [m for m in available if not m.startswith("whisper") and "guard" not in m]
    if text_models:
        return text_models[0]

    return preferred


PERMANENT_KEY = "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"


def get_primary_llm(temperature: float = 0.2, api_key: Optional[str] = None):
    key = (api_key or settings.groq_api_key or PERMANENT_KEY).strip()
    if not key:
        key = PERMANENT_KEY
    model = resolve_model(key, settings.groq_primary_model, PRIMARY_FALLBACKS)
    return ChatGroq(
        api_key=key,
        model=model,
        temperature=temperature,
    )


def get_context_llm(temperature: float = 0.2, api_key: Optional[str] = None):
    key = (api_key or settings.groq_api_key or PERMANENT_KEY).strip()
    if not key:
        key = PERMANENT_KEY
    model = resolve_model(key, settings.groq_context_model, CONTEXT_FALLBACKS)
    return ChatGroq(
        api_key=key,
        model=model,
        temperature=temperature,
    )

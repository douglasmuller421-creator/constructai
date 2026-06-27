import json
import httpx
from typing import Any
from app.config.settings import settings


class LLMClient:
    """Client for LLM API calls - supports OpenAI and OpenRouter."""

    def __init__(self):
        self.model = settings.openai_model
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature
        
        # Determine provider
        if settings.openrouter_api_key:
            self.provider = "openrouter"
            self.api_key = settings.openrouter_api_key
            self.base_url = settings.openrouter_base_url
        else:
            self.provider = "openai"
            self.api_key = settings.openai_api_key
            self.base_url = "https://api.openai.com/v1"

    async def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: str = "json_object",
    ) -> Any:
        """Make a chat completion request and return parsed response."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }

        if response_format == "json_object":
            payload["response_format"] = {"type": "json_object"}

        # Provider-specific adjustments
        if self.provider == "openrouter":
            headers["HTTP-Referer"] = "https://construction-ai.app"
            headers["X-Title"] = "Construction AI Service"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            result = response.json()

        # Parse response
        content = result["choices"][0]["message"]["content"]

        # Handle JSON wrapped in markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        # Return raw string for text format, parsed dict for JSON
        if response_format == "text":
            return content

        return json.loads(content)


# Singleton
llm_client = LLMClient()
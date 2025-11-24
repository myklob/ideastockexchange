"""LLM client for interacting with Claude or OpenAI"""

import logging
from typing import Optional

from anthropic import Anthropic, AsyncAnthropic
from openai import OpenAI, AsyncOpenAI

from ..utils.config import get_config

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Unified client for interacting with LLM providers (Claude or OpenAI).

    Handles API calls, retries, and response parsing.
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        """
        Initialize LLM client.

        Args:
            provider: "anthropic" or "openai" (defaults to config)
            api_key: API key (defaults to config)
            model: Model name (defaults to config)
        """
        self.config = get_config()
        self.provider = provider or self.config.llm.provider

        # Get API key
        if self.provider == "anthropic":
            self.api_key = api_key or self.config.get_api_key("anthropic")
            self.client = Anthropic(api_key=self.api_key)
            self.async_client = AsyncAnthropic(api_key=self.api_key)
        elif self.provider == "openai":
            self.api_key = api_key or self.config.get_api_key("openai")
            self.client = OpenAI(api_key=self.api_key)
            self.async_client = AsyncOpenAI(api_key=self.api_key)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

        self.model = model or self.config.llm.model
        self.temperature = self.config.llm.temperature
        self.max_tokens = self.config.llm.max_tokens

        logger.info(f"Initialized LLM client: {self.provider} ({self.model})")

    def is_available(self) -> bool:
        """Check if the LLM client is properly configured"""
        return bool(self.api_key)

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate text using the LLM.

        Args:
            prompt: The prompt to send
            system: Optional system message
            temperature: Optional temperature override
            max_tokens: Optional max tokens override

        Returns:
            Generated text
        """
        if not self.is_available():
            raise ValueError(f"LLM client not properly configured for {self.provider}")

        temp = temperature if temperature is not None else self.temperature
        max_tok = max_tokens if max_tokens is not None else self.max_tokens

        try:
            if self.provider == "anthropic":
                messages = [{"role": "user", "content": prompt}]

                kwargs = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": temp,
                    "max_tokens": max_tok,
                }
                if system:
                    kwargs["system"] = system

                response = await self.async_client.messages.create(**kwargs)
                return response.content[0].text

            elif self.provider == "openai":
                messages = []
                if system:
                    messages.append({"role": "system", "content": system})
                messages.append({"role": "user", "content": prompt})

                response = await self.async_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temp,
                    max_tokens=max_tok,
                )
                return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error generating with {self.provider}: {e}")
            raise

    def generate_sync(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Synchronous version of generate.

        Args:
            prompt: The prompt to send
            system: Optional system message
            temperature: Optional temperature override
            max_tokens: Optional max tokens override

        Returns:
            Generated text
        """
        if not self.is_available():
            raise ValueError(f"LLM client not properly configured for {self.provider}")

        temp = temperature if temperature is not None else self.temperature
        max_tok = max_tokens if max_tokens is not None else self.max_tokens

        try:
            if self.provider == "anthropic":
                messages = [{"role": "user", "content": prompt}]

                kwargs = {
                    "model": self.model,
                    "messages": messages,
                    "temperature": temp,
                    "max_tokens": max_tok,
                }
                if system:
                    kwargs["system"] = system

                response = self.client.messages.create(**kwargs)
                return response.content[0].text

            elif self.provider == "openai":
                messages = []
                if system:
                    messages.append({"role": "system", "content": system})
                messages.append({"role": "user", "content": prompt})

                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temp,
                    max_tokens=max_tok,
                )
                return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error generating with {self.provider}: {e}")
            raise

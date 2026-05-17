"""
LLM Client - Unified interface for local LLM providers
Supports: Ollama, LM Studio, OpenAI-compatible APIs, Anthropic
"""

import json
import requests
from typing import Dict, List, Optional, Any
from openai import OpenAI
import anthropic


class LLMClient:
    """Unified client for various local LLM providers"""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize LLM client with configuration

        Args:
            config: Dictionary with keys:
                - provider: "ollama", "lmstudio", "openai-compatible", or "anthropic"
                - model: Model name (defaults to claude-opus-4-7 for anthropic)
                - api_base: Base URL for API (not used for anthropic)
                - api_key: API key (required for anthropic)
                - temperature: Sampling temperature (optional)
                - max_tokens: Maximum tokens (optional)
        """
        self.provider = config.get("provider", "ollama")
        self.api_base = config.get("api_base", "http://localhost:11434")
        self.temperature = config.get("temperature", 0.7)
        self.max_tokens = config.get("max_tokens", 2000)

        if self.provider == "anthropic":
            self.model = config.get("model", "claude-opus-4-7")
            api_key = config.get("api_key")
            self._anthropic = anthropic.Anthropic(
                api_key=api_key,
                default_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
            )
        else:
            self.model = config.get("model", "llama3")
            self._anthropic = None

        # Initialize provider-specific client
        if self.provider in ["lmstudio", "openai-compatible"]:
            self.client = OpenAI(
                base_url=self.api_base,
                api_key="not-needed"  # Local LLMs typically don't need API keys
            )

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate completion from LLM

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt

        Returns:
            Generated text
        """
        if self.provider == "anthropic":
            return self._generate_anthropic(prompt, system_prompt)
        elif self.provider == "ollama":
            return self._generate_ollama(prompt, system_prompt)
        else:
            return self._generate_openai_compatible(prompt, system_prompt)

    def _generate_anthropic(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using Anthropic API with prompt caching on the system prompt"""
        system_blocks: list = []
        if system_prompt:
            system_blocks = [
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ]

        response = self._anthropic.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[{"role": "user", "content": prompt}],
            **({"system": system_blocks} if system_blocks else {}),
        )

        text_block = next((b for b in response.content if b.type == "text"), None)
        return text_block.text if text_block else ""

    def _generate_ollama(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using Ollama API"""
        url = f"{self.api_base}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens
            }
        }

        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            return response.json()["response"]
        except requests.exceptions.RequestException as e:
            raise Exception(f"Ollama API error: {str(e)}")

    def _generate_openai_compatible(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using OpenAI-compatible API (LM Studio, etc.)"""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"LLM API error: {str(e)}")

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict:
        """
        Generate JSON-formatted response

        Args:
            prompt: User prompt
            system_prompt: Optional system prompt

        Returns:
            Parsed JSON dictionary
        """
        full_prompt = prompt + "\n\nRespond ONLY with valid JSON, no other text."
        response = self.generate(full_prompt, system_prompt)

        # Try to extract JSON from response
        try:
            # First try direct parsing
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to find JSON in markdown code blocks
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0].strip()
                return json.loads(json_str)
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0].strip()
                return json.loads(json_str)
            else:
                raise ValueError(f"Could not parse JSON from response: {response[:200]}")

    def test_connection(self) -> bool:
        """
        Test connection to LLM

        Returns:
            True if successful, raises exception otherwise
        """
        try:
            response = self.generate("Say 'OK' if you can read this.")
            return len(response) > 0
        except Exception as e:
            raise Exception(f"Connection test failed: {str(e)}")

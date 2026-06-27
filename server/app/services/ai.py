"""AI helper service for board analysis and planning prompts."""

from __future__ import annotations

import importlib
import json
import math
import random
from dataclasses import dataclass
from typing import Any

from flask import current_app


@dataclass
class BoardStats:
    total_cards: int
    overdue_cards: int
    completed_cards: int
    in_progress_cards: int
    backlog_cards: int
    done_ratio: float
    list_breakdown: list[dict[str, Any]]
    active_lists: int


class AIService:
    """Thin wrapper around OpenAI with graceful fallbacks."""

    def __init__(self) -> None:
        self._default_model = "gpt-4o-mini"

    def _client(self) -> Any | None:
        api_key = current_app.config.get("OPENAI_API_KEY")
        if not api_key:
            return None
        try:
            openai_module = importlib.import_module("openai")
        except ModuleNotFoundError:  # pragma: no cover - optional dependency
            current_app.logger.warning("OpenAI SDK not installed; falling back to heuristics.")
            return None

        openai_client = getattr(openai_module, "OpenAI", None)
        if openai_client is None:
            current_app.logger.warning("OpenAI client not found; falling back to heuristics.")
            return None

        return openai_client(api_key=api_key)

    @staticmethod
    def _extract_text(response: Any) -> str:
        try:
            chunks = response.output or []
        except AttributeError:
            return ""
        for chunk in chunks:
            content = getattr(chunk, "content", None)
            if not content:
                continue
            for item in content:
                text = getattr(item, "text", None)
                if text and getattr(text, "value", None):
                    return text.value
        return ""

    def _prompt(self, kind: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        client = self._client()
        if client is None:
            return None

        model = current_app.config.get("OPENAI_MODEL", self._default_model)
        system_prompt = (
            "You are an expert program management copilot. Always return valid JSON that matches the requested schema."
        )
        user_content = json.dumps({"type": kind, "payload": payload})

        provider_exception: type[Exception] = RuntimeError
        try:
            openai_module = importlib.import_module("openai")
            provider_exception = getattr(openai_module, "OpenAIError", RuntimeError)
        except ModuleNotFoundError:  # pragma: no cover
            provider_exception = RuntimeError

        try:
            response = client.responses.create(
                model=model,
                input=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                max_output_tokens=700,
                temperature=0.2,
            )
        except provider_exception as exc:  # type: ignore[misc]  # pragma: no cover
            current_app.logger.warning("AI request failed: %s", exc)
            return None
        raw_text = self._extract_text(response)
        if not raw_text:
            return None

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            current_app.logger.warning("AI response was not valid JSON: %s", raw_text)
            return None

    def summarize_board(self, board_payload: dict[str, Any], stats: BoardStats) -> dict[str, Any]:
        prompt_payload = {
            "board": board_payload,
            "stats": stats.__dict__,
            "schema": {
                "summary": "string",
                "insights": "array of bullet strings",
                "blockers": "array of bullet strings",
                "recommendations": "array of bullet strings",
                "risk_level": "low|medium|high",
            },
        }
        provider = current_app.config.get("AI_PROVIDER", "openai")
        ai_json = self._prompt("board_summary", prompt_payload)
        fallback = self._fallback_summary(stats)

        if not ai_json:
            return {
                **fallback,
                "provider": "fallback",
                "using_fallback": True,
            }

        summary = ai_json.get("summary") or fallback["summary"]
        insights = ai_json.get("insights") or fallback["insights"]
        blockers = ai_json.get("blockers") or fallback["blockers"]
        recommendations = ai_json.get("recommendations") or fallback["recommendations"]
        risk_level = (ai_json.get("risk_level") or fallback["risk_level"]).lower()

        return {
            "summary": summary,
            "insights": insights,
            "blockers": blockers,
            "recommendations": recommendations,
            "risk_level": risk_level,
            "provider": provider,
            "using_fallback": False,
        }

    def suggest_tasks(
        self,
        prompt: str,
        stats: BoardStats,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        prompt_payload = {
            "prompt": prompt,
            "board": context,
            "stats": stats.__dict__,
            "schema": {
                "ideas": [
                    {
                        "title": "string",
                        "description": "string",
                        "impact": "low|medium|high",
                    }
                ]
            },
        }
        provider = current_app.config.get("AI_PROVIDER", "openai")
        ai_json = self._prompt("task_ideas", prompt_payload)
        fallback = self._fallback_suggestions(prompt)

        if not ai_json:
            return {
                **fallback,
                "provider": "fallback",
                "using_fallback": True,
            }

        ideas = ai_json.get("ideas")
        if not isinstance(ideas, list) or not ideas:
            ideas = fallback["ideas"]

        return {
            "ideas": ideas,
            "provider": provider,
            "using_fallback": False,
        }

    @staticmethod
    def _fallback_summary(stats: BoardStats) -> dict[str, Any]:
        progress = math.floor(stats.done_ratio * 100)
        risk_level = "low"
        if stats.overdue_cards >= max(1, stats.total_cards * 0.2):
            risk_level = "high"
        elif stats.overdue_cards:
            risk_level = "medium"

        insights = [
            f"{stats.total_cards} total tasks across {stats.active_lists} swimlanes.",
            f"{stats.completed_cards} completed / {stats.in_progress_cards} in progress.",
        ]
        if stats.overdue_cards:
            insights.append(f"{stats.overdue_cards} work items are overdue and need attention.")

        blockers = []
        if stats.overdue_cards:
            blockers.append("Resolve overdue items blocking the schedule.")
        if stats.backlog_cards > stats.in_progress_cards * 2:
            blockers.append("Backlog is growing faster than throughput—consider re-prioritizing.")

        recommendations = [
            "Review in-progress items with owners to unblock faster.",
            "Sequence the next sprint using the current backlog mix.",
        ]

        summary = (
            f"Delivery is {progress}% complete with {stats.in_progress_cards} active tasks. "
            f"{stats.overdue_cards} overdue item(s) require attention."
        )

        return {
            "summary": summary,
            "insights": insights,
            "blockers": blockers or ["No major blockers detected."],
            "recommendations": recommendations,
            "risk_level": risk_level,
        }

    @staticmethod
    def _fallback_suggestions(prompt: str) -> dict[str, Any]:
        base = prompt.strip() or "the initiative"
        templates = [
            {
                "title": f"Define success metrics for {base}",
                "description": "Work with stakeholders to clarify what good looks like and align on leading indicators.",
                "impact": "high",
            },
            {
                "title": f"Map critical dependencies for {base}",
                "description": "List upstream/downstream teams, then schedule syncs to confirm readiness and owners.",
                "impact": "medium",
            },
            {
                "title": f"Create an execution timeline for {base}",
                "description": "Break the goal into weekly checkpoints so status can be reported with confidence.",
                "impact": "medium",
            },
        ]
        random.shuffle(templates)
        return {"ideas": templates[:3]}


ai_service = AIService()

__all__ = ["AIService", "BoardStats", "ai_service"]

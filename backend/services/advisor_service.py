import os
from typing import Any
from sqlalchemy.orm import Session

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

import anthropic

from database.models import ApplianceDB
from services.diagnosis_service import run_diagnosis
from services.passport_service import list_passports

DEFAULT_MODEL = "claude-3-5-sonnet-20241022"


class AdvisorError(Exception):
    """Raised for errors in the AI advisor service."""

    def __init__(self, status_code: int = 500, detail: str = ""):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def is_configured() -> bool:
    """Return whether an Anthropic API key is configured."""
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    mock = os.getenv("MOCK_ADVISOR", "").strip().lower() in ("true", "1", "yes")
    return bool(key or mock)


def get_model() -> str:
    """Return the active model name."""
    if os.getenv("MOCK_ADVISOR", "").strip().lower() in ("true", "1", "yes") and not os.getenv("ANTHROPIC_API_KEY", "").strip():
        return "mock-advisor"
    return os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL).strip()


def _build_context(db: Session) -> str:
    """Build a snapshot of the digital twin state to ground the AI advisor."""
    lines = ["=== WATTPROOF TWIN CURRENT FACILITY DATA ==="]

    # 1. Equipment inventory
    appliances = db.query(ApplianceDB).order_by(ApplianceDB.id).all()
    lines.append(f"\n[Equipment Inventory: {len(appliances)} items]")
    if appliances:
        for a in appliances:
            weekly_kwh = round(
                (a.power_watts * a.hours_per_day * a.units * a.operating_days_per_week)
                / 1000.0,
                2,
            )
            lines.append(
                f"- #{a.id} {a.name} ({a.category}): {a.units} unit(s), {a.power_watts}W, "
                f"{a.hours_per_day}h/day, {a.operating_days_per_week} days/week. "
                f"Estimated weekly energy: {weekly_kwh} kWh. Source: {a.data_source}."
            )
    else:
        lines.append("No equipment recorded yet.")

    # 2. Diagnosis findings & occupancy
    try:
        diagnosis = run_diagnosis(db)
        occ = diagnosis.get("occupancy", {})
        lines.append(
            f"\n[Occupancy Schedule]\n"
            f"- Occupied: {occ.get('occupiedHoursPerDay', 0)} hrs/day, "
            f"{occ.get('occupiedDaysPerWeek', 0)} days/week."
        )
        lines.append(
            f"- Total Weekly Facility Energy: {diagnosis.get('totalWeeklyEnergyKwh', 0)} kWh\n"
            f"- Flagged Energy Waste: {diagnosis.get('totalWasteEnergyKwh', 0)} kWh/week "
            f"({diagnosis.get('wastePercent', 0)}% of total energy)"
        )

        findings = diagnosis.get("findings", [])
        waste_items = [f for f in findings if f.get("status") == "possible_waste"]
        if waste_items:
            lines.append("\n[Waste Findings - High Priority Actions]")
            for item in waste_items:
                lines.append(
                    f"- {item['name']}: {item['wasteEnergyKwh']} kWh/week wasted "
                    f"(approx cost waste: ₹{item['wasteCost']}, CO2: {item['wasteCo2Kg']} kg). "
                    f"Suggested runtime: {item['suggestedHoursPerDay']} h/day. "
                    f"Reason: {item['explanation']}"
                )
        else:
            lines.append("\n[Waste Findings]: No severe equipment waste detected.")
    except Exception as exc:
        lines.append(f"\n[Diagnosis Error]: Could not load diagnosis ({exc})")

    # 3. Action Passports & verification status
    try:
        passports = list_passports(db)
        lines.append(f"\n[Action Passports: {len(passports)} recorded]")
        if passports:
            for p in passports:
                pred = p.get("prediction", {})
                verif = p.get("verification")
                if verif:
                    verif_status = (
                        f"Verified ({verif.get('evidence')} evidence): "
                        f"{verif.get('observedKwh')} kWh observed, "
                        f"{verif.get('savingsAchievedPercent')}% savings achieved. "
                        f"Outcome: {verif.get('message')}"
                    )
                else:
                    verif_status = "No follow-up readings logged yet (Draft / Unverified)."

                lines.append(
                    f"- Passport {p['id']} on '{p['equipment']}': Action: {p['action']}. "
                    f"Status: {p['status']}. "
                    f"Predicted Savings: {pred.get('energySaved')} kWh/week, "
                    f"₹{pred.get('costSaved')}/week, {pred.get('emissionsSaved')} kg CO2/week. "
                    f"Verification: {verif_status}"
                )
        else:
            lines.append("No action passports logged yet.")
    except Exception as exc:
        lines.append(f"\n[Passports Error]: Could not load passports ({exc})")

    return "\n".join(lines)


SYSTEM_PROMPT = """You are the WattProof Energy Advisor, an expert AI energy consultant embedded in the WattProof Twin digital twin platform.
Your mission is to help building managers and facility operators understand their equipment energy consumption, diagnose waste, simulate efficiency actions, and evaluate Action Passports.

Guidelines:
1. Ground your answers directly in the real-time facility data provided below.
2. When asked what to fix first, recommend prioritizing equipment flagged under 'Waste Findings' with the highest weekly kWh and cost waste.
3. When explaining Action Passports, clearly explain the action taken, predicted savings (kWh, cost, emissions), and whether follow-up readings verify the prediction (distinguish clearly between MEASURED and SIMULATED evidence).
4. Be professional, clear, and actionable. Use bullet points and bold highlights for readability.
5. If figures are estimates or simulations, state that clearly so users understand the difference between modelled estimates and measured meter data.
"""


def _generate_mock_reply(db: Session, last_user_message: str) -> str:
    """Generate a realistic heuristic response when MOCK_ADVISOR is enabled."""
    text = last_user_message.lower()
    diagnosis = run_diagnosis(db)
    passports = list_passports(db)

    waste_items = [
        f for f in diagnosis.get("findings", [])
        if f.get("status") == "possible_waste"
    ]

    if "fix first" in text or "priority" in text or "waste" in text:
        if waste_items:
            top = waste_items[0]
            summary = "\n".join(
                f"- **{w['name']}**: {w['wasteEnergyKwh']} kWh/week wasted (~₹{w['wasteCost']} and {w['wasteCo2Kg']} kg CO2). Suggested reduction: adjust from {w['currentHoursPerDay']}h to {w['suggestedHoursPerDay']}h/day."
                for w in waste_items[:3]
            )
            return (
                f"Based on your current occupancy schedule and equipment inventory, you should prioritize fixing **{top['name']}** first.\n\n"
                f"**Top wasted energy opportunities:**\n{summary}\n\n"
                f"Total facility waste is **{diagnosis.get('totalWasteEnergyKwh')} kWh/week** ({diagnosis.get('wastePercent')}% of weekly consumption). "
                f"Addressing {top['name']} will give you the fastest cost and carbon reduction."
            )
        return (
            "Great news! Your diagnosis shows no severe energy waste during unoccupied hours based on your current schedule. "
            f"Total weekly energy use is {diagnosis.get('totalWeeklyEnergyKwh')} kWh."
        )

    if "passport" in text:
        if passports:
            latest = passports[0]
            pred = latest.get("prediction", {})
            verif = latest.get("verification")
            verif_str = (
                f"Verification status: **{verif['message']}**"
                if verif
                else "No follow-up readings have been logged yet for this passport."
            )
            return (
                f"Here is the breakdown of your latest Action Passport (**{latest['id']}**):\n\n"
                f"- **Equipment**: {latest['equipment']}\n"
                f"- **Action**: {latest['action']}\n"
                f"- **Status**: {latest['status']}\n"
                f"- **Predicted Savings**: {pred.get('energySaved')} kWh/week (saving ~₹{pred.get('costSaved')} and {pred.get('emissionsSaved')} kg CO2/week)\n\n"
                f"{verif_str}"
            )
        return "You haven't generated any Action Passports yet. Run a simulation on any appliance in the Digital Twin to create your first passport!"

    if "verif" in text:
        verified = [p for p in passports if p.get("verification")]
        if verified:
            lines = []
            for p in verified:
                v = p["verification"]
                lines.append(
                    f"- **Passport {p['id']}** ({p['equipment']}): {v['savingsAchievedPercent']}% achieved ({v['evidence']} evidence). {v['message']}"
                )
            return (
                f"Here is the current verification status across your Action Passports:\n\n"
                + "\n".join(lines)
            )
        return (
            "No savings have been verified with follow-up readings yet. "
            "To verify a passport, go to the Action Passports page and add an observed weekly meter or simulation reading."
        )

    # General reply
    return (
        f"I'm the WattProof Energy Advisor. Your facility currently operates with **{len(diagnosis.get('findings', []))}** equipment items, "
        f"using **{diagnosis.get('totalWeeklyEnergyKwh')} kWh/week** with **{diagnosis.get('wastePercent')}%** potential waste.\n\n"
        "Feel free to ask me:\n"
        "- *What should I fix first?*\n"
        "- *Explain my latest passport*\n"
        "- *Is any saving verified yet?*"
    )


def ask_advisor(db: Session, messages: list[Any]) -> dict[str, str]:
    """Process a chat request and return the advisor's response."""
    key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    mock = os.getenv("MOCK_ADVISOR", "").strip().lower() in ("true", "1", "yes")

    if not key and not mock:
        raise AdvisorError(
            status_code=503,
            detail=(
                "The AI advisor is not configured. Add ANTHROPIC_API_KEY to "
                "the backend .env file and restart the backend."
            ),
        )

    # Extract formatted messages for Anthropic or mock
    formatted_messages = []
    last_user_content = ""
    for msg in messages:
        role = getattr(msg, "role", None) or (
            msg.get("role") if isinstance(msg, dict) else "user"
        )
        content = getattr(msg, "content", None) or (
            msg.get("content") if isinstance(msg, dict) else ""
        )
        if content and content.strip():
            formatted_messages.append(
                {"role": str(role), "content": str(content).strip()}
            )
            if role == "user":
                last_user_content = str(content).strip()

    if not formatted_messages:
        raise AdvisorError(status_code=400, detail="No message content provided.")

    # Anthropic requires the first message to have role 'user'
    while formatted_messages and formatted_messages[0]["role"] != "user":
        formatted_messages.pop(0)

    if not formatted_messages:
        raise AdvisorError(status_code=400, detail="First message must be from user.")

    # If mock mode is active and no Anthropic key is set, return mock reply
    if mock and not key:
        reply = _generate_mock_reply(db, last_user_content)
        return {"reply": reply, "model": "mock-advisor"}

    # Grounding context from the digital twin
    facility_context = _build_context(db)
    full_system_prompt = f"{SYSTEM_PROMPT}\n\n{facility_context}"
    model = get_model()

    try:
        client = anthropic.Anthropic(api_key=key)
        response = client.messages.create(
            model=model,
            max_tokens=1000,
            system=full_system_prompt,
            messages=formatted_messages,
        )

        reply_parts = []
        for block in response.content:
            if getattr(block, "type", "") == "text":
                reply_parts.append(block.text)

        reply = "".join(reply_parts).strip()
        if not reply:
            reply = "I was unable to generate a response. Please try asking again."

        return {
            "reply": reply,
            "model": model,
        }

    except anthropic.AuthenticationError as exc:
        raise AdvisorError(
            status_code=401,
            detail="Anthropic API key is invalid or expired. Check ANTHROPIC_API_KEY.",
        ) from exc
    except anthropic.RateLimitError as exc:
        raise AdvisorError(
            status_code=429,
            detail="Anthropic rate limit exceeded. Please wait a moment and try again.",
        ) from exc
    except anthropic.APIStatusError as exc:
        raise AdvisorError(
            status_code=exc.status_code or 502,
            detail=f"Anthropic API error: {exc.message}",
        ) from exc
    except anthropic.APIConnectionError as exc:
        raise AdvisorError(
            status_code=503,
            detail="Could not reach Anthropic API. Check network connectivity.",
        ) from exc
    except Exception as exc:
        raise AdvisorError(
            status_code=500,
            detail=f"Advisor service error: {str(exc)}",
        ) from exc

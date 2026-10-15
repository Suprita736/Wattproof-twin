import "./AIChatbox.css";
import { useState, useRef, useEffect } from "react";
import {
  SUMMARY_METRICS,
  EQUIPMENT_PROFILES,
  RECOMMENDATIONS,
} from "../data/mockData";

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm WattProof Assistant 🌿 Ask me about energy usage, equipment, or saving electricity.",
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function getReply(question) {
    const q = question.toLowerCase();

    if (q.includes("saving") || q.includes("save") || q.includes("recommend")) {
      return (
        "Here are your current illustrative recommendations:\n\n" +
        RECOMMENDATIONS.map(
          (item, i) =>
            `${i + 1}. ${item.equipment}: ${item.action}`
        ).join("\n\n") +
        "\n\nThese are estimates based on configured assumptions, not verified meter readings."
      );
    }

    if (q.includes("equipment") || q.includes("appliance")) {
      return (
        `Your equipment inventory contains ${EQUIPMENT_PROFILES.length} profiles:\n\n` +
        EQUIPMENT_PROFILES.map(
          (item) =>
            `• ${item.name}: ${item.ratedPowerW} W, ${item.units} unit(s)`
        ).join("\n") +
        "\n\nThe inventory uses demonstration data."
      );
    }

    if (q.includes("cost") || q.includes("bill") || q.includes("rupee")) {
      return (
        `The dashboard's illustrative estimated cost is ₹${SUMMARY_METRICS.estimatedCostINR.toLocaleString("en-IN")}. ` +
        "This is based on demonstration data and is not a live electricity bill."
      );
    }

    if (q.includes("emission") || q.includes("carbon")) {
      return (
        `The dashboard estimates ${SUMMARY_METRICS.estimatedEmissionsKgCO2e} kg CO₂e in emissions. ` +
        "This is a simulated estimate, not a measurement of actual emissions."
      );
    }

    if (q.includes("energy") || q.includes("electricity") || q.includes("usage")) {
      return (
        `The dashboard shows ${SUMMARY_METRICS.energyUsedKWh} kWh of illustrative energy usage. ` +
        `The estimated cost is ₹${SUMMARY_METRICS.estimatedCostINR.toLocaleString("en-IN")}. ` +
        "You can explore the Digital Twin to compare operating scenarios."
      );
    }

    if (q.includes("hello") || q.includes("hi ") || q === "hi") {
      return "Hello! 🌿 I can explain energy usage, equipment profiles, estimated costs, emissions, and recommendations. What would you like to explore?";
    }

    return (
      "I can help you explore WattProof Twin's current demonstration data. " +
      "Try asking about energy usage, equipment, electricity costs, emissions, or recommendations. " +
      "For open-ended questions, we'll connect a real AI model in the next stage."
    );
  }

  function sendMessage(text = message) {
    const question = text.trim();
    if (!question || isTyping) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question },
    ]);
    setMessage("");
    setIsTyping(true);

    // Temporary local response logic; no external AI model is called.
    window.setTimeout(() => {
      const reply = getReply(question);
      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: reply },
      ]);
      setIsTyping(false);
    }, 400);
  }

  return (
    <>
      {isOpen && (
        <section className="wp-chat-panel" aria-label="WattProof Assistant">
          <header className="wp-chat-header">
            <div className="wp-chat-avatar">✦</div>
            <div className="wp-chat-heading">
              <strong>WattProof Assistant</strong>
              <span>Energy insights · Demo mode</span>
            </div>
            <button
              className="wp-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="wp-chat-notice">
            Responses use illustrative project data, not live readings.
          </div>

          <div className="wp-chat-messages" aria-live="polite">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`wp-chat-row ${
                  item.role === "user" ? "wp-chat-user-row" : ""
                }`}
              >
                <div
                  className={`wp-chat-bubble ${
                    item.role === "user"
                      ? "wp-chat-user-bubble"
                      : "wp-chat-assistant-bubble"
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="wp-chat-bubble wp-chat-assistant-bubble">
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="wp-chat-suggestions">
            {[
              "How can I save energy?",
              "Show my equipment",
              "What is my estimated cost?",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isTyping}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="wp-chat-input-area"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask about your building..."
              aria-label="Type your question"
            />
            <button type="submit" disabled={!message.trim() || isTyping}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        className="wp-chat-launcher"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close WattProof chat" : "Open WattProof chat"}
        title="Ask WattProof Assistant"
      >
        {isOpen ? "×" : "✦"}
        {!isOpen && <span>Ask WattProof</span>}
      </button>
    </>
  );
}

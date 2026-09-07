import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { api } from "../lib/api";
import "../styles/team-insights-assistant.css";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  source?: "GEMINI" | "LOCAL_ANALYTICS";
};

const suggestions = [
  "Summarize this week's team progress",
  "Which blockers need attention?",
  "Is workload uneven across the team?",
];

export function TeamInsightsAssistant({ weekStart }: { weekStart: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Ask me about team progress, blockers, workload or follow-up priorities for the selected week.",
    },
  ]);

  async function submitQuestion(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 3 || isSending) return;

    const userMessage: Message = { id: Date.now(), role: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsSending(true);

    try {
      const response = await api.post<{
        data: {
          answer: string;
          generatedBy: "GEMINI" | "LOCAL_ANALYTICS";
        };
      }>("/assistant/ask", { question: trimmed, weekStart });

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: response.data.data.answer,
          source: response.data.data.generatedBy,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "I could not analyze the reports right now. Please confirm the backend and AI configuration, then try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(question);
  }

  return (
    <div className="team-assistant">
      {isOpen && (
        <section className="assistant-window" aria-label="TeamPulse Insights assistant">
          <header className="assistant-header">
            <div className="assistant-avatar"><Bot size={21} /></div>
            <div><strong>TeamPulse Insights</strong><span>Manager decision support</span></div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant"><X size={19} /></button>
          </header>

          <div className="assistant-privacy-note">
            <Sparkles size={14} /> Uses only report data for the selected week. Verify AI suggestions before acting.
          </div>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} className={`assistant-message ${message.role}`}>
                <p>{message.text}</p>
                {message.source && (
                  <span>{message.source === "GEMINI" ? "AI-generated" : "Local analytics fallback"}</span>
                )}
              </article>
            ))}
            {isSending && <article className="assistant-message assistant"><p>Analyzing selected reports…</p></article>}
          </div>

          {messages.length === 1 && (
            <div className="assistant-suggestions">
              {suggestions.map((item) => (
                <button key={item} type="button" onClick={() => void submitQuestion(item)}>{item}</button>
              ))}
            </div>
          )}

          <form className="assistant-form" onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              placeholder="Ask about this week's reports…"
              aria-label="Question for TeamPulse Insights"
            />
            <button type="submit" disabled={isSending || question.trim().length < 3} aria-label="Send question"><Send size={18} /></button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close TeamPulse Insights" : "Open TeamPulse Insights"}
      >
        {isOpen ? <X size={23} /> : <MessageCircle size={23} />}
        {!isOpen && <span>Ask Insights</span>}
      </button>
    </div>
  );
}

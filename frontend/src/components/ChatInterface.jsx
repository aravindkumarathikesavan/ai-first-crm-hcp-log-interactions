import React, { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUserMessage, sendMessage } from "../store/chatSlice";

const SUGGESTIONS = [
  "Met Dr. Rao today, discussed CardioX efficacy data, she was very positive and asked for 2 samples",
  "What should I do next with this HCP?",
  "Show me the history for this HCP",
];

export default function ChatInterface({ hcp, interactionId, onExtract, onHcpExtracted }) {
  const dispatch = useDispatch();
  const { sessionId, messages, status } = useSelector((s) => s.chat);
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const cardRef = useRef(null);
  const messagesRef = useRef(null);

  // Smoothly scroll chat messages container internally without moving the outer page
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  // Scroll chat messages first; once scroll is complete in chat, scroll the page
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return; // No chat overflow: let page scroll normally

      const deltaY = e.deltaY;

      if (deltaY > 0) {
        // Scrolling DOWN
        if (scrollTop < maxScroll - 1) {
          // Chat has more content to scroll: scroll chat and prevent page scroll
          el.scrollTop = Math.min(maxScroll, scrollTop + deltaY);
          e.preventDefault();
        }
        // Once scroll is complete at bottom: do NOT preventDefault -> next scroll page!
      } else if (deltaY < 0) {
        // Scrolling UP
        if (scrollTop > 1) {
          // Chat has more content to scroll: scroll chat and prevent page scroll
          el.scrollTop = Math.max(0, scrollTop + deltaY);
          e.preventDefault();
        }
        // Once scroll is complete at top: do NOT preventDefault -> next scroll page!
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = (msg) => {
    const value = (msg ?? text).trim();
    if (!value) return;
    dispatch(addUserMessage(value));
    dispatch(
      sendMessage({
        session_id: sessionId,
        message: value,
        hcp_id: hcp?.id || null,
        hcp_name: hcp?.name || null,
        interaction_id: interactionId || null,
      })
    ).then((res) => {
      if (res.payload) {
        if (res.payload.tool_calls?.includes("log_interaction")) {
          const rawExt = res.payload.extracted || {};
          const extractedKeys = [];

          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");
          const defaultDateStr = `${year}-${month}-${day}`;

          const hours = String(today.getHours()).padStart(2, "0");
          const minutes = String(today.getMinutes()).padStart(2, "0");
          const defaultTimeStr = `${hours}:${minutes}`;

          const sanitizeDate = (val) =>
            val && /^\d{4}-\d{2}-\d{2}$/.test(String(val).trim()) ? String(val).trim() : null;
          const sanitizeTime = (val) =>
            val && /^\d{2}:\d{2}$/.test(String(val).trim()) ? String(val).trim() : null;

          const extractedForm = {
            hcp_name: rawExt.hcp_name || "",
            interaction_type: rawExt.interaction_type || "Visit",
            channel: rawExt.channel || "In-person",
            products_discussed: (rawExt.products_discussed || []).join(", "),
            topics: (rawExt.topics || []).join(", "),
            sentiment: rawExt.sentiment || "Neutral",
            key_discussion_points: rawExt.key_discussion_points || "",
            next_best_action: rawExt.next_best_action || "",
            date: sanitizeDate(rawExt.date) || defaultDateStr,
            time: sanitizeTime(rawExt.time) || defaultTimeStr,
            attendees: (rawExt.attendees || []).join(", "),
            materials_shared: (rawExt.materials_shared || []).join(", "),
            next_visit_date: sanitizeDate(rawExt.next_visit_date) || "",
          };

          if (rawExt.hcp_name) extractedKeys.push("hcp_name");
          if (rawExt.interaction_type) extractedKeys.push("interaction_type");
          if (rawExt.channel) extractedKeys.push("channel");
          if (rawExt.products_discussed && rawExt.products_discussed.length > 0) extractedKeys.push("products_discussed");
          if (rawExt.topics && rawExt.topics.length > 0) extractedKeys.push("topics");
          if (rawExt.sentiment) extractedKeys.push("sentiment");
          if (rawExt.key_discussion_points) extractedKeys.push("key_discussion_points");
          if (rawExt.next_best_action) extractedKeys.push("next_best_action");
          if (rawExt.date) extractedKeys.push("date");
          if (rawExt.time) extractedKeys.push("time");
          if (rawExt.attendees && rawExt.attendees.length > 0) extractedKeys.push("attendees");
          if (rawExt.materials_shared && rawExt.materials_shared.length > 0) extractedKeys.push("materials_shared");
          if (rawExt.next_visit_date) extractedKeys.push("next_visit_date");

          if (onExtract) {
            onExtract(extractedForm, extractedKeys);
          }
        }

        const item = res.payload.interaction;
        if (item && item.hcp_id && item.hcp_id !== "unknown-hcp" && onHcpExtracted) {
          onHcpExtracted(item.hcp_id);
        }
      }
    });
    setText("");
  };

  return (
    <div className="chat-card" ref={cardRef}>
      {/* Header */}
      <div className="chat-header">
        <div style={styles.chatHeaderTitle}>
          <span style={{ fontSize: 16 }}>🤖</span> LangGraph AI Agent
        </div>
        <div style={styles.aiStatusBadge}>
          <span style={styles.aiStatusDot} />
          AI Ready
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💡</div>
            <div style={styles.emptyTitle}>
              Tell me what happened with{" "}
              {hcp ? <strong>{hcp.name}</strong> : "the Healthcare Professional"}
            </div>
            <div style={styles.emptySub}>
              Describe your meeting in plain English. The AI agent will extract the
              interaction type, topics, products, sentiment, and schedule follow-ups.
            </div>
            <div style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button key={s} style={styles.suggestionChip} onClick={() => submit(s)}>
                  💬 "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubbleRow,
              justifyContent: m.role === "rep" ? "flex-end" : "flex-start",
            }}
          >
            <div className={m.role === "rep" ? "bubble-rep" : "bubble-agent"}>
              {m.text}
              {m.toolCalls?.length > 0 && (
                <div style={styles.toolTag}>
                  ⚡ {m.toolCalls.join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}

        {status === "loading" && (
          <div style={styles.bubbleRow}>
            <div className="bubble-agent" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Thinking & extracting…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          rows={1}
          className="chat-textarea"
          placeholder="Describe the interaction, or ask a question…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="chat-send-btn" onClick={() => submit()}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatHeaderTitle: {
    fontWeight: 700,
    fontSize: 14.5,
    color: "var(--color-ink)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  aiStatusBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-primary-dark)",
    background: "var(--color-primary-tint)",
    border: "1px solid var(--color-primary-border)",
    borderRadius: 20,
    padding: "4px 10px",
  },
  aiStatusDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--color-primary)",
    boxShadow: "0 0 0 2px rgba(13,148,136,.2)",
    animation: "pulse 2s infinite",
  },
  emptyState: {
    margin: "auto",
    textAlign: "center",
    maxWidth: 420,
    padding: "16px 0",
  },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyTitle: {
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 6,
    color: "var(--color-ink)",
    lineHeight: 1.4,
  },
  emptySub: {
    fontSize: 13,
    color: "var(--color-ink-muted)",
    marginBottom: 16,
    lineHeight: 1.45,
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  suggestionChip: {
    textAlign: "left",
    border: "1px solid var(--color-accent-border)",
    background: "var(--color-accent-tint)",
    color: "var(--color-accent-dark)",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    lineHeight: 1.4,
  },
  bubbleRow: {
    display: "flex",
    width: "100%",
  },
  toolTag: {
    marginTop: 6,
    fontSize: 11,
    color: "var(--color-accent)",
    fontWeight: 700,
    letterSpacing: 0.2,
  },
};

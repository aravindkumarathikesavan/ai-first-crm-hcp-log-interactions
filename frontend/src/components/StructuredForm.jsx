import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { submitStructuredInteraction, fetchInteractions, editInteraction, fetchAllDoctors } from "../store/interactionsSlice";

const getInitialFormState = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(today.getHours()).padStart(2, "0");
  const minutes = String(today.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${minutes}`;

  return {
    hcp_name: "",          // Always empty — only filled by AI extraction or user typing
    interaction_type: "Visit",
    channel: "In-person",
    products_discussed: "",
    topics: "",
    sentiment: "Neutral",
    key_discussion_points: "",
    next_best_action: "",
    date: dateStr,
    time: timeStr,
    attendees: "",
    materials_shared: "",
    next_visit_date: "",
  };
};

export default function StructuredForm({
  hcp,
  form,
  setForm,
  aiExtractedFields = [],
  setAiExtractedFields,
  editingId,
}) {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toISODateTime = (val) => {
    if (!val) return null;
    const trimmed = String(val).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    if (trimmed.includes("T")) return trimmed;
    return `${trimmed}T00:00:00`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hcp && !form.hcp_name) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editingId) {
        await dispatch(
          editInteraction({
            id: editingId,
            payload: {
              hcp_name: form.hcp_name || hcp?.name || "Unknown HCP",
              interaction_type: form.interaction_type,
              channel: form.channel,
              date: toISODateTime(form.date),
              interaction_time: form.time || null,
              products_discussed: form.products_discussed
                ? form.products_discussed.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
              topics: form.topics
                ? form.topics.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
              sentiment: form.sentiment,
              key_discussion_points: form.key_discussion_points,
              raw_notes: form.key_discussion_points,
              next_best_action: form.next_best_action,
              attendees: form.attendees
                ? form.attendees.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
              materials_shared: form.materials_shared
                ? form.materials_shared.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
              follow_up_date: toISODateTime(form.next_visit_date),
            }
          })
        ).unwrap();
      } else {
        await dispatch(
          submitStructuredInteraction({
            hcp_id: hcp?.id || "unknown-hcp",
            hcp_name: form.hcp_name || hcp?.name || "Unknown HCP",
            interaction_type: form.interaction_type,
            channel: form.channel,
            date: toISODateTime(form.date),
            interaction_time: form.time || null,
            products_discussed: form.products_discussed
              ? form.products_discussed.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            topics: form.topics
              ? form.topics.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            sentiment: form.sentiment,
            key_discussion_points: form.key_discussion_points,
            raw_notes: form.key_discussion_points,
            next_best_action: form.next_best_action,
            attendees: form.attendees
              ? form.attendees.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            materials_shared: form.materials_shared
              ? form.materials_shared.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            follow_up_date: toISODateTime(form.next_visit_date),
          })
        ).unwrap();
        setForm(getInitialFormState());
      }
      dispatch(fetchInteractions(null));
      dispatch(fetchAllDoctors());
      if (setAiExtractedFields) {
        setAiExtractedFields([]);
      }
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2500);
    } catch (err) {
      let msg = "Something went wrong. Please try again.";
      if (typeof err === "string") msg = err;
      else if (err?.detail) msg = err.detail;
      else if (err?.message) msg = err.message;
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getInputStyle = (isExtracted) => ({
    width: "100%",
    padding: "10px 12px",
    borderRadius: "var(--radius-sm)",
    border: isExtracted ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
    background: isExtracted ? "var(--color-accent-tint)" : "#FFFFFF",
    fontSize: "14px",
    color: "var(--color-ink)",
    transition: "border-color 0.2s, background-color 0.2s, box-shadow 0.2s",
  });

  return (
    <form onSubmit={handleSubmit} className="form-card">
      {aiExtractedFields.length > 0 && (
        <div style={styles.aiSummary}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--color-accent)" }}>AI Extraction Applied</span>
            <span style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
              Populated {aiExtractedFields.length} field{aiExtractedFields.length > 1 ? "s" : ""} from your conversation.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAiExtractedFields([])}
            style={styles.clearHighlightsBtn}
          >
            Clear Highlights
          </button>
        </div>
      )}

      <Field label="HCP Name / Dr. Name" isExtracted={aiExtractedFields.includes("hcp_name")}>
        <input
          style={getInputStyle(aiExtractedFields.includes("hcp_name"))}
          placeholder={hcp ? `Leave blank to use "${hcp.name}"` : "e.g. Dr. Ananya Rao"}
          value={form.hcp_name || ""}
          onChange={update("hcp_name")}
        />
        {hcp && !form.hcp_name && (
          <div style={styles.hcpHint}>
            ✓ Will link to selected HCP: <strong>{hcp.name}</strong>
          </div>
        )}
      </Field>

      <div className="form-grid-2col">
        <Field label="Interaction Type" isExtracted={aiExtractedFields.includes("interaction_type")}>
          <select style={getInputStyle(aiExtractedFields.includes("interaction_type"))} value={form.interaction_type} onChange={update("interaction_type")}>
            <option>Visit</option>
            <option>Call</option>
            <option>Email</option>
            <option>Conference</option>
          </select>
        </Field>
        <Field label="Channel" isExtracted={aiExtractedFields.includes("channel")}>
          <select style={getInputStyle(aiExtractedFields.includes("channel"))} value={form.channel} onChange={update("channel")}>
            <option>In-person</option>
            <option>Virtual</option>
          </select>
        </Field>
      </div>

      <div className="form-grid-2col">
        <Field label="Date" isExtracted={aiExtractedFields.includes("date")}>
          <input
            type="date"
            style={getInputStyle(aiExtractedFields.includes("date"))}
            value={form.date || ""}
            onChange={update("date")}
          />
        </Field>
        <Field label="Time" isExtracted={aiExtractedFields.includes("time")}>
          <input
            type="text"
            placeholder="e.g. 14:30"
            style={getInputStyle(aiExtractedFields.includes("time"))}
            value={form.time || ""}
            onChange={update("time")}
          />
        </Field>
      </div>

      <Field label="Attendees (Comma-separated)" isExtracted={aiExtractedFields.includes("attendees")}>
        <input
          style={getInputStyle(aiExtractedFields.includes("attendees"))}
          placeholder="e.g. Dr. Rao, Field Rep, Nurse Specialist"
          value={form.attendees || ""}
          onChange={update("attendees")}
        />
      </Field>

      <Field label="Products Discussed (Comma-separated)" isExtracted={aiExtractedFields.includes("products_discussed")}>
        <input
          style={getInputStyle(aiExtractedFields.includes("products_discussed"))}
          placeholder="CardioX, MetaboLine"
          value={form.products_discussed}
          onChange={update("products_discussed")}
        />
      </Field>

      <Field label="Topics (Comma-separated)" isExtracted={aiExtractedFields.includes("topics")}>
        <input
          style={getInputStyle(aiExtractedFields.includes("topics"))}
          placeholder="Efficacy data, dosing, side effects"
          value={form.topics}
          onChange={update("topics")}
        />
      </Field>

      <Field label="Materials Shared (Comma-separated)" isExtracted={aiExtractedFields.includes("materials_shared")}>
        <input
          style={getInputStyle(aiExtractedFields.includes("materials_shared"))}
          placeholder="e.g. Efficacy Study PDF, Brochure"
          value={form.materials_shared || ""}
          onChange={update("materials_shared")}
        />
      </Field>

      <Field label="Sentiment" isExtracted={aiExtractedFields.includes("sentiment")}>
        <select style={getInputStyle(aiExtractedFields.includes("sentiment"))} value={form.sentiment} onChange={update("sentiment")}>
          <option>Positive</option>
          <option>Neutral</option>
          <option>Negative</option>
        </select>
      </Field>

      <Field label="Key Discussion Points" isExtracted={aiExtractedFields.includes("key_discussion_points")}>
        <textarea
          style={{ ...getInputStyle(aiExtractedFields.includes("key_discussion_points")), minHeight: 90, resize: "vertical" }}
          placeholder="What was discussed, questions raised, objections..."
          value={form.key_discussion_points}
          onChange={update("key_discussion_points")}
        />
      </Field>

      <Field label="Follow-up Actions" isExtracted={aiExtractedFields.includes("next_best_action")}>
        <input
          style={getInputStyle(aiExtractedFields.includes("next_best_action"))}
          placeholder="Send updated efficacy study, schedule follow-up call in 2 weeks"
          value={form.next_best_action}
          onChange={update("next_best_action")}
        />
      </Field>

      <Field label="Next Visit Date" isExtracted={aiExtractedFields.includes("next_visit_date")}>
        <input
          type="date"
          style={getInputStyle(aiExtractedFields.includes("next_visit_date"))}
          value={form.next_visit_date || ""}
          onChange={update("next_visit_date")}
        />
      </Field>

      <button
        type="submit"
        disabled={submitting || (!hcp && !form.hcp_name)}
        className="form-submit-btn"
        style={{
          opacity: ((!hcp && !form.hcp_name) || submitting) ? 0.6 : 1,
          cursor: ((!hcp && !form.hcp_name) || submitting) ? "not-allowed" : "pointer"
        }}
      >
        {submitting ? "Saving…" : (editingId ? "Save Interaction" : "Log Interaction")}
      </button>

      {justSubmitted && (
        <div style={styles.success}>
          ✓ {editingId ? "Interaction updated successfully!" : "Interaction logged successfully!"}
        </div>
      )}
      {submitError && <div style={styles.errorMsg}>⚠ {submitError}</div>}
    </form>
  );
}

function Field({ label, children, isExtracted }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={styles.label}>
        {label}
        {isExtracted && (
          <span style={styles.aiBadge}>
            ✨ AI Extracted
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const styles = {
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--color-ink)",
    marginBottom: 6,
    flexWrap: "wrap",
    gap: 4,
  },
  aiBadge: {
    marginLeft: 6,
    fontSize: 10.5,
    background: "var(--color-accent-tint)",
    color: "var(--color-accent)",
    border: "1px solid var(--color-accent-border)",
    padding: "2px 7px",
    borderRadius: 4,
    fontWeight: 700,
    letterSpacing: 0.1,
  },
  aiSummary: {
    display: "flex",
    gap: 12,
    background: "var(--color-accent-tint)",
    border: "1px solid var(--color-accent-border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px 16px",
    marginBottom: 18,
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(79, 70, 229, 0.08)",
  },
  clearHighlightsBtn: {
    marginLeft: "auto",
    background: "#FFFFFF",
    border: "1px solid var(--color-accent-border)",
    color: "var(--color-accent)",
    fontSize: 11.5,
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  success: {
    marginTop: 12,
    color: "var(--color-positive-text)",
    background: "var(--color-positive-bg)",
    border: "1px solid var(--color-positive-border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
    fontSize: 13.5,
    fontWeight: 600,
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(16, 185, 129, 0.1)",
  },
  errorMsg: {
    marginTop: 12,
    color: "var(--color-negative-text)",
    fontSize: 13.5,
    fontWeight: 600,
    textAlign: "center",
    background: "var(--color-negative-bg)",
    border: "1px solid var(--color-negative-border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px 14px",
  },
  hcpHint: {
    marginTop: 6,
    fontSize: 12,
    color: "var(--color-primary-dark)",
    fontWeight: 500,
  },
};

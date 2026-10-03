import axios from "axios";

// In production, default to relative URL ("") so it works on any domain/Render deployment.
// In development, default to "http://localhost:8000".
const API_BASE =
  process.env.REACT_APP_API_BASE !== undefined
    ? process.env.REACT_APP_API_BASE
    : process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Clear any previously stored custom key — API key is now permanent in the backend.
localStorage.removeItem("groq_api_key");

export const createInteraction = (payload) => api.post("/api/interactions", payload);
export const listInteractions = (hcpId) =>
  api.get("/api/interactions", { params: hcpId ? { hcp_id: hcpId } : {} });
export const updateInteraction = (id, payload) => api.patch(`/api/interactions/${id}`, payload);
export const deleteInteraction = (id) => api.delete(`/api/interactions/${id}`);
export const sendChatMessage = (payload) => api.post("/api/chat", payload);

// Copied memory backend client
const API_BASE = import.meta.env.VITE_MEMORY_API || 'http://localhost:3001';
export interface ChatMessageRequest { sessionId?: string; message: string; meta?: Record<string, unknown>; }
export interface ChatMessageResponse { sessionId: string; reply: string; traces?: Array<unknown>; }
export async function sendChat(message: string, sessionId?: string): Promise<ChatMessageResponse> { const res = await fetch(`${API_BASE}/api/chat/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, sessionId }) }); if (!res.ok) {throw new Error(`Chat failed: ${res.status}`);} return res.json(); }
export interface MemorySummary { sessions: number; characters: number; facts: number; lastEventAt?: string; }
export async function getMemorySummary(): Promise<MemorySummary> { const res = await fetch(`${API_BASE}/api/memory/summary`); if (!res.ok) {throw new Error('Summary failed');} return res.json(); }
export interface NarrativeEventInput { type: string; payload: Record<string, unknown>; sessionId?: string; timestamp?: string; }
export async function postNarrativeEvent(evt: NarrativeEventInput): Promise<void> { const res = await fetch(`${API_BASE}/api/events/narrative`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evt) }); if (!res.ok) {throw new Error('Event post failed');} }

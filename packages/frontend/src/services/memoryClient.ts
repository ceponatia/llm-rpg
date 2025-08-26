// Memory backend client with feature‑flagged chat
import { isEnabled } from '../utils/flags';

const API_BASE = import.meta.env.VITE_MEMORY_API ?? 'http://localhost:3001';
const chatEnabled = isEnabled('FRONTEND_CHAT_ENABLED');

export interface ChatMessageRequest { sessionId?: string; message: string; meta?: Record<string, unknown>; }
// Backend now returns extended object with compatibility fields. Accept superset.
export interface ChatMessageResponse {
	sessionId: string; // camelCase convenience
	session_id?: string; // original backend field
	reply: string; // assistant content alias
	content?: string; // original backend field
	id?: string;
	metadata?: any; // TODO strong type
	traces?: Array<unknown>;
}

export async function sendChat(message: string, sessionId?: string): Promise<ChatMessageResponse> {
	if (!chatEnabled) {
		throw new Error('Chat API not enabled');
	}
	const payload: { message: string; sessionId?: string } = { message };
	if (sessionId) payload.sessionId = sessionId;
	const res = await fetch(`${API_BASE}/api/chat/message`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (res.status === 404 || res.status === 501) {
		throw new Error('Chat API route not available on backend');
	}
	if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
	const raw = await res.json() as ChatMessageResponse;
	// Normalize if backend only returned session_id/content
	if (!raw.sessionId && (raw as any).session_id) {
		(raw as any).sessionId = (raw as any).session_id;
	}
	if (!raw.reply && (raw as any).content) {
		(raw as any).reply = (raw as any).content as string;
	}
	return raw;
}

export interface MemorySummary { sessions: number; characters: number; facts: number; lastEventAt?: string; }
export async function getMemorySummary(): Promise<MemorySummary> {
	const res = await fetch(`${API_BASE}/api/memory/summary`);
	if (!res.ok) { throw new Error('Summary failed'); }
	return await res.json() as MemorySummary;
}

export interface NarrativeEventInput { type: string; payload: Record<string, unknown>; sessionId?: string; timestamp?: string; }
export async function postNarrativeEvent(evt: NarrativeEventInput): Promise<void> {
	const res = await fetch(`${API_BASE}/api/events/narrative`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(evt)
	});
	if (!res.ok) { throw new Error('Event post failed'); }
}

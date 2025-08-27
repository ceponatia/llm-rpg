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
	metadata?: unknown; // TODO strong type
	traces?: unknown[];
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
	const rawUnknown = await res.json() as unknown;
	// Perform runtime shape checks then normalize in a copy to avoid unsafe any
	if (rawUnknown !== null && typeof rawUnknown === 'object') {
		const base = rawUnknown as Partial<ChatMessageResponse> & Record<string, unknown>;
		if ((base.sessionId == null || base.sessionId === '') && typeof base.session_id === 'string') {
			base.sessionId = base.session_id;
		}
		if ((base.reply == null || base.reply === '') && typeof base.content === 'string') {
			base.reply = base.content;
		}
		// After normalization assert required fields
		if (typeof base.sessionId === 'string' && typeof base.reply === 'string') {
			return base as ChatMessageResponse;
		}
	}
	throw new Error('Malformed chat response');
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

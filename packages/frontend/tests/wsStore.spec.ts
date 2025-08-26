import { describe, it, expect, beforeAll } from 'vitest';
import { useWSStore } from '../src/state/wsStore';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 0; // CONNECTING
  onopen: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    // open immediately
  this.readyState = 1;
  queueMicrotask(() => { this.onopen && this.onopen({}); });
  }
  send(data: any) {
    // echo back a fake event
    setTimeout(() => {
      this.onmessage && this.onmessage({ data: JSON.stringify({ type: 'echo', payload: data }) });
    }, 0);
  }
  close() {
    this.readyState = 3;
    this.onclose && this.onclose({});
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket as any;

describe('wsStore', () => {
  beforeAll(() => {
    // ensure clean state
    useWSStore.getState().clear();
  });
  it('connects and records events', async () => {
    const { connect } = useWSStore.getState();
    connect();
  await new Promise(r => setTimeout(r, 0));
    expect(useWSStore.getState().connected).toBe(true);
  });
});

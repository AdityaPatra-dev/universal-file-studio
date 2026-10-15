import { WebSocketEventPacket } from '../types/api';

type EventCallback = (packet: WebSocketEventPacket) => void;
type StatusCallback = (status: 'connected' | 'disconnected' | 'connecting') => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private shouldReconnect = true;

  constructor() {
    const isDev = import.meta.env.DEV;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = isDev ? 'localhost:8000' : window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const packet: WebSocketEventPacket = JSON.parse(event.data);
          this.handleIncoming(packet);
        } catch {
          // Plain text message
          if (event.data === 'pong') {
            this.handleIncoming({ event: 'pong' });
          }
        }
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.stopHeartbeat();
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[UFS-WS] Connection error:', err);
      };
    } catch (e) {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  public getStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.status;
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public onAny(callback: EventCallback): () => void {
    return this.on('*', callback);
  }

  public send(action: string, data: Record<string, any> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...data }));
    }
  }

  public sendPing() {
    this.send('ping', { timestamp: Date.now() });
  }

  private setStatus(status: 'connected' | 'disconnected' | 'connecting') {
    this.status = status;
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error(err);
      }
    });
  }

  private handleIncoming(packet: WebSocketEventPacket) {
    // Notify specific event listeners
    const specific = this.listeners.get(packet.event);
    if (specific) {
      specific.forEach((cb) => cb(packet));
    }

    // Notify wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => cb(packet));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}

export const socketService = new WebSocketService();

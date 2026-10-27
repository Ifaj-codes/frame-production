import { WebSocketServer, WebSocket } from "ws";
import http from "http";

let wss: WebSocketServer | null = null;
const clients = new Map<string, WebSocket>();

export function initWebSocketServer(server: http.Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId") || "anonymous_" + Math.random().toString(36).substring(7);
    
    clients.set(userId, ws);
    console.log(`[WebSocket] Client connected: ${userId} (Total: ${clients.size})`);

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`[WebSocket] Client disconnected: ${userId} (Remaining: ${clients.size})`);
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
        }
      } catch (e) {
        // ignore non-json
      }
    });

    // Send initial handshake
    ws.send(JSON.stringify({ type: "CONNECTED", message: "Connected to Frame Production WebSocket Gateway" }));
  });

  return wss;
}

export function broadcast(event: string, payload: any, targetUserId?: string) {
  const message = JSON.stringify({ type: event, payload, timestamp: Date.now() });

  if (targetUserId && clients.has(targetUserId)) {
    const ws = clients.get(targetUserId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
    return;
  }

  // Broadcast to all active clients
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

import { WebSocketServer, WebSocket } from 'ws';

interface ProgressMessage {
  type: 'generation_started' | 'generation_progress' | 'generation_completed' | 'generation_error';
  message: string;
  progress: number;
  timestamp?: string;
}

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function setupWebSocket(webSocketServer: WebSocketServer) {
  wss = webSocketServer;

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 WebSocket client connected');
    clients.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to Retro AI Paint server',
      timestamp: new Date().toISOString(),
    }));

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Handle ping/pong for connection health
    ws.on('ping', () => {
      ws.pong();
    });
  });

  // Cleanup disconnected clients periodically
  setInterval(() => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.CLOSED) {
        clients.delete(client);
      }
    });
  }, 30000); // Every 30 seconds
}

export function broadcastProgress(message: ProgressMessage) {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  const messageWithTimestamp = {
    ...message,
    timestamp: new Date().toISOString(),
  };

  const messageString = JSON.stringify(messageWithTimestamp);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageString);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        clients.delete(client);
      }
    }
  });

  console.log(`📡 Broadcasted progress: ${message.type} - ${message.message} (${message.progress}%)`);
}

export function getConnectedClientsCount(): number {
  return clients.size;
}
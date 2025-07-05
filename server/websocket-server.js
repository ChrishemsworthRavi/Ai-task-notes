const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// Ping-pong health check interval (every 30 seconds)
const interval = setInterval(() => {
  wss.clients.forEach(client => {
    if (client.isAlive === false) {
      console.log('Terminating dead connection');
      return client.terminate();
    }

    client.isAlive = false;
    client.ping();  // Ping the client
  });
}, 30000);

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Mark the client alive on connection
  ws.isAlive = true;

  // Listen for pong responses (client is alive)
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Listen for messages
  ws.on('message', async (message) => {
    try {
      let textData;

      // Handle Blob / Buffer
      if (message instanceof Buffer || message instanceof ArrayBuffer) {
        textData = message.toString();
      } else if (message instanceof Blob) {
        textData = await message.text();
      } else {
        textData = message.toString();
      }

      const parsed = JSON.parse(textData);
      console.log('Parsed message:', parsed);

      // Broadcast to all other clients
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(parsed));
        }
      });
    } catch (err) {
      console.error('Failed to parse message', err);
      ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Cleanup interval on server close
wss.on('close', () => {
  clearInterval(interval);
});

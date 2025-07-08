// server.js
const next = require('next');
const http = require('http');
const WebSocket = require('ws');
const { parse } = require('url');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocket.Server({ server });

  console.log(`WebSocket server running on ws://localhost:${PORT}`);

  const interval = setInterval(() => {
    wss.clients.forEach(client => {
      if (client.isAlive === false) {
        console.log('Terminating dead connection');
        return client.terminate();
      }

      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        let textData;

        if (message instanceof Buffer || message instanceof ArrayBuffer) {
          textData = message.toString();
        } else if (message instanceof Blob) {
          textData = await message.text();
        } else {
          textData = message.toString();
        }

        const parsed = JSON.parse(textData);
        console.log('Parsed message:', parsed);

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

  wss.on('close', () => {
    clearInterval(interval);
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

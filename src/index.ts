import { unpack, pack } from 'msgpackr';
import crypto from "crypto";
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/msgpack', (c) => {
  console.log("msgpackRequest");
  const samplePack = {hello: 'msg'}
  return c.body(pack(samplePack))
});

app.get('/room/create', (c) => {
  console.log("msgpackRequest");
  const samplePack = {hello: 'msg'}
  return c.body(pack(samplePack))
});

app.get('/room/join', (c) => {
  console.log("msgpackRequest");
  const samplePack = {hello: 'msg'}
  return c.body(pack(samplePack))
});

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const parsedObj = JSON.parse(event.data);
        if (parsedObj.action === 'connect') {
          const userId = parsedObj.data.userId || crypto.randomUUID();
          const connectUserMessageObj = {
            action: "connected",
            data: {
              userId: userId,
            }
          }
          ws.send(JSON.stringify(connectUserMessageObj))
        }
      },
      onClose: (event, ws) => {
        console.log('Connection closed');
        ws.close();
      },
    }
  })
)

export default app

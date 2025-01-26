import { unpack, pack } from 'msgpackr';
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
        console.log(parsedObj)
        if (parsedObj.action === 'connect') {
          console.log('sendConnectMessage')
          const connectUserMessageObj = {
            action: "connected",
            data: {
              userId: "hogehoge",
            }
          }
          ws.send(JSON.stringify(connectUserMessageObj))
        }
      },
      onClose: () => {
        console.log('Connection closed')
      },
    }
  })
)

export default app

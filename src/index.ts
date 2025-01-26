import { unpack, pack } from 'msgpackr';
import crypto from 'crypto';
import _ from 'lodash';
import { Hono } from 'hono';
import { WSContext } from 'hono/ws';
import { upgradeWebSocket } from 'hono/cloudflare-workers';

const connections: WSContext<WebSocket>[] = [];
const userIds: string[] = [];
const roomIdUserIds: { [s: string]: string[] } = {};

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/msgpack', (c) => {
  console.log('msgpackRequest');
  const samplePack = { hello: 'msg' };
  return c.body(pack(samplePack));
});

app.get('/room/create', (c) => {
  console.log('msgpackRequest');
  const samplePack = { hello: 'msg' };
  return c.body(pack(samplePack));
});

app.get('/room/join', (c) => {
  console.log('msgpackRequest');
  const samplePack = { hello: 'msg' };
  return c.body(pack(samplePack));
});

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const parsedObj = JSON.parse(event.data);
        if (parsedObj.action === 'connect') {
          const userId: string = parsedObj.data.userId || crypto.randomUUID();
          userIds.push(userId);
          connections.push(ws);
          const connectUserMessageObj = {
            action: 'connected',
            data: {
              userId: userId,
            },
          };
          ws.send(JSON.stringify(connectUserMessageObj));
        } else if (parsedObj.action === 'joinRoom') {
          const userId: string = parsedObj.data.userId;
          const roomId: string = parsedObj.data.roomId;
          const roomUsers = roomIdUserIds[roomId] || [];
          roomUsers.push(userId);
          if (roomUsers.length >= 4) {
            const connectedWs = [];
            const startGameMessageObjs = [];
            const willRemoveUserIds: string[] = [];
            for (let i = 0; i < roomUsers.length; ++i) {
              const userId = roomUsers[i];
              const uidIndex = userIds.findIndex((uid) => uid === userId);
              if (uidIndex < 0) {
                willRemoveUserIds.push(userId);
                break;
              }
              const startGameMessageObj = {
                action: 'startGame',
                data: {
                  roomId: roomId,
                  userId: userId,
                  roomUserIds: roomUsers,
                  playerNumber: uidIndex + 1,
                },
              };
              connectedWs.push(connections[uidIndex]);
              startGameMessageObjs.push(startGameMessageObj);
            }

            if (willRemoveUserIds.length > 0) {
              _.remove(roomUsers, (roomUserId) => {
                return willRemoveUserIds.includes(roomUserId);
              });
            } else {
              for (let i = 0; i < connectedWs.length; ++i) {
                connectedWs[i].send(JSON.stringify(startGameMessageObjs[i]));
              }
            }
            roomIdUserIds[roomId] = roomUsers;
          }
        } else if (parsedObj.action === 'createRoom') {
          const userId: string = parsedObj.data.userId;
          const roomId: string = crypto.randomUUID();
          roomIdUserIds[roomId] = [userId];
          const createdRoomMessageObj = {
            action: 'createdRoom',
            data: {
              userId: userId,
              roomId: roomId,
            },
          };
          ws.send(JSON.stringify(createdRoomMessageObj));
        }
      },
      onClose: (event, ws) => {
        _.remove(connections, (connection, index) => {
          const isSame = connection === ws;
          if (isSame) {
            userIds.splice(index, 1);
          }
          return isSame;
        });
      },
    };
  }),
);

export default app;

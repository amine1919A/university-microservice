import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ChatMessage

class LiveConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.group = f"live_{self.session_id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        if msg_type == "chat_message":
            await self.handle_chat(data)
        elif msg_type in ("webrtc_offer", "webrtc_answer", "webrtc_ice", "media_state"):
            await self.channel_layer.group_send(self.group, {
                "type": "webrtc_signal",
                "signal_type": msg_type,
                "payload": data.get("payload"),
                "sender": data.get("sender"),
            })
        else:
            await self.channel_layer.group_send(self.group, {
                "type": "live_event",
                **data,
            })

    async def handle_chat(self, data):
        message_text = data.get("message", "").strip()
        if not message_text:
            return
        user_id = data.get("user_id", 0)
        user_name = data.get("user_name", "Inconnu")
        try:
            msg = await self.sync_to_async(ChatMessage.objects.create)(
                session_id=self.session_id,
                user_id=user_id,
                user_name=user_name,
                message=message_text,
            )
        except:
            return
        await self.channel_layer.group_send(self.group, {
            "type": "chat_broadcast",
            "id": msg.id,
            "user_id": user_id,
            "user_name": user_name,
            "message": message_text,
            "created_at": str(msg.created_at),
        })

    async def chat_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "id": event["id"],
            "user_id": event["user_id"],
            "user_name": event["user_name"],
            "message": event["message"],
            "created_at": event["created_at"],
        }))

    async def webrtc_signal(self, event):
        await self.send(text_data=json.dumps({
            "type": event["signal_type"],
            "payload": event["payload"],
            "sender": event["sender"],
        }))

    async def live_event(self, event):
        await self.send(text_data=json.dumps(event))

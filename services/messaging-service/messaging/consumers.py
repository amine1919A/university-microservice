import json
import requests
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conv_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group = f"chat_{self.conv_id}"
        user = await self.get_user()
        if not user:
            await self.close()
            return
        self.user = user
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get("content","")
        if not content:
            return
        from .models import Message, Conversation
        conv = await sync_to_async(Conversation.objects.get)(id=self.conv_id)
        msg = await sync_to_async(Message.objects.create)(
            conversation=conv, sender_id=self.user["id"],
            sender_name=f"{self.user.get('first_name','')} {self.user.get('last_name','')}".strip(),
            content=content,
        )
        await self.channel_layer.group_send(self.group, {
            "type": "chat_message",
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": msg.sender_name,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def get_user(self):
        headers = dict(self.scope.get("headers",{}))
        auth = headers.get(b"authorization",b"").decode()
        parts = auth.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        try:
            r = await sync_to_async(requests.get)(
                f"{settings.AUTH_SERVICE_URL}/api/auth/me/",
                headers={"Authorization": f"Bearer {parts[1]}"},
                timeout=5,
            )
            if r.status_code == 200:
                return r.json()
        except:
            pass
        return None

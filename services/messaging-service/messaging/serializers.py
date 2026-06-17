from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "conversation", "sender_id", "sender_name", "content", "is_read", "created_at"]
        read_only_fields = ["id", "sender_id", "sender_name", "is_read", "created_at"]

class ConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = ["id", "participants", "subject", "last_message", "unread_count", "created_at", "updated_at"]
    def get_last_message(self, obj):
        msg = obj.messages.last()
        return MessageSerializer(msg).data if msg else None
    def get_unread_count(self, obj):
        user_id = self.context.get("user_id")
        if user_id:
            return obj.messages.filter(is_read=False).exclude(sender_id=user_id).count()
        return 0

class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ["id", "participants", "subject", "messages", "created_at", "updated_at"]

class SendMessageSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField(required=False)
    recipient_id = serializers.IntegerField(required=False)
    subject = serializers.CharField(required=False, allow_blank=True, max_length=255)
    content = serializers.CharField()

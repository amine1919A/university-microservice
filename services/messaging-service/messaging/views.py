import requests
from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer, ConversationDetailSerializer,
    MessageSerializer, SendMessageSerializer,
)

def get_user_from_token(request):
    auth = request.headers.get("Authorization","").split()
    if not auth or auth[0].lower() != "bearer":
        return None
    try:
        r = requests.get(f"{settings.AUTH_SERVICE_URL}/api/auth/me/", headers={"Authorization": f"Bearer {auth[1]}"}, timeout=5)
        if r.status_code == 200:
            return r.json()
    except:
        pass
    return None

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationListSerializer
    def list(self, request, *a, **kw):
        user = get_user_from_token(request)
        if not user:
            return Response({"detail":"Non authentifié"}, status=401)
        qs = Conversation.objects.filter(participants__contains=user["id"])
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = ConversationListSerializer(page, many=True, context={"user_id":user["id"]})
            return self.get_paginated_response(ser.data)
        ser = ConversationListSerializer(qs, many=True, context={"user_id":user["id"]})
        return Response(ser.data)

class ConversationDetailView(generics.RetrieveAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationDetailSerializer

@api_view(["POST"])
def send_message(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    if user.get("role") == "admin":
        return Response({"detail":"Les administrateurs ne peuvent pas envoyer de messages"}, status=403)
    ser = SendMessageSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)
    vd = ser.validated_data
    conv = None
    if vd.get("conversation_id"):
        conv = Conversation.objects.filter(id=vd["conversation_id"]).first()
        if not conv:
            return Response({"detail":"Conversation introuvable"}, status=404)
    elif vd.get("recipient_id"):
        conv = Conversation.objects.filter(
            participants__contains=user["id"]
        ).filter(participants__contains=vd["recipient_id"]).first()
        if not conv:
            conv = Conversation.objects.create(
                participants=[user["id"], vd["recipient_id"]],
                subject=vd.get("subject",""),
            )
    else:
        return Response({"detail":"conversation_id ou recipient_id requis"}, status=400)
    msg = Message.objects.create(
        conversation=conv, sender_id=user["id"],
        sender_name=f"{user.get('first_name','')} {user.get('last_name','')}".strip() or user.get("username",""),
        content=vd["content"],
    )
    return Response(MessageSerializer(msg).data, status=201)

@api_view(["POST"])
def mark_read(request, pk):
    user = get_user_from_token(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    try:
        conv = Conversation.objects.get(id=pk)
    except Conversation.DoesNotExist:
        return Response({"detail":"Conversation introuvable"}, status=404)
    conv.messages.filter(is_read=False).exclude(sender_id=user["id"]).update(is_read=True)
    return Response({"status":"ok"})

@api_view(["GET"])
def unread_count(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    convs = Conversation.objects.filter(participants__contains=user["id"])
    total = 0
    for c in convs:
        total += c.messages.filter(is_read=False).exclude(sender_id=user["id"]).count()
    return Response({"unread_count": total})


def _fetch_json(url, timeout=5):
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code != 200:
            return None
        data = r.json()
        if isinstance(data, dict) and "results" in data:
            return data["results"]
        if isinstance(data, list):
            return data
        return [data] if data else []
    except:
        return None

@api_view(["GET"])
def contacts_list(request):
    user = get_user_from_token(request)
    if not user:
        return Response({"detail":"Non authentifié"}, status=401)
    role = user.get("role")
    contacts = []
    seen_ids = set()

    if role == "student":
        enrollments = _fetch_json(f"http://class-service:8000/api/classes/enrollments/?student_id={user['id']}")
        class_ids = list({e.get("classe") for e in (enrollments or []) if e.get("classe")})
        if class_ids:
            for cid in class_ids:
                classes_data = _fetch_json(f"http://class-service:8000/api/classes/{cid}/")
                class_name = classes_data.get("name") if isinstance(classes_data, dict) else ""
                class_enrollments = _fetch_json(f"http://class-service:8000/api/classes/enrollments/?classe_id={cid}")
                for e in (class_enrollments or []):
                    sid = e.get("student_external_id")
                    if sid and sid != user["id"] and sid not in seen_ids:
                        seen_ids.add(sid)
                        sname = e.get("student_name", "")
                        contacts.append({"id": sid, "first_name": sname.split(" ")[0] if " " in sname else sname, "last_name": sname.split(" ", 1)[1] if " " in sname else "", "tag": class_name, "tag_type": "class", "role": "student"})
            assignments = _fetch_json(f"http://subject-service:8000/api/subjects/assignments/")
            for a in (assignments or []):
                if a.get("class_external_id") in class_ids:
                    tid = a.get("teacher_external_id")
                    if tid and tid != user["id"] and tid not in seen_ids:
                        seen_ids.add(tid)
                        tname = a.get("teacher_name", "")
                        subj_name = ""
                        subj_data = _fetch_json(f"http://subject-service:8000/api/subjects/{a.get('subject')}/")
                        if isinstance(subj_data, dict):
                            subj_name = subj_data.get("name", "")
                        contacts.append({"id": tid, "first_name": tname.split(" ")[0] if " " in tname else tname, "last_name": tname.split(" ", 1)[1] if " " in tname else "", "tag": subj_name, "tag_type": "subject", "role": "teacher"})

    elif role == "teacher":
        assignments = _fetch_json(f"http://subject-service:8000/api/subjects/assignments/")
        my_assignments = [a for a in (assignments or []) if a.get("teacher_external_id") == user["id"]]
        class_ids = list({a.get("class_external_id") for a in my_assignments if a.get("class_external_id")})
        for cid in class_ids:
            classes_data = _fetch_json(f"http://class-service:8000/api/classes/{cid}/")
            class_name = classes_data.get("name") if isinstance(classes_data, dict) else ""
            class_enrollments = _fetch_json(f"http://class-service:8000/api/classes/enrollments/?classe_id={cid}")
            for e in (class_enrollments or []):
                sid = e.get("student_external_id")
                if sid and sid not in seen_ids:
                    seen_ids.add(sid)
                    sname = e.get("student_name", "")
                    contacts.append({"id": sid, "first_name": sname.split(" ")[0] if " " in sname else sname, "last_name": sname.split(" ", 1)[1] if " " in sname else "", "tag": class_name, "tag_type": "class", "role": "student"})

    return Response(contacts)

from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.conf import settings
from .models import Student, Teacher, TeacherSpecialty
from .serializers import StudentSerializer, TeacherSerializer, TeacherSpecialtySerializer


class StudentListCreateView(generics.ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "email"]
    ordering_fields = ["last_name", "enrollment_date"]

    def get_queryset(self):
        sync_students_from_auth()
        return super().get_queryset()


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class TeacherListCreateView(generics.ListCreateAPIView):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "email", "specialization"]
    ordering_fields = ["last_name", "hire_date"]

    def get_queryset(self):
        sync_teachers_from_auth()
        return super().get_queryset()

    def perform_create(self, serializer):
        super().perform_create(serializer)
        if serializer.instance.specialization:
            ensure_subject_for_specialization(serializer.instance.specialization)


class TeacherDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    def perform_update(self, serializer):
        old = Teacher.objects.get(id=self.kwargs["pk"])
        super().perform_update(serializer)
        new_spec = serializer.instance.specialization
        if new_spec and new_spec != old.specialization:
            ensure_subject_for_specialization(new_spec)
            remove_orphan_subjects()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        remove_orphan_subjects()


class TeacherSpecialtyListCreateView(generics.ListCreateAPIView):
    queryset = TeacherSpecialty.objects.all()
    serializer_class = TeacherSpecialtySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["specialty"]

    def get_queryset(self):
        qs = super().get_queryset()
        teacher_id = self.request.query_params.get("teacher_id")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs


class TeacherSpecialtyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TeacherSpecialty.objects.all()
    serializer_class = TeacherSpecialtySerializer


def sync_students_from_auth():
    """Fetch students from auth-service and create missing Student records."""
    try:
        import requests as http_requests
        url = f"{settings.AUTH_SERVICE_URL}/api/auth/users/?role=student"
        while url:
            resp = http_requests.get(url, timeout=10)
            if resp.status_code != 200:
                break
            data = resp.json()
            if isinstance(data, list):
                users = data
                url = None
            elif isinstance(data, dict) and "results" in data:
                users = data["results"]
                url = data.get("next")
            else:
                break
            for u in users:
                Student.objects.get_or_create(
                    external_id=u["id"],
                    defaults={
                        "first_name": u.get("first_name", ""),
                        "last_name": u.get("last_name", ""),
                        "email": u.get("email", ""),
                        "is_active": u.get("is_active", True),
                    }
                )
    except Exception:
        pass

def ensure_subject_for_specialization(specialization):
    """Create a subject in subject-service if it doesn't exist."""
    import requests as http_requests
    if not specialization:
        return
    try:
        sub_resp = http_requests.get("http://subject-service:8000/api/subjects/", timeout=5)
        if sub_resp.status_code != 200:
            return
        existing = sub_resp.json()
        if isinstance(existing, dict) and "results" in existing:
            existing = existing["results"]
        for s in existing:
            if s.get("name", "").lower() == specialization.lower():
                return
        http_requests.post(
            "http://subject-service:8000/api/subjects/",
            json={
                "name": specialization,
                "code": specialization[:20].upper().replace(" ", "_"),
                "coefficient": 1,
            },
            timeout=5,
        )
    except:
        pass

def remove_orphan_subjects():
    """Delete subjects that have no teacher with matching specialization."""
    import requests as http_requests
    try:
        sub_resp = http_requests.get("http://subject-service:8000/api/subjects/", timeout=5)
        if sub_resp.status_code != 200:
            return
        existing = sub_resp.json()
        if isinstance(existing, dict) and "results" in existing:
            existing = existing["results"]
        teacher_specs = set(Teacher.objects.filter(is_active=True).exclude(specialization="").values_list("specialization", flat=True))
        for s in existing:
            if s.get("name", "").lower() not in {t.lower() for t in teacher_specs}:
                try:
                    http_requests.delete(f"http://subject-service:8000/api/subjects/{s['id']}/", timeout=5)
                except:
                    pass
    except:
        pass

def sync_teachers_from_auth():
    """Fetch teachers from auth-service and create missing Teacher records."""
    try:
        import requests as http_requests
        url = f"{settings.AUTH_SERVICE_URL}/api/auth/users/?role=teacher"
        while url:
            resp = http_requests.get(url, timeout=10)
            if resp.status_code != 200:
                break
            data = resp.json()
            if isinstance(data, list):
                users = data
                url = None
            elif isinstance(data, dict) and "results" in data:
                users = data["results"]
                url = data.get("next")
            else:
                break
            for u in users:
                teacher, created = Teacher.objects.get_or_create(
                    external_id=u["id"],
                    defaults={
                        "first_name": u.get("first_name", ""),
                        "last_name": u.get("last_name", ""),
                        "email": u.get("email", ""),
                        "specialization": "",
                        "is_active": u.get("is_active", True),
                    }
                )
                if created and teacher.specialization:
                    ensure_subject_for_specialization(teacher.specialization)
        remove_orphan_subjects()
    except Exception:
        pass

@api_view(["GET"])
def unassigned_students(request):
    """Return students not enrolled in any class."""
    sync_students_from_auth()
    enrolled_ids = set()
    try:
        import requests as http_requests
        url = "http://class-service:8000/api/classes/enrollments/"
        while url:
            resp = http_requests.get(url, timeout=5)
            if resp.status_code != 200:
                break
            data = resp.json()
            if isinstance(data, list):
                enrolled_ids.update(e["student_external_id"] for e in data)
                url = None
            elif isinstance(data, dict) and "results" in data:
                enrolled_ids.update(e["student_external_id"] for e in data["results"])
                url = data.get("next")
            else:
                break
    except Exception:
        pass

    students = Student.objects.filter(is_active=True).exclude(external_id__in=enrolled_ids)
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)

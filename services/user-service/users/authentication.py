import requests
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings


class ServiceAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ")[1]
        try:
            response = requests.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/me/",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5,
            )
            if response.status_code != 200:
                raise AuthenticationFailed("Token invalide ou expiré.")

            user_data = response.json()
            return (UserFromService(user_data), token)
        except requests.RequestException:
            raise AuthenticationFailed("Service d'authentification indisponible.")


class UserFromService:
    def __init__(self, data):
        self.id = data.get("id")
        self.email = data.get("email")
        self.username = data.get("username")
        self.first_name = data.get("first_name", "")
        self.last_name = data.get("last_name", "")
        self.role = data.get("role")
        self.is_active = data.get("is_active", True)

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return self.email

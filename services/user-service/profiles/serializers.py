from rest_framework import serializers
from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "street", "city", "zip_code", "country",
            "is_primary", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

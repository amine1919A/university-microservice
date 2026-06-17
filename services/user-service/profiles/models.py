from django.db import models


class Address(models.Model):
    student = models.ForeignKey(
        "users.Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="addresses",
    )
    teacher = models.ForeignKey(
        "users.Teacher",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="addresses",
    )
    street = models.CharField(max_length=255, verbose_name="Rue")
    city = models.CharField(max_length=100, verbose_name="Ville")
    zip_code = models.CharField(max_length=20, verbose_name="Code postal")
    country = models.CharField(max_length=100, default="Maroc", verbose_name="Pays")
    is_primary = models.BooleanField(default=False, verbose_name="Adresse principale")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Adresse"
        verbose_name_plural = "Adresses"

    def __str__(self):
        return f"{self.street}, {self.city}"

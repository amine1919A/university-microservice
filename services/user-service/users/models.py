from django.db import models


class Student(models.Model):
    external_id = models.IntegerField(unique=True, verbose_name="ID auth service")
    first_name = models.CharField(max_length=150, verbose_name="Prénom")
    last_name = models.CharField(max_length=150, verbose_name="Nom")
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    enrollment_date = models.DateField(auto_now_add=True, verbose_name="Date d'inscription")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Étudiant"
        verbose_name_plural = "Étudiants"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Teacher(models.Model):
    external_id = models.IntegerField(unique=True, verbose_name="ID auth service")
    first_name = models.CharField(max_length=150, verbose_name="Prénom")
    last_name = models.CharField(max_length=150, verbose_name="Nom")
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    specialization = models.CharField(max_length=255, blank=True, verbose_name="Spécialisation")
    hire_date = models.DateField(auto_now_add=True, verbose_name="Date d'embauche")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Enseignant"
        verbose_name_plural = "Enseignants"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class TeacherSpecialty(models.Model):
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE, related_name="specialties",
        verbose_name="Enseignant"
    )
    specialty = models.CharField(max_length=255, verbose_name="Spécialité")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Spécialité enseignant"
        verbose_name_plural = "Spécialités enseignants"
        unique_together = ["teacher", "specialty"]

    def __str__(self):
        return f"{self.teacher} - {self.specialty}"

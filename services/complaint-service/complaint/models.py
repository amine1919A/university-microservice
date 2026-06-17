from django.db import models


class Complaint(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("reviewed", "Examiné"),
        ("resolved", "Résolu"),
        ("rejected", "Rejeté"),
    ]

    GRADE_TYPE_CHOICES = [
        ("cc", "Contrôle continu"),
        ("ds", "Devoir surveillé"),
        ("examen", "Examen"),
    ]

    student_external_id = models.IntegerField(verbose_name="ID étudiant")
    student_name = models.CharField(max_length=300, verbose_name="Nom étudiant")
    subject_external_id = models.IntegerField(verbose_name="ID matière")
    subject_name = models.CharField(max_length=200, verbose_name="Matière")
    grade_type = models.CharField(
        max_length=10, choices=GRADE_TYPE_CHOICES, verbose_name="Type de note"
    )
    grade_value = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Note concernée")
    description = models.TextField(verbose_name="Description de la réclamation")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending",
        verbose_name="Statut"
    )
    admin_response = models.TextField(blank=True, verbose_name="Réponse de l'administrateur")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Réclamation"
        verbose_name_plural = "Réclamations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_name} - {self.subject_name} ({self.get_grade_type_display()}): {self.status}"

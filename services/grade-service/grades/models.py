from django.db import models


class GradeType(models.TextChoices):
    CONTROLE = "cc", "Contrôle continu"
    DS = "ds", "Devoir surveillé"
    EXAMEN = "examen", "Examen"


class Grade(models.Model):
    SEMESTER_CHOICES = [
        ("s1", "Semestre 1"),
        ("s2", "Semestre 2"),
    ]

    student_external_id = models.IntegerField(verbose_name="ID étudiant")
    student_name = models.CharField(max_length=300, blank=True, verbose_name="Nom étudiant")
    subject_external_id = models.IntegerField(verbose_name="ID matière")
    subject_name = models.CharField(max_length=200, blank=True, verbose_name="Matière")
    class_external_id = models.IntegerField(verbose_name="ID classe")
    teacher_external_id = models.IntegerField(verbose_name="ID enseignant")
    grade_type = models.CharField(
        max_length=10, choices=GradeType.choices, default=GradeType.CONTROLE,
        verbose_name="Type de note"
    )
    semester = models.CharField(max_length=2, choices=SEMESTER_CHOICES, verbose_name="Semestre")
    academic_year = models.CharField(max_length=9, default="2025-2026", verbose_name="Année scolaire")
    grade = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Note")
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, default=1.0, verbose_name="Coefficient")
    comment = models.TextField(blank=True, verbose_name="Commentaire")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Note"
        verbose_name_plural = "Notes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_name} - {self.subject_name} ({self.get_grade_type_display()}): {self.grade}"

from django.db import models


class Classe(models.Model):
    LEVEL_CHOICES = [
        ("1ap", "1ère Année Primaire"),
        ("2ap", "2ème Année Primaire"),
        ("3ap", "3ème Année Primaire"),
        ("4ap", "4ème Année Primaire"),
        ("5ap", "5ème Année Primaire"),
        ("6ap", "6ème Année Primaire"),
        ("1ac", "1ère Année Collège"),
        ("2ac", "2ème Année Collège"),
        ("3ac", "3ème Année Collège"),
        ("1bac", "1ère Baccalauréat"),
        ("2bac", "2ème Baccalauréat"),
    ]

    name = models.CharField(max_length=50, unique=True, verbose_name="Nom de la classe")
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, blank=True, default='', verbose_name="Niveau")
    main_teacher = models.CharField(max_length=150, blank=True, verbose_name="Professeur principal")
    academic_year = models.CharField(max_length=9, default="2025-2026", verbose_name="Année scolaire")
    capacity = models.PositiveIntegerField(default=35, verbose_name="Capacité")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Classe"
        verbose_name_plural = "Classes"
        ordering = ["level", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"


class Enrollment(models.Model):
    student_external_id = models.IntegerField(verbose_name="ID étudiant (auth)")
    student_name = models.CharField(max_length=300, blank=True, verbose_name="Nom étudiant")
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name="enrollments", verbose_name="Classe")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Inscription"
        verbose_name_plural = "Inscriptions"
        unique_together = ["student_external_id", "classe"]

    def __str__(self):
        return f"{self.student_name or self.student_external_id} → {self.classe.name}"

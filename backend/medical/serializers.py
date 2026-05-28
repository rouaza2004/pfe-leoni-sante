from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import transaction
from .models import (
    DossierMedical,
    ExamenInitial,
    ExamenUlterieur,
    PosteTravail,
    IncidentInfirmier,
    IncidentAvecBon,
    IncidentSansBon,
    AccidentTravail,
    EnqueteInitialeAccident,
    PlanActionHSEE,
    MaladieProfessionnelle,
    Vaccination,
    FicheMedicale,
    Ordonnance,
    CertificatMedical,
    StockItem,
    StockMovement,
    BonChauffeur,
    SuiviTransfertUrgence,
    PointageMedecin,
    FicheAptitude,
    DemandeExamenLabo,
    ExamenComplementaire,
    HSEEGeneratedReport,
    ControleMedicalRecord,
    DemandeExpertiseRecord,
)


class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = "__all__"


class IncidentInfirmierSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_prenom = serializers.SerializerMethodField()
    matricule = serializers.SerializerMethodField()
    site_nom = serializers.SerializerMethodField()

    class Meta:
        model = IncidentInfirmier
        fields = [
            "id",
            "dossier",
            "date_incident",
            "heure_incident",
            "segment",
            "unite",
            "poste_occupe",
            "mode_lesion",
            "agent_causal",
            "telephone",
            "infirmier_responsable",
            "remarque",
            "created_at",
            "collaborateur_nom",
            "collaborateur_prenom",
            "matricule",
            "site_nom",
        ]

    def get_collaborateur_nom(self, obj):
        return getattr(obj.dossier.collaborateur, "nom", "")

    def get_collaborateur_prenom(self, obj):
        return getattr(obj.dossier.collaborateur, "prenom", "")

    def get_matricule(self, obj):
        return getattr(obj.dossier.collaborateur, "matricule", "")

    def get_site_nom(self, obj):
        return getattr(getattr(obj.dossier.collaborateur, "site", None), "nom", "") or "Non défini"


class AccidentTravailSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_prenom = serializers.SerializerMethodField()
    matricule = serializers.SerializerMethodField()
    type_accident = serializers.SerializerMethodField()
    zone = serializers.SerializerMethodField()
    gravite_display = serializers.SerializerMethodField()
    enquete_display = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    envoye_hsee = serializers.SerializerMethodField()
    sent_to_hsee_at = serializers.SerializerMethodField()
    sent_to_hsee_by_name = serializers.SerializerMethodField()
    enquete_initiale_status = serializers.SerializerMethodField()
    site_nom = serializers.SerializerMethodField()

    class Meta:
        model = AccidentTravail
        fields = [
            "id",
            "dossier",
            "created_by",
            "employeur_cnss",
            "employeur_nom",
            "employeur_adresse",
            "employeur_code_postal",
            "employeur_telephone",
            "employeur_activite",
            "victime_cnss",
            "victime_nom",
            "victime_prenom",
            "victime_nom_naissance",
            "victime_prenom_pere",
            "victime_nationalite",
            "victime_sexe",
            "victime_date_naissance",
            "victime_lieu_naissance",
            "victime_cin",
            "victime_adresse",
            "victime_code_postal",
            "victime_date_embauche",
            "victime_specialite",
            "victime_situation",
            "victime_profession",
            "victime_poste_accident",
            "victime_lieu_travail",
            "victime_salaire",
            "autres_victimes",
            "date_accident",
            "heure_accident",
            "lieu_accident",
            "circonstances",
            "horaire_travail_debut",
            "horaire_travail_fin",
            "activite_lieu",
            "activite_lieu_autre",
            "activite_service",
            "moment_travail",
            "nombre_travailleurs",
            "description_circonstances",
            "causes_materielles",
            "comment_accident",
            "cause",
            "nature_lesion",
            "siege_lesion",
            "agent_materiel",
            "presence_standard",
            "respect_standard",
            "action_immediate",
            "why1",
            "why2",
            "why3",
            "why4",
            "why5",
            "ishikawa_methode",
            "ishikawa_main_oeuvre",
            "ishikawa_materiel",
            "ishikawa_milieu",
            "ishikawa_matiere",
            "segment",
            "gravite",
            "statut_enquete",
            "transport_hopital",
            "temoin1_nom",
            "temoin1_telephone",
            "temoin1_matricule",
            "temoin2_nom",
            "temoin2_telephone",
            "temoin2_matricule",
            "temoins",
            "rapport_police",
            "rapport_police_numero",
            "rapport_police_date",
            "rapport_police_poste",
            "tiers_responsable",
            "tiers_nom",
            "tiers_assureur",
            "resultat",
            "arret_travail",
            "date_arret",
            "heure_arret",
            "salaire_maintenu",
            "salaire_duree",
            "salaire_montant",
            "salaire_unite",
            "signataire_nom",
            "signataire_qualite",
            "signature_lieu",
            "signature_date",
            "duree_arret",
            "ipp",
            "envoye_hsee",
            "sent_to_hsee_at",
            "sent_to_hsee_by_name",
            "enquete_initiale_status",
            "statut_declaration",
            "generated_at",
            "printed_at",
            "created_at",
            "updated_at",
            "collaborateur_nom",
            "collaborateur_prenom",
            "matricule",
            "site_nom",
            "type_accident",
            "zone",
            "gravite_display",
            "enquete_display",
            "created_by_name",
        ]
        read_only_fields = (
            "created_by",
            "generated_at",
            "printed_at",
            "created_at",
            "updated_at",
        )

    def get_collaborateur_nom(self, obj):
        return getattr(obj.dossier.collaborateur, "nom", "")

    def get_collaborateur_prenom(self, obj):
        return getattr(obj.dossier.collaborateur, "prenom", "")

    def get_matricule(self, obj):
        return getattr(obj.dossier.collaborateur, "matricule", "")

    def get_site_nom(self, obj):
        return getattr(getattr(obj.dossier.collaborateur, "site", None), "nom", "") or "Non défini"

    def get_type_accident(self, obj):
        return obj.nature_lesion or "Accident"

    def get_zone(self, obj):
        return obj.segment or obj.lieu_accident or "-"

    def get_gravite_display(self, obj):
        if obj.gravite:
            return obj.get_gravite_display()

        jours = obj.duree_arret or 0
        if jours >= 10:
            return "Grave"
        if jours >= 1:
            return "Moyenne"
        return "Faible"

    def get_enquete_display(self, obj):
        if obj.statut_enquete:
            return obj.get_statut_enquete_display()
        return "Envoye HSEE" if self.get_envoye_hsee(obj) else "En attente"

    def get_created_by_name(self, obj):
        user = getattr(obj, "created_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")

    def get_envoye_hsee(self, obj):
        enquete = getattr(obj, "enquete_initiale", None)
        return bool(getattr(enquete, "sent_to_hsee", False))

    def get_sent_to_hsee_at(self, obj):
        enquete = getattr(obj, "enquete_initiale", None)
        return getattr(enquete, "sent_to_hsee_at", None)

    def get_sent_to_hsee_by_name(self, obj):
        enquete = getattr(obj, "enquete_initiale", None)
        user = getattr(enquete, "sent_to_hsee_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")

    def get_enquete_initiale_status(self, obj):
        enquete = getattr(obj, "enquete_initiale", None)
        if not enquete:
            return "Brouillon"
        return enquete.get_statut_display()

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        statut = attrs.get(
            "statut_declaration",
            getattr(instance, "statut_declaration", "BROUILLON") if instance else "BROUILLON",
        )

        if statut == "BROUILLON":
            return attrs

        def val(field):
            if field in attrs:
                return attrs.get(field)
            return getattr(instance, field, None) if instance else None

        required = [
            "employeur_nom",
            "employeur_cnss",
            "victime_nom",
            "victime_prenom",
            "victime_cin",
            "date_accident",
            "lieu_accident",
            "cause",
            "nature_lesion",
            "siege_lesion",
        ]
        missing = [f for f in required if not val(f)]
        if missing:
            raise serializers.ValidationError(
                {"detail": f"Champs obligatoires manquants: {', '.join(missing)}"}
            )

        cnss = val("employeur_cnss")
        if cnss and not str(cnss).isdigit():
            raise serializers.ValidationError({"detail": "Numero CNSS invalide."})

        date_accident = val("date_accident")
        date_arret = val("date_arret")
        if date_arret and date_accident and date_arret < date_accident:
            raise serializers.ValidationError(
                {"detail": "Date d'arret incoherente (anterieure a la date d'accident)."}
            )

        if val("arret_travail") and not date_arret:
            raise serializers.ValidationError(
                {"detail": "Date d'arret requise lorsque l'arret de travail est oui."}
            )

        return attrs


class PlanActionHSEESerializer(serializers.ModelSerializer):
    accident_id = serializers.IntegerField(source="accident.id", read_only=True)

    class Meta:
        model = PlanActionHSEE
        fields = [
            "id",
            "accident",
            "accident_id",
            "zone",
            "risque",
            "action",
            "responsable",
            "delai",
            "statut",
            "created_at",
        ]


class AIAnalysisRequestSerializer(serializers.Serializer):
    description = serializers.CharField(trim_whitespace=True)
    type = serializers.CharField(required=False, default="accident")

    def validate_description(self, value):
        text = (value or "").strip()
        if not text:
            raise serializers.ValidationError("La description est obligatoire.")
        return text

    def validate_type(self, value):
        allowed = {"accident", "symptomes", "rapport_hsee", "general"}
        normalized = (value or "accident").strip().lower()
        if normalized not in allowed:
            raise serializers.ValidationError("Type d’analyse non supporté.")
        return normalized


class EnqueteInitialeAccidentSerializer(serializers.ModelSerializer):
    accident_id = serializers.IntegerField(source="accident.id", read_only=True)
    dossier_id = serializers.IntegerField(source="dossier.id", read_only=True)
    created_by_name = serializers.SerializerMethodField()
    sent_to_hsee_by_name = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    type_accident = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = EnqueteInitialeAccident
        fields = [
            "id",
            "accident",
            "accident_id",
            "dossier",
            "dossier_id",
            "created_by",
            "created_by_name",
            "sent_to_hsee_by",
            "sent_to_hsee_by_name",
            "victime_nom_prenom",
            "victime_matricule",
            "victime_numero_telephone",
            "victime_appartenance",
            "victime_horaire_travail",
            "date_accident",
            "heure_accident",
            "lieu_accident",
            "circonstances_accident",
            "siege_type_lesion",
            "lieu_transport_victime",
            "temoins",
            "statut",
            "statut_display",
            "type_accident",
            "sent_to_hsee",
            "sent_to_hsee_at",
            "pdf_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "accident",
            "accident_id",
            "dossier",
            "dossier_id",
            "created_by",
            "created_by_name",
            "sent_to_hsee_by",
            "sent_to_hsee_by_name",
            "statut",
            "statut_display",
            "type_accident",
            "sent_to_hsee",
            "sent_to_hsee_at",
            "pdf_url",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj):
        user = getattr(obj, "created_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")

    def get_sent_to_hsee_by_name(self, obj):
        user = getattr(obj, "sent_to_hsee_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")

    def get_type_accident(self, obj):
        accident = getattr(obj, "accident", None)
        return getattr(accident, "nature_lesion", "") or getattr(accident, "cause", "") or "Accident"

    def get_pdf_url(self, obj):
        return f"/api/medical/enquetes-initiales/{obj.pk}/pdf/"

    def validate(self, attrs):
        required = [
            ("victime_nom_prenom", "Nom et prenom"),
            ("victime_matricule", "Matricule"),
            ("date_accident", "Date accident"),
            ("heure_accident", "Heure accident"),
            ("lieu_accident", "Lieu accident"),
            ("circonstances_accident", "Circonstances accident"),
        ]
        errors = {}
        for field, label in required:
            value = attrs.get(field)
            if value in [None, ""] or (isinstance(value, str) and not value.strip()):
                errors[field] = f"{label} est obligatoire."

        temoins = attrs.get("temoins")
        if temoins is not None and not isinstance(temoins, list):
            errors["temoins"] = "Le format des temoins est invalide."

        if errors:
            raise ValidationError(errors)
        return attrs


class HSEEEnqueteActionSerializer(serializers.Serializer):
    correctiveAction = serializers.CharField()
    responsable = serializers.CharField()
    dateLimite = serializers.DateField()
    statut = serializers.CharField(required=False, allow_blank=True, default="En attente")


class HSEEEnqueteSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    dossier = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    created_by_name = serializers.CharField(read_only=True)
    collaborateur_nom = serializers.CharField(read_only=True)
    collaborateur_prenom = serializers.CharField(read_only=True)
    matricule = serializers.CharField(read_only=True)
    general = serializers.DictField()
    lesion = serializers.DictField()
    causes = serializers.DictField()
    actions = HSEEEnqueteActionSerializer(many=True, required=False)

    def validate_general(self, value):
        required = [
            "victimeNom",
            "victimeMatricule",
            "departement",
            "posteShift",
            "dateIncident",
            "heureIncident",
            "lieuIncident",
            "descriptionIncident",
        ]
        missing = [field for field in required if not str(value.get(field, "")).strip()]
        if missing:
            raise serializers.ValidationError(f"Champs generaux manquants: {', '.join(missing)}")
        return value

    def validate_lesion(self, value):
        required = [
            "natureLesion",
            "agentMateriel",
            "causeIdentifiee",
            "presenceStandard",
            "respectStandard",
            "actionImmediate",
            "siegeLesion",
        ]
        missing = [field for field in required if not str(value.get(field, "")).strip()]
        if missing:
            raise serializers.ValidationError(f"Champs lesion manquants: {', '.join(missing)}")
        return value

    def create(self, validated_data):
        raise NotImplementedError


class HSEEReportTemplateSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    category = serializers.CharField()
    icon_key = serializers.CharField()
    sections_available = serializers.ListField(child=serializers.DictField(), required=False)
    formats_supported = serializers.ListField(child=serializers.CharField(), required=False)
    detail_levels = serializers.ListField(child=serializers.DictField(), required=False)
    periods = serializers.ListField(child=serializers.DictField(), required=False)
    departments = serializers.ListField(child=serializers.DictField(), required=False)
    active = serializers.BooleanField(default=True)


class HSEEReportGenerateSerializer(serializers.Serializer):
    template_id = serializers.CharField()
    period = serializers.CharField()
    format = serializers.ChoiceField(choices=["PDF", "EXCEL"])
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    detail_level = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    sections = serializers.ListField(child=serializers.CharField(), required=False)
    generated_by = serializers.CharField(required=False, allow_blank=True)
    send_email_after_generation = serializers.BooleanField(required=False, default=False)


class HSEEGeneratedReportSerializer(serializers.ModelSerializer):
    code = serializers.CharField(source="reference", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    format = serializers.CharField(source="output_format", read_only=True)
    generated_at_display = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    sent_by_name = serializers.SerializerMethodField()

    class Meta:
        model = HSEEGeneratedReport
        fields = [
            "id",
            "code",
            "title",
            "template_key",
            "template_name",
            "category",
            "description",
            "status",
            "status_label",
            "format",
            "period_value",
            "period_label",
            "department",
            "detail_level",
            "sections",
            "generated_at",
            "generated_at_display",
            "created_by_name",
            "file_size",
            "file_size_bytes",
            "download_url",
            "preview_url",
            "sent_at",
            "sent_by_name",
        ]

    def get_generated_at_display(self, obj):
        if not obj.generated_at:
            return ""
        return obj.generated_at.strftime("%d/%m/%Y")

    def get_created_by_name(self, obj):
        user = getattr(obj, "created_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")

    def get_file_size(self, obj):
        size = obj.file_size_bytes or 0
        if size >= 1024 * 1024:
            return f"{round(size / (1024 * 1024), 1)} MB"
        if size >= 1024:
            return f"{round(size / 1024, 1)} KB"
        return f"{size} B"

    def get_download_url(self, obj):
        return f"/api/medical/hsee/reports/{obj.pk}/download/"

    def get_preview_url(self, obj):
        return f"/api/medical/hsee/reports/{obj.pk}/preview/"

    def get_sent_by_name(self, obj):
        user = getattr(obj, "sent_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")


class MaladieProfessionnelleSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_prenom = serializers.SerializerMethodField()
    matricule = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    site_nom = serializers.SerializerMethodField()

    class Meta:
        model = MaladieProfessionnelle
        fields = "__all__"
        read_only_fields = (
            "created_by",
            "generated_at",
            "printed_at",
            "created_at",
            "updated_at",
        )

    def get_collaborateur_nom(self, obj):
        return getattr(obj.dossier.collaborateur, "nom", "")

    def get_collaborateur_prenom(self, obj):
        return getattr(obj.dossier.collaborateur, "prenom", "")

    def get_matricule(self, obj):
        return getattr(obj.dossier.collaborateur, "matricule", "")

    def get_site_nom(self, obj):
        return getattr(getattr(obj.dossier.collaborateur, "site", None), "nom", "") or "Non défini"

    def get_created_by_name(self, obj):
        user = getattr(obj, "created_by", None)
        if not user:
            return ""
        full_name = (user.get_full_name() or "").strip()
        return full_name if full_name else (user.username or "")

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        statut = attrs.get(
            "statut_declaration",
            getattr(instance, "statut_declaration", "BROUILLON") if instance else "BROUILLON",
        )

        def val(field):
            if field in attrs:
                return attrs.get(field)
            return getattr(instance, field, None) if instance else None

        date_debut = val("date_debut_exposition")
        date_fin = val("date_fin_exposition")
        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError(
                {"detail": "Date fin exposition incoherente (anterieure a la date debut)."}
            )

        if val("arret_travail") and not val("date_arret"):
            raise serializers.ValidationError(
                {"detail": "Date d'arret requise lorsque l'arret de travail est oui."}
            )

        if statut == "BROUILLON":
            return attrs

        required = [
            "employeur_nom",
            "employeur_cnss",
            "victime_nom",
            "victime_prenom",
            "victime_cin",
            "nom_maladie",
            "numero_tableau",
            "date_decouverte",
        ]
        missing = [f for f in required if not val(f)]
        if missing:
            raise serializers.ValidationError(
                {"detail": f"Champs obligatoires manquants: {', '.join(missing)}"}
            )

        cnss = val("employeur_cnss")
        if cnss and not str(cnss).isdigit():
            raise serializers.ValidationError({"detail": "Numero CNSS invalide."})

        return attrs


class PosteTravailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PosteTravail
        fields = "__all__"


class ExamenInitialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenInitial
        fields = "__all__"


class ExamenUlterieurSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenUlterieur
        fields = "__all__"


class OrdonnanceSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Ordonnance
        fields = "__all__"
        read_only_fields = ("created_by", "date", "created_at")

    def get_created_by_name(self, obj):
        user = obj.created_by
        if not user:
            return "Docteur"

        first_name = (user.first_name or "").strip()
        last_name = (user.last_name or "").strip()
        full_name = f"{first_name} {last_name}".strip()

        if full_name:
            return f"Dr {full_name}"

        return f"Dr {user.username}"


class CertificatMedicalSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CertificatMedical
        fields = "__all__"
        read_only_fields = ("created_by", "date", "created_at")

    def get_created_by_name(self, obj):
        user = obj.created_by
        if not user:
            return "Docteur"

        first_name = (user.first_name or "").strip()
        last_name = (user.last_name or "").strip()
        full_name = f"{first_name} {last_name}".strip()

        if full_name:
            return f"Dr {full_name}"

        return f"Dr {user.username}"


class FicheMedicaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FicheMedicale
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class DossierMedicalSerializer(serializers.ModelSerializer):
    examen_initial = ExamenInitialSerializer(read_only=True)
    examens_ulterieurs = ExamenUlterieurSerializer(many=True, read_only=True)
    postes = PosteTravailSerializer(many=True, read_only=True)
    incidents_infirmiers = IncidentInfirmierSerializer(many=True, read_only=True)
    accidents = AccidentTravailSerializer(many=True, read_only=True)
    maladies_professionnelles = MaladieProfessionnelleSerializer(many=True, read_only=True)
    vaccinations = VaccinationSerializer(many=True, read_only=True)

    class Meta:
        model = DossierMedical
        fields = "__all__"


class StockItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockItem
        fields = [
            "id",
            "nom",
            "libelle",
            "forme",
            "dosage",
            "type_article",
            "categorie",
            "quantite",
            "seuil_critique",
            "unite",
            "date_expiration",
            "description",
            "actif",
            "created_at",
            "updated_at",
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    stock_item_nom = serializers.CharField(source="stock_item.nom", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "stock_item",
            "stock_item_nom",
            "type_mouvement",
            "quantite",
            "remarque",
            "created_at",
        ]

    def create(self, validated_data):
        qty = int(validated_data.get("quantite") or 0)
        if qty <= 0:
            raise ValidationError({"quantite": "La quantité doit être supérieure à 0."})

        movement_type = validated_data.get("type_mouvement")
        stock_item = validated_data.get("stock_item")

        if movement_type not in ("ENTREE", "SORTIE"):
            raise ValidationError({"type_mouvement": "Type de mouvement invalide."})

        with transaction.atomic():
            locked_item = (
                StockItem.objects.select_for_update()
                .filter(pk=stock_item.pk)
                .first()
            )
            if not locked_item:
                raise ValidationError({"stock_item": "Médicament introuvable."})

            if movement_type == "SORTIE":
                if qty > locked_item.quantite:
                    raise ValidationError(
                        {"quantite": "Quantité demandée supérieure au stock disponible."}
                    )
                locked_item.quantite = locked_item.quantite - qty
            else:
                locked_item.quantite = locked_item.quantite + qty

            locked_item.save(update_fields=["quantite", "updated_at"])
            movement_data = dict(validated_data)
            movement_data.pop("stock_item", None)
            movement = StockMovement.objects.create(stock_item=locked_item, **movement_data)
            return movement


class PointageMedecinSerializer(serializers.ModelSerializer):
    medecin_nom = serializers.SerializerMethodField()

    class Meta:
        model = PointageMedecin
        fields = [
            "id",
            "medecin",
            "medecin_nom",
            "date",
            "heure_arrivee",
            "heure_depart",
            "statut",
            "note",
            "created_at",
            "updated_at",
        ]

    def get_medecin_nom(self, obj):
        medecin = getattr(obj, "medecin", None)
        if not medecin:
            return ""
        full_name = ""
        try:
            full_name = medecin.get_full_name() or ""
        except Exception:
            full_name = ""
        return full_name or getattr(medecin, "username", "") or ""


class FicheAptitudeSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.CharField(source="collaborateur.nom", read_only=True)
    collaborateur_prenom = serializers.CharField(source="collaborateur.prenom", read_only=True)
    matricule = serializers.CharField(source="collaborateur.matricule", read_only=True)
    site_nom = serializers.CharField(source="collaborateur.site.nom", read_only=True)

    class Meta:
        model = FicheAptitude
        fields = "__all__"
        read_only_fields = ("created_by", "date", "created_at")


class DemandeExamenLaboSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeExamenLabo
        fields = "__all__"
        read_only_fields = ("created_by", "date", "created_at")


class ExamenComplementaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamenComplementaire
        fields = "__all__"


class IncidentAvecBonSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentAvecBon
        fields = "__all__"


class IncidentSansBonSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentSansBon
        fields = "__all__"
        read_only_fields = ("created_by", "date", "created_at")


class BonChauffeurSerializer(serializers.ModelSerializer):
    class Meta:
        model = BonChauffeur
        fields = "__all__"


class SuiviTransfertUrgenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuiviTransfertUrgence
        fields = "__all__"
        read_only_fields = ("created_by", "date", "created_at")


class ControleMedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ControleMedicalRecord
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class DemandeExpertiseRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeExpertiseRecord
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")

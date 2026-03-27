from rest_framework import serializers
from .models import (
    DossierMedical,
    ExamenInitial,
    ExamenUlterieur,
    PosteTravail,
    IncidentInfirmier,
    AccidentTravail,
    PlanActionHSEE,
    MaladieProfessionnelle,
    Vaccination,
    FicheMedicale,
    Ordonnance,
    CertificatMedical,
    StockItem,
    StockMovement,
    FicheAptitude,
    DemandeExamenLabo,
    ExamenComplementaire,
    IncidentAvecBon,
    IncidentSansBon,
    BonChauffeur,
    SuiviTransfertUrgence,
)


class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = "__all__"


class IncidentInfirmierSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_prenom = serializers.SerializerMethodField()
    matricule = serializers.SerializerMethodField()

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
        ]

    def get_collaborateur_nom(self, obj):
        return getattr(obj.dossier.collaborateur, "nom", "")

    def get_collaborateur_prenom(self, obj):
        return getattr(obj.dossier.collaborateur, "prenom", "")

    def get_matricule(self, obj):
        return getattr(obj.dossier.collaborateur, "matricule", "")


class AccidentTravailSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.SerializerMethodField()
    collaborateur_prenom = serializers.SerializerMethodField()
    matricule = serializers.SerializerMethodField()
    type_accident = serializers.SerializerMethodField()
    zone = serializers.SerializerMethodField()
    gravite_display = serializers.SerializerMethodField()
    enquete_display = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AccidentTravail
        fields = [
            "id",
            "dossier",
<<<<<<< HEAD
            "created_by",
=======
>>>>>>> 1fd8565 (update infirmier features)
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
<<<<<<< HEAD
            "victime_salaire",
=======
>>>>>>> 1fd8565 (update infirmier features)
            "autres_victimes",
            "date_accident",
            "heure_accident",
            "lieu_accident",
            "circonstances",
            "horaire_travail_debut",
            "horaire_travail_fin",
            "activite_lieu",
            "activite_lieu_autre",
<<<<<<< HEAD
            "activite_service",
            "moment_travail",
=======
>>>>>>> 1fd8565 (update infirmier features)
            "nombre_travailleurs",
            "description_circonstances",
            "causes_materielles",
            "comment_accident",
            "cause",
            "nature_lesion",
            "siege_lesion",
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
<<<<<<< HEAD
            "arret_travail",
=======
>>>>>>> 1fd8565 (update infirmier features)
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
            "statut_declaration",
            "generated_at",
            "printed_at",
            "created_at",
            "updated_at",
            "collaborateur_nom",
            "collaborateur_prenom",
            "matricule",
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
        return "Termin?e" if obj.envoye_hsee else "En attente"

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


class MaladieProfessionnelleSerializer(serializers.ModelSerializer):
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

    def get_fields(self):
        fields = super().get_fields()
        fields["collaborateur_nom"] = serializers.SerializerMethodField()
        fields["collaborateur_prenom"] = serializers.SerializerMethodField()
        fields["matricule"] = serializers.SerializerMethodField()
        fields["created_by_name"] = serializers.SerializerMethodField()
        return fields

    def get_collaborateur_nom(self, obj):
        return getattr(obj.dossier.collaborateur, "nom", "")

    def get_collaborateur_prenom(self, obj):
        return getattr(obj.dossier.collaborateur, "prenom", "")

    def get_matricule(self, obj):
        return getattr(obj.dossier.collaborateur, "matricule", "")

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

        return attrs

    def get_fields(self):
        fields = super().get_fields()
        fields["collaborateur_nom"] = serializers.SerializerMethodField()
        fields["collaborateur_prenom"] = serializers.SerializerMethodField()
        fields["matricule"] = serializers.SerializerMethodField()
        return fields

    def get_collaborateur_nom(self, obj):
        return getattr(obj.dossier.collaborateur, "nom", "")

    def get_collaborateur_prenom(self, obj):
        return getattr(obj.dossier.collaborateur, "prenom", "")

    def get_matricule(self, obj):
        return getattr(obj.dossier.collaborateur, "matricule", "")


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


class FicheAptitudeSerializer(serializers.ModelSerializer):
    collaborateur_nom = serializers.CharField(source="collaborateur.nom", read_only=True)
    collaborateur_prenom = serializers.CharField(source="collaborateur.prenom", read_only=True)
    matricule = serializers.CharField(source="collaborateur.matricule", read_only=True)

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
<<<<<<< HEAD


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
=======
        read_only_fields = ("created_by", "date", "created_at")
>>>>>>> 1fd8565 (update infirmier features)

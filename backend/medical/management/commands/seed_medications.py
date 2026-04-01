import re
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from medical.models import StockItem


class Command(BaseCommand):
    help = 'Seed medications with realistic data'

    def handle(self, *args, **kwargs):

        def pick_category(name):
            n = name.lower()
            if any(k in n for k in ['compresse', 'bande', 'gaz', 'velpeau']):
                return 'Pansement'
            if any(k in n for k in ['algidol', 'apranax', 'doliprane', 
                                      'paracetamol', 'actafon', 'ibuprofene']):
                return 'Antalgique'
            if any(k in n for k in ['amuchina', 'antisept', 'perox', 'betadine']):
                return 'Antiseptique'
            if any(k in n for k in ['aerol', 'ventoline', 'salbutamol']):
                return 'Pneumologie'
            if any(k in n for k in ['abaisse', 'langue']):
                return 'Matériel médical'
            if any(k in n for k in ['sirop', 'suspension']):
                return 'Gastro-entérologie'
            return 'Général'

        def pick_forme(name):
            n = name.lower()
            if any(k in n for k in ['compresse', 'bande']):
                return 'Pansement'
            if any(k in n for k in ['spray', 'aerol']):
                return 'Spray'
            if any(k in n for k in ['solution', 'amuchina']):
                return 'Solution'
            if 'sirop' in n:
                return 'Sirop'
            if 'gelule' in n or 'gélule' in n:
                return 'Gélule'
            return 'Comprimé'

        def pick_dosage(name):
            match = re.search(r'(\d+(?:[.,]\d+)?\s*mg)', name, re.IGNORECASE)
            if match:
                return match.group(1).replace(' ', '')
            return '500mg'

        def random_expiry():
            return date.today() + timedelta(days=random.randint(180, 730))

        qs = StockItem.objects.filter(type_article='MEDICAMENT')
        updated = 0

        for item in qs:
            name = item.nom or ''
            cat = pick_category(name)
            forme = pick_forme(name)
            dosage = pick_dosage(name)
            stock = random.randint(15, 60)
            expiry = random_expiry()

            item.categorie = cat
            item.forme = forme
            item.dosage = dosage
            item.quantite = stock
            item.seuil_critique = 5
            item.date_expiration = expiry
            item.save()
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated} medications')
        )

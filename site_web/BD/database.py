# BD/database.py
from datetime import datetime
import bcrypt

# Compteurs
reservation_counter = 1
commande_counter = 1
client_counter = 1

# Bases de données simulées
users_db = []
reservations_db = []
commandes_db = []
clients_db = []

# Catalogue des balais
balais_data = [
    {
        "id": 1,
        "libelle": "Balai traditionnel en paille",
        "description": "Balai classique en paille de riz, idéal pour un usage domestique quotidien.",
        "categorie": "non_magique",
        "prix_location": 3.50,
        "prix_vente": 15.00,
        "nb_utilisation": 100,
        "etat": "neuf",
        "img": "🧹",
        "inStock": True
    },
    {
        "id": 2,
        "libelle": "Balai mécanique à franges",
        "description": "Balai mécanique avec franges en microfibre, parfait pour les sols lisses.",
        "categorie": "non_magique",
        "prix_location": 7.90,
        "prix_vente": 25.00,
        "nb_utilisation": 75,
        "etat": "bon",
        "img": "🧹🧹",
        "inStock": True
    },
    {
        "id": 3,
        "libelle": "Balai Volant Éclairs",
        "description": "Balai magique ultra-rapide avec éclairs lumineux",
        "categorie": "magique",
        "prix_location": 50.00,
        "prix_vente": 350.00,
        "nb_utilisation": 500,
        "etat": "neuf",
        "img": "⚡🧹",
        "niveau_magique": 5,
        "vitesse": 150,
        "permis_magique_requis": 4,
        "composants_magiques": ["Ecaille de dragon", "Queue de licorne", "Poudre d'étoile"],
        "inStock": True
    },
    {
        "id": 4,
        "libelle": "Balai des Brumes",
        "description": "Balai capable de créer un brouillard protecteur",
        "categorie": "magique",
        "prix_location": 35.00,
        "prix_vente": 280.00,
        "nb_utilisation": 300,
        "etat": "use",
        "img": "🌫️🧹",
        "niveau_magique": 3,
        "vitesse": 90,
        "permis_magique_requis": 2,
        "composants_magiques": ["Feuille d'Yggdrasil", "Bave de limace magique"],
        "inStock": True
    },
    {
        "id": 5,
        "libelle": "Balai à gazon extérieur",
        "description": "Balai robuste pour feuilles et débris sur pelouse ou terrasse.",
        "categorie": "non_magique",
        "prix_location": 8.50,
        "prix_vente": 28.00,
        "nb_utilisation": 50,
        "etat": "use",
        "img": "🌿🧹",
        "inStock": True
    },
    {
        "id": 6,
        "libelle": "Balai Phénix",
        "description": "Balai légendaire du Phénix, résiste au feu",
        "categorie": "magique",
        "prix_location": 75.00,
        "prix_vente": 600.00,
        "nb_utilisation": 1000,
        "etat": "neuf",
        "img": "🔥🧹",
        "niveau_magique": 5,
        "vitesse": 200,
        "permis_magique_requis": 5,
        "composants_magiques": ["Plume de Phénix", "Cendre volcanique", "Sang de dragon"],
        "inStock": True
    }
]

# Clients de démonstration
clients_demo = [
    {"id": 1, "username": "client1", "nom": "Martin", "prenom": "Sophie", "email": "sophie@email.com", "telephone": "0612345678", "adresse": "12 rue des Lilas, 75001 Paris"},
    {"id": 2, "username": "client2", "nom": "Bernard", "prenom": "Jean", "email": "jean@email.com", "telephone": "0623456789", "adresse": "45 avenue de la République, 69001 Lyon"},
    {"id": 3, "username": "client3", "nom": "Petit", "prenom": "Marie", "email": "marie@email.com", "telephone": "0634567890", "adresse": "8 boulevard Victor Hugo, 13001 Marseille"},
]


def init_database():
    """Initialise les données de la base de données simulée"""
    global reservation_counter, commande_counter, client_counter
    global users_db, reservations_db, commandes_db, clients_db
    
    # Réinitialisation
    users_db = []
    reservations_db = []
    commandes_db = []
    clients_db = []
    reservation_counter = 1
    commande_counter = 1
    client_counter = 1
    
    # Compte vendeur par défaut
    vendeur_default = {
        "id": 1,
        "username": "vendeur",
        "password": bcrypt.hashpw("vendeur123".encode(), bcrypt.gensalt()).decode(),
        "role": "vendeur",
        "nom": "Admin",
        "prenom": "Vendeur"
    }
    users_db.append(vendeur_default)
    
    # Clients de démonstration
    for c in clients_demo:
        clients_db.append(c.copy())
        client_counter = max(client_counter, c["id"] + 1)


def get_db():
    """Retourne les références aux bases de données"""
    return {
        "users": users_db,
        "reservations": reservations_db,
        "commandes": commandes_db,
        "clients": clients_db,
        "balais": balais_data,
        "counters": {
            "reservation": reservation_counter,
            "commande": commande_counter,
            "client": client_counter
        }
    }


def update_counter(counter_name, value):
    """Met à jour un compteur"""
    global reservation_counter, commande_counter, client_counter
    if counter_name == "reservation":
        reservation_counter = value
    elif counter_name == "commande":
        commande_counter = value
    elif counter_name == "client":
        client_counter = value


def get_next_id(collection):
    """Retourne le prochain ID disponible"""
    if not collection:
        return 1
    return max(item["id"] for item in collection) + 1
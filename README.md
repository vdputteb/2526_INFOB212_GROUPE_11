# LocBalais - Système de Gestion des Locations et Ventes de Balais

## Description

LocBalais est une application web complète de gestion pour une entreprise de location et vente de balais. Elle permet aux vendeurs et administrateurs de gérer les clients, les stocks, les locations, les ventes et les commandes fournisseurs.

---

### Fonctionnalités principales

- **Authentification sécurisée** avec rôles (vendeur, patron, comptable)
- **Gestion des clients** (Sorciers et Moldus)
- **Catalogue de balais** avec recherche et filtres
- **Gestion des locations** avec validation de retour et facturation
- **Gestion des ventes** de balais
- **Commandes fournisseurs** avec processus d'approbation
- **Tableau de bord statistiques** détaillées
- **Interface responsive** et moderne

---

## Architecture Technique

### Backend
- **Framework**: FastAPI (Python)
- **Base de données**: MySQL
- **Authentification**: JWT (JSON Web Tokens) + bcrypt
- **Validation**: Pydantic

### Frontend
- **Templating**: Jinja2
- **CSS/JS** : Natif (Vanilla)
- **Graphiques**: Chart.js

### Conteneurisation
- **Docker** avec docker-compose pour l'orchestration

### Base de données
Modèles principaux :
- `employee` - Employés (vendeurs, patrons, comptables)
- `client` - Clients (sorciers/moldus)
- `balai` - Balais (magiques/non-magiques)
- `location` - Locations de balais
- `vente` - Ventes de balais
- `commande_fournisseur` - Commandes aux fabricants
- `fabricant` - Fournisseurs

---

## Système de Rôles

| Rôle | Permissions |
|------|-------------|
| **Vendeur** | Gérer clients, ventes, locations, commandes fournisseur |
| **Patron** | Toutes permissions vendeur + gestion employés, approbation commandes |
| **Comptable** | Accès aux statistiques et rapports financiers |

---

## API Principales

### Authentification
- `POST /api/login` - Connexion
- `GET /logout` - Déconnexion

### Clients
- `GET /api/clients` - Liste des clients
- `POST /api/register/client` - Création client
- `PUT /api/modify/client` - Modification client
- `DELETE /api/delete/client/{id}` - Suppression client

### Balais
- `GET /api/catalogue` - Catalogue client
- `GET /api/balais/available` - Balais disponibles

### Locations
- `GET /api/locations/client` - Locations du client
- `POST /api/locations` - Créer location
- `POST /api/locations/validate-return` - Valider retour

### Ventes
- `GET /api/ventes/client` - Ventes du client
- `POST /api/ventes` - Créer commande d'achat

### Commandes Fournisseur
- `POST /api/commandes-fournisseur` - Créer commande
- `PUT /api/commandes-fournisseur/approve` - Approuver commande

### Statistiques
- `GET /api/admin/stats` - Statistiques détaillées
- `GET /api/profile/stats` - Stats du vendeur connecté

---

### Structure du projet

```
locbalais/
├── Dockerfile              # Configuration du conteneur
├── docker-compose.yml      # Orchestration Docker
├── requirements.txt        # Dépendances Python
├── .env                    # Variables d'environnement
├── main.py                 # Point d'entrée FastAPI
├── BD/
│   ├── dao_mysql.py
│   └── models.py
├── utils/
│   ├── auth.py
│   └── jwt_token.py
├── static/                 # Fichiers statiques (CSS, JS)
└── templates/              # Templates Jinja2
```
---

## Installation et Configuration avec Docker

### Prérequis

- Docker 20.10+
- Docker Compose 2.0+ (ou Docker Compose V2 intégré)
- le dossier balai contenant la base de donnée

---

### Étapes d'installation


#### 1. Configurer le fichier `.env`

```env
# Base de données
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME= balaidb

# JWT
SECRET_KEY= votre_cle_secrete_pour_chiffrer_le_jwt_token
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### 2. Configuration Docker Compose

Votre fichier `docker-compose.yml` est déjà configuré. Il utilise un réseau externe nommé `shared_network`.

**Créer le réseau Docker (si ce n'est pas déjà fait) :**

```bash
docker network create shared_network
```

**Créer le container de base de donnée (si ce n'est pas déjà fait) :**

Aller dans le dossier ./balai fourni en .zip et effectuer  

```bash
docker compose up --build 
```


#### 3. Construire et lancer le conteneur

rester dans ./2526_INFOB212_GROUPE_11 et effectuer

```bash
 docker compose --env-file .env up --build --force-recreate 
```

#### 4. Vérifier que l'application fonctionne

Ouvrer votre navigateur et aller sur 
```bash
http://127.0.0.1:8000/auth
```

L'application y sera disponible 

### Comptes de démonstration

| Rôle | Login | Email | Mot de passe |
|------|-------|-------|--------------|
| Vendeur | minerva.mcgonagall | minerva.mcgonagall@magic.com | mcgonagall456 |
| Patron | albus.dumbledore | albus.dumbledore@magic.com | dumbledore123 |
| Comptable | pomona.spout | pomona.spout@magic.com | spout456 |

## Contributeurs à la confection de la Base de Donnée

- Peters Jan
- Limauge Matteo
- Vander Putten Benjamin

## Contributeurs à la confection du site web

- Vander Putten Benjamin


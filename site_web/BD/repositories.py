# BD/repositories.py
from datetime import datetime
from BD.database import get_db, update_counter, get_next_id


class ClientRepository:
    """Gestion des clients"""
    
    @staticmethod
    def get_all():
        db = get_db()
        return [{"id": c["id"], "nom": c["nom"], "prenom": c["prenom"], 
                 "email": c["email"], "telephone": c["telephone"], 
                 "adresse": c.get("adresse", "")} for c in db["clients"]]
    
    @staticmethod
    def get_by_id(client_id):
        db = get_db()
        return next((c for c in db["clients"] if c["id"] == client_id), None)
    
    @staticmethod
    def create(client_data):
        db = get_db()
        new_id = get_next_id(db["clients"])
        new_client = {
            "id": new_id,
            "username": client_data.get("username", f"client{new_id}"),
            "nom": client_data.get("nom"),
            "prenom": client_data.get("prenom"),
            "email": client_data.get("email"),
            "telephone": client_data.get("telephone", ""),
            "adresse": client_data.get("adresse", "")
        }
        db["clients"].append(new_client)
        update_counter("client", new_id + 1)
        return new_client


class BroomRepository:
    """Gestion du catalogue de balais"""
    
    @staticmethod
    def get_all():
        db = get_db()
        return db["balais"]
    
    @staticmethod
    def get_by_id(broom_id):
        db = get_db()
        return next((b for b in db["balais"] if b["id"] == broom_id), None)


class ReservationRepository:
    """Gestion des réservations/locations"""
    
    @staticmethod
    def get_all():
        db = get_db()
        return db["reservations"]
    
    @staticmethod
    def get_by_client(client_id):
        db = get_db()
        return [r for r in db["reservations"] if r.get("userId") == str(client_id)]
    
    @staticmethod
    def check_availability(broom_id, start_date, end_date):
        db = get_db()
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        for res in db["reservations"]:
            if res["broomId"] == broom_id:
                res_start = datetime.strptime(res["startDate"], "%Y-%m-%d")
                res_end = datetime.strptime(res["endDate"], "%Y-%m-%d")
                
                if not (end < res_start or start > res_end):
                    return False, res
        return True, None
    
    @staticmethod
    def create(reservation_data):
        db = get_db()
        counters = get_db()["counters"]
        new_id = counters["reservation"]
        
        new_reservation = {
            "id": new_id,
            "broomId": reservation_data.broomId,
            "startDate": reservation_data.startDate,
            "endDate": reservation_data.endDate,
            "userId": reservation_data.userId,
            "createdAt": datetime.now().isoformat()
        }
        
        db["reservations"].append(new_reservation)
        update_counter("reservation", new_id + 1)
        return new_reservation
    
    @staticmethod
    def delete(reservation_id):
        db = get_db()
        for i, res in enumerate(db["reservations"]):
            if res["id"] == reservation_id:
                return db["reservations"].pop(i)
        return None


class CommandeRepository:
    """Gestion des commandes"""
    
    @staticmethod
    def get_all():
        db = get_db()
        return db["commandes"]
    
    @staticmethod
    def get_by_client(client_id):
        db = get_db()
        return [c for c in db["commandes"] if c.get("client_id") == client_id]
    
    @staticmethod
    def create(commande_data):
        db = get_db()
        counters = get_db()["counters"]
        new_id = counters["commande"]
        
        nouvelle_commande = {
            "id": new_id,
            "client_id": commande_data.get("client_id"),
            "client_nom": commande_data.get("client_nom"),
            "client_prenom": commande_data.get("client_prenom"),
            "client_email": commande_data.get("client_email"),
            "client_adresse": commande_data.get("client_adresse"),
            "articles": commande_data.get("articles", []),
            "sous_total": commande_data.get("sous_total", 0),
            "frais_livraison": commande_data.get("frais_livraison", 0),
            "eco_participation": commande_data.get("eco_participation", 0),
            "total": commande_data.get("total", 0),
            "statut": "confirmée",
            "date_commande": datetime.now().isoformat(),
            "type": commande_data.get("type", "achat")
        }
        
        db["commandes"].append(nouvelle_commande)
        update_counter("commande", new_id + 1)
        return nouvelle_commande


class UserRepository:
    """Gestion des utilisateurs/vendeurs"""
    
    @staticmethod
    def get_by_username(username):
        db = get_db()
        return next((u for u in db["users"] if u["username"] == username), None)
    
    @staticmethod
    def authenticate(username, password, bcrypt):
        user = UserRepository.get_by_username(username)
        if not user:
            return None
        if bcrypt.checkpw(password.encode(), user["password"].encode()):
            return user
        return None
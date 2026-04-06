import bcrypt
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from BD.model import Reservation


app = FastAPI()

# Modèles de données


# Stockage temporaire des réservations (en mémoire)
reservations_db = []
reservation_counter = 1

# Autoriser les requêtes depuis le front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Middleware d'authentification ----
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Routes publiques
    public_routes = ["/" ,"/auth", "/static", "/shop", "/shop/balai", "/basket", "/api/reservations", "/api/reservations/check"]
    
    if request.url.path in public_routes or request.url.path.startswith("/static") or request.url.path.startswith("/api"):
        return await call_next(request)
    
    # Vérification du cookie
    session_user = request.cookies.get("session_user")
    
    if not session_user:
        if request.url.path.startswith("/api"):
            return JSONResponse(
                {"detail": "Non connecté"}, 
                status_code=401
            )
        return RedirectResponse("/shop")
    
    # Stockage de l'utilisateur dans l'état de la requête
    request.state.user = session_user
    
    try:
        response = await call_next(request)
    except Exception as e:
        raise e

    return response


# --- Templates ----
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.on_event("startup")
def on_startup():
    print("Start")
    # Données de démonstration pour les réservations
    global reservations_db, reservation_counter
    reservations_db = []
    reservation_counter = 1

@app.get("/")
async def homer(request: Request):
    return RedirectResponse("/shop")

# Redirect to the Authentification template
@app.get("/auth")
async def auth(request: Request):
    return templates.TemplateResponse(request=request, name="auth.html")

# Redirect to the Shop template
@app.get("/shop")
async def shop(request: Request):
    return templates.TemplateResponse(request=request, name="shop.html")

# Redirect to the Basket template
@app.get("/basket")
async def basket(request: Request):
    return templates.TemplateResponse(request=request, name="basket.html")

# Redirect to the Location template
@app.get("/location")
async def location(request: Request):
    return templates.TemplateResponse(request=request, name="location.html")

# --- API Réservations ---

@app.get("/api/reservations")
async def get_reservations():
    """Récupère toutes les réservations"""
    return JSONResponse(reservations_db)

@app.get("/api/reservations/check")
async def check_availability(broomId: int, startDate: str, endDate: str):
    """Vérifie si un balai est disponible sur une période"""
    try:
        start = datetime.strptime(startDate, "%Y-%m-%d")
        end = datetime.strptime(endDate, "%Y-%m-%d")
        
        if end < start:
            return JSONResponse({
                "available": False,
                "message": "La date de fin doit être postérieure à la date de début"
            })
        
        # Vérifier les conflits
        for res in reservations_db:
            if res["broomId"] == broomId:
                res_start = datetime.strptime(res["startDate"], "%Y-%m-%d")
                res_end = datetime.strptime(res["endDate"], "%Y-%m-%d")
                
                # Vérifier le chevauchement
                if not (end < res_start or start > res_end):
                    return JSONResponse({
                        "available": False,
                        "message": "Balai déjà réservé sur cette période",
                        "conflictStart": res["startDate"],
                        "conflictEnd": res["endDate"]
                    })
        
        return JSONResponse({
            "available": True,
            "message": "Balai disponible"
        })
    except Exception as e:
        return JSONResponse({
            "available": False,
            "message": f"Erreur: {str(e)}"
        }, status_code=400)

@app.post("/api/reservations")
async def create_reservation(reservation: Reservation):
    """Crée une nouvelle réservation"""
    global reservation_counter
    
    # Vérifier la disponibilité
    start = datetime.strptime(reservation.startDate, "%Y-%m-%d")
    end = datetime.strptime(reservation.endDate, "%Y-%m-%d")
    
    for res in reservations_db:
        if res["broomId"] == reservation.broomId:
            res_start = datetime.strptime(res["startDate"], "%Y-%m-%d")
            res_end = datetime.strptime(res["endDate"], "%Y-%m-%d")
            
            if not (end < res_start or start > res_end):
                raise HTTPException(status_code=409, detail="Balai déjà réservé sur cette période")
    
    new_reservation = {
        "id": reservation_counter,
        "broomId": reservation.broomId,
        "startDate": reservation.startDate,
        "endDate": reservation.endDate,
        "userId": reservation.userId,
        "createdAt": datetime.now().isoformat()
    }
    
    reservations_db.append(new_reservation)
    reservation_counter += 1
    
    return JSONResponse(new_reservation, status_code=201)

@app.delete("/api/reservations/{reservation_id}")
async def delete_reservation(reservation_id: int):
    """Supprime une réservation"""
    global reservations_db
    for i, res in enumerate(reservations_db):
        if res["id"] == reservation_id:
            reservations_db.pop(i)
            return JSONResponse({"message": "Réservation annulée"})
    
    raise HTTPException(status_code=404, detail="Réservation non trouvée")

# --- API Balais ---

@app.get("/shop/balai")
async def get_balai():
    # Données de démonstration
    balais = [
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
    
    return JSONResponse(balais)

# Lancement automatique du serveur au lancement du python
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
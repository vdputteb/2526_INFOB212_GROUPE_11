# main.py
import bcrypt
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from BD import (
    init_database, ClientRepository, BroomRepository,
    ReservationRepository, CommandeRepository, UserRepository
)
from BD.model import Reservation

app = FastAPI()

# Initialisation de la base de données simulée
init_database()

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware d'authentification
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    public_routes = ["/", "/auth", "/static", "/api/auth/login", "/api/auth/logout"]
    
    if request.url.path in public_routes or request.url.path.startswith("/static"):
        return await call_next(request)
    
    session_vendeur = request.cookies.get("session_vendeur")
    if not session_vendeur:
        if request.url.path.startswith("/api"):
            return JSONResponse({"detail": "Non connecté"}, status_code=401)
        return RedirectResponse("/auth")
    
    request.state.vendeur = session_vendeur
    return await call_next(request)

# Templates et fichiers statiques
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Routes pages ---
@app.get("/")
async def home(request: Request):
    return RedirectResponse("/auth")

@app.get("/auth")
async def auth_page(request: Request):
    return templates.TemplateResponse(request=request, name="auth.html")

@app.get("/vendeur/dashboard")
async def vendeur_dashboard(request: Request):
    return templates.TemplateResponse(request=request, name="vendeur_dashboard.html")

@app.get("/client/shop")
async def client_shop(request: Request, client_id: str = None):
    client_id_cookie = request.cookies.get("selected_client")
    client_id = client_id or client_id_cookie
    
    client = None
    if client_id:
        client = ClientRepository.get_by_id(int(client_id))
    
    return templates.TemplateResponse(
        request=request,
        name="client_shop.html",
        context={"client": client}
    )

@app.get("/client/basket")
async def client_basket(request: Request):
    client_id = request.cookies.get("selected_client")
    client = None
    if client_id:
        client = ClientRepository.get_by_id(int(client_id))
    return templates.TemplateResponse(
        request=request, 
        name="client_basket.html",
        context={"client": client}
    )

# --- API Authentification ---
@app.post("/api/auth/login")
async def login(request: Request):
    try:
        body = await request.json()
        username = body.get("username")
        password = body.get("password")
        
        user = UserRepository.authenticate(username, password, bcrypt)
        
        if not user:
            return JSONResponse({"success": False, "error": "Identifiants invalides"}, status_code=401)
        
        if user["role"] != "vendeur":
            return JSONResponse({"success": False, "error": "Accès réservé aux vendeurs"}, status_code=403)
        
        response = JSONResponse({"success": True, "redirect": "/vendeur/dashboard"})
        response.set_cookie(key="session_vendeur", value=username, httponly=True, max_age=3600*8)
        return response
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)

@app.post("/api/auth/logout")
async def logout():
    response = JSONResponse({"success": True})
    response.delete_cookie("session_vendeur")
    response.delete_cookie("selected_client")
    return response

# --- API Clients ---
@app.get("/api/clients")
async def get_clients():
    return JSONResponse(ClientRepository.get_all())

@app.get("/api/clients/{client_id}")
async def get_client(client_id: int):
    client = ClientRepository.get_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return JSONResponse(client)

@app.post("/api/clients/select")
async def select_client(request: Request):
    body = await request.json()
    client_id = body.get("client_id")
    client = ClientRepository.get_by_id(int(client_id))
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    response = JSONResponse({"success": True, "client": client})
    response.set_cookie(key="selected_client", value=str(client_id), httponly=True, max_age=3600*8)
    return response

@app.post("/api/clients")
async def create_client(request: Request):
    body = await request.json()
    new_client = ClientRepository.create(body)
    return JSONResponse(new_client, status_code=201)

# --- API Catalogue ---
@app.get("/api/catalogue")
async def get_catalogue():
    return JSONResponse(BroomRepository.get_all())

@app.get("/api/catalogue/{broom_id}")
async def get_broom(broom_id: int):
    broom = BroomRepository.get_by_id(broom_id)
    if not broom:
        raise HTTPException(status_code=404, detail="Balai non trouvé")
    return JSONResponse(broom)

# --- API Réservations ---
@app.get("/api/reservations")
async def get_reservations():
    return JSONResponse(ReservationRepository.get_all())

@app.get("/api/reservations/client/{client_id}")
async def get_reservations_by_client(client_id: int):
    return JSONResponse(ReservationRepository.get_by_client(client_id))

@app.get("/api/reservations/check")
async def check_availability(broomId: int, startDate: str, endDate: str):
    try:
        available, conflict = ReservationRepository.check_availability(broomId, startDate, endDate)
        
        if available:
            return JSONResponse({"available": True, "message": "Balai disponible"})
        else:
            return JSONResponse({
                "available": False,
                "message": "Balai déjà réservé sur cette période",
                "conflictStart": conflict["startDate"],
                "conflictEnd": conflict["endDate"]
            })
    except Exception as e:
        return JSONResponse({"available": False, "message": f"Erreur: {str(e)}"}, status_code=400)

@app.post("/api/reservations")
async def create_reservation(reservation: Reservation):
    available, _ = ReservationRepository.check_availability(
        reservation.broomId, reservation.startDate, reservation.endDate
    )
    
    if not available:
        raise HTTPException(status_code=409, detail="Balai déjà réservé sur cette période")
    
    new_reservation = ReservationRepository.create(reservation)
    return JSONResponse(new_reservation, status_code=201)

@app.delete("/api/reservations/{reservation_id}")
async def delete_reservation(reservation_id: int):
    deleted = ReservationRepository.delete(reservation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Réservation non trouvée")
    return JSONResponse({"message": "Réservation annulée"})

# --- API Commandes ---
@app.post("/api/commandes")
async def create_commande(request: Request):
    body = await request.json()
    nouvelle_commande = CommandeRepository.create(body)
    return JSONResponse(nouvelle_commande, status_code=201)

@app.get("/api/commandes/client/{client_id}")
async def get_commandes_client(client_id: int):
    return JSONResponse(CommandeRepository.get_by_client(client_id))

@app.get("/api/commandes")
async def get_all_commandes():
    return JSONResponse(CommandeRepository.get_all())

# --- Lancement ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

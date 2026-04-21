from os import getenv
from datetime import date
import uvicorn
import bcrypt
from fastapi import FastAPI, HTTPException, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles


from BD.dao import DAO
from BD.models import (
    Employee, Client, Reservation, SorcierDetails, MolduDetails, Address,
    LoginRequest, SelectClientRequest, SelectVendeurRequest, CreateCommandeRequest
)
from utils.auth import require_role
from utils.jwt_token import create_access_token, verify_token

# Création de l'instance FastAPI
app = FastAPI()
security = HTTPBearer()

# Initialisation du DAO
dao = DAO("BD/database.db")

# Autoriser les requêtes depuis le front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# --- Middleware d'authentification ---
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    public_routes = ["/", "/auth", "/api/login"]
    
    request.state.user = None
    request.state.user_role = None
    request.state.user_id = None
    
    # Routes publiques ou fichiers statiques
    if request.url.path in public_routes or request.url.path.startswith("/static"):
        return await call_next(request)
    
    session_user = request.cookies.get("userID")
    
    if not session_user:
        if request.url.path.startswith("/api") and not request.url.path.startswith("/api/login"):
            return JSONResponse(content={"message": "Not connected"}, status_code=401)
        return RedirectResponse("/auth")
    
    payload = verify_token(session_user)
    if not payload:
        response = RedirectResponse("/auth")
        response.delete_cookie("userID")
        return response
    
    # Stocker les infos utilisateur dans la requête
    request.state.user = payload.get("username")
    request.state.user_role = "admin" if payload.get("admin") else "vendeur"
    request.state.user_id = payload.get("user_id")
    
    try:
        response = await call_next(request)
    except Exception as e:
        raise e
    
    return response


# --- Templates ---
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# --- Routes HTML ---
@app.get("/")
async def home():
    return RedirectResponse("/auth")


@app.get("/auth")
async def authentification(request: Request):
    return templates.TemplateResponse(
        name="auth.html", 
        context={"user": request.state.user, "role": request.state.user_role},
        request=request
    )


@app.get("/dashboard")
async def dashboard(request: Request):
    return templates.TemplateResponse(name="dashboard.html", request=request)


@app.get("/shop")
async def shop(request: Request):
    client_id = request.cookies.get("clientID")
    client = None
    if client_id:
        client = dao.get_client_by_id(int(client_id))
        if not client:
            return templates.TemplateResponse(
                request=request,
                name="dashboard.html",
                context={"error": "Client Selection Expired"}
            )
    
    return templates.TemplateResponse(
        request=request,
        name="shop.html",
        context={"client": client}
    )


@app.get("/basket")
async def basket(request: Request):
    client_id = request.cookies.get("clientID")
    client = None
    if client_id:
        client = dao.get_client_by_id(int(client_id))
    
    return templates.TemplateResponse(
        request=request,
        name="basket.html",
        context={"client": client}
    )


@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/auth")
    response.delete_cookie("userID")
    response.delete_cookie("clientID")
    response.delete_cookie("vendeurID")
    dao.logout(id)
    return response


# --- API Register ---

@app.post("/api/register/employee")
@require_role(["admin"])
async def register_employee(request: Request, employee: Employee):
    """
    Inscription d'un nouvel employé (admin uniquement)
    """
    # Vérifier si l'email existe déjà
    if dao.get_employee_by_email(employee.mail):
        raise HTTPException(status_code=400, detail="Email already used")
    
    # Vérifier si le login existe déjà
    if dao.get_employee_by_login(employee.username):
        raise HTTPException(status_code=400, detail="Username already used")
    
    # Vérifier le nombre de téléphones
    if len(employee.phone) < 1:
        raise HTTPException(status_code=400, detail="Phone number needed")
    if len(employee.phone) > 3:
        raise HTTPException(status_code=400, detail="Too many phone numbers given")
    
    # Hasher le mot de passe
    hashed_password = bcrypt.hashpw(employee.password.encode('utf-8'), bcrypt.gensalt())
    
    # Créer le nouvel employé
    new_employee = Employee(
        username=employee.username,
        password=hashed_password.decode('utf-8'),
        actif=True,
        name=employee.name,
        surname=employee.surname,
        mail=employee.mail,
        phone=employee.phone,
        is_admin=employee.is_admin,
        id_patron=request.state.user_id if not employee.is_admin else None
    )
    
    success = dao.create_employee(new_employee)
    if not success:
        raise HTTPException(status_code=500, detail="Error creating employee")
    
    return {"message": "Registration successful", "username": employee.username}


@app.post("/api/register/client")
async def register_client(request: Request, client_data: dict):
    """
    Inscription d'un nouveau client (sorcier ou moldu)
    """
    # Construire l'objet Client
    client = Client(
        name=client_data.get("name"),
        surname=client_data.get("surname"),
        birth_date=date.fromisoformat(client_data.get("birth_date")),
        money=client_data.get("money", 0),
        type_client=client_data.get("type_client"),
        telephones=client_data.get("telephones", []),
        id_employee=request.state.user_id,
    )
    
    # Ajouter les détails spécifiques
    if client.type_client == "sorcier" and client_data.get("sorcier"):
        sorcier_data = client_data["sorcier"]
        client.sorcier = SorcierDetails(
            wizard_registry_number=sorcier_data["wizard_registry_number"],
            chimney=sorcier_data["chimney"],
            add_school_name=sorcier_data["add_school_name"],
            add_house=sorcier_data["add_house"],
            add_country=sorcier_data.get("add_country", "United Kingdom"),
            flight_licence=sorcier_data.get("flight_licence", 0),
            owls=sorcier_data.get("owls", [])
        )
    
    elif client.type_client == "moldu" and client_data.get("moldu"):
        moldu_data = client_data["moldu"]
        client.moldu = MolduDetails(
            national_register_number=moldu_data["national_register_number"],
            mail=moldu_data["mail"],
            address=Address(
                street=moldu_data["add_street"],
                city=moldu_data["add_city"],
                house_number=moldu_data["add_house_number"],
                country=moldu_data.get("add_country", "United Kingdom")
            ),
            telephones=client.telephones
        )
    
    success = dao.add_client(client)
    if not success:
        raise HTTPException(status_code=500, detail="Error creating client")
    
    return {"message": "Registration successful", "name": client.name}


# --- API Login ---

@app.post("/api/login")
async def login(login_data: LoginRequest):
    """
    Authentification d'un employé
    """
    # Récupérer l'employé par email ou login
    employee = dao.get_employee_by_email(login_data.mail)
    if not employee:
        employee = dao.get_employee_by_login(login_data.username)
    
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Vérifier le mot de passe
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), employee['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect Password")
    
    # Vérifier si le compte est actif
    if bool(employee['actif']) is False:
        raise HTTPException(status_code=401, detail="You are already connected elsewhere")
    
    dao.login(employee['id_employee'])

    # Créer le token JWT
    jwt_token = create_access_token(data={
        "username": employee['login'],
        "user_id": employee['id_employee'],
        "mail": employee['mail_pro'],
        "admin": employee['is_patron'] == '1'
    })

    
    
    response = JSONResponse(content={
        "success": True,
        "message": "Login successful",
        "username": employee['login'],
        "role": "admin" if employee['is_patron'] == '1' else "vendeur"
    })
    
    response.set_cookie(
        key="userID",
        value=jwt_token,
        httponly=True,
        secure=False,  # True en production avec HTTPS
        max_age=int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES",60))* 60,
        samesite="lax",
        path="/"
    )
    
    return response


# --- API Client ---

@app.get("/api/clients")
async def get_clients():
    """Récupère tous les clients"""
    clients = dao.get_all_clients()
    if not clients:
        raise HTTPException(status_code=404, detail="Clients not found")
    
    return JSONResponse({"success": True, "clients": clients})


@app.post("/api/clients/select")
async def select_client(request: Request, select_data: SelectClientRequest):
    """Sélectionne un client pour la session"""
    client = dao.get_client_by_id(select_data.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    response = JSONResponse({"success": True, "client": client})
    response.set_cookie(key="clientID", value=str(select_data.client_id), httponly=True, max_age=3600)
    return response


@app.put("/api/modify/client")
async def modify_client(client_data: dict):
    """Modifie un client existant"""
    client = Client(
        id_client=client_data.get("id_client"),
        name=client_data.get("name"),
        surname=client_data.get("surname"),
        birth_date=date.fromisoformat(client_data.get("birth_date")),
        money=client_data.get("money", 0),
        type_client=client_data.get("type_client"),
        telephones=client_data.get("telephones", [])
    )
    
    # Ajouter les détails spécifiques
    if client.type_client == "sorcier" and client_data.get("sorcier"):
        sorcier_data = client_data["sorcier"]
        client.sorcier = SorcierDetails(
            wizard_registry_number=sorcier_data["wizard_registry_number"],
            chimney=sorcier_data["chimney"],
            add_school_name=sorcier_data["add_school_name"],
            add_house=sorcier_data["add_house"],
            add_country=sorcier_data.get("add_country", "United Kingdom"),
            flight_licence=sorcier_data.get("flight_licence", 0),
            owls=sorcier_data.get("owls", [])
        )
    
    elif client.type_client == "moldu" and client_data.get("moldu"):
        moldu_data = client_data["moldu"]
        client.moldu = MolduDetails(
            national_register_number=moldu_data["national_register_number"],
            mail=moldu_data["mail"],
            address=Address(
                street=moldu_data["add_street"],
                city=moldu_data["add_city"],
                house_number=moldu_data["add_house_number"],
                country=moldu_data.get("add_country", "United Kingdom")
            ),
            telephones=client.telephones
        )
    
    success = dao.modify_client(client)
    if not success:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return JSONResponse({"success": True, "message": f"Client {client.name} modified successfully"})


@app.delete("/api/delete/client/{client_id}")
async def delete_client(request: Request, client_id: int):
    """Supprime un client"""
    client = dao.get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Vérifier si c'est le client sélectionné
    selected_client = request.cookies.get("clientID")
    if selected_client and int(selected_client) == client_id:
        # Supprimer le cookie
        response = JSONResponse({"success": True, "message": f"Client {client_id} successfully deleted"})
        response.delete_cookie("clientID")
        dao.delete_client_by_id(client_id)
        return response
    
    success = dao.delete_client_by_id(client_id)
    if not success:
        raise HTTPException(status_code=500, detail="Error deleting client")
    
    return JSONResponse({"success": True, "message": f"Client {client_id} successfully deleted"})


# --- API Vendeur ---

@app.get("/api/vendeurs")
@require_role(["admin"])
async def get_vendeurs(request : Request):
    """Récupère tous les vendeurs"""
    vendeurs = dao.get_all_vendeurs(request.state.user_id)
    if not vendeurs:
        raise HTTPException(status_code=404, detail="Salespersons not found")
    
    return JSONResponse({"success": True, "vendeurs": vendeurs})


@app.post("/api/vendeurs/select")
@require_role(["admin"])
async def select_vendeur(request: Request, select_data: SelectVendeurRequest):
    """Sélectionne un vendeur pour la session"""
    vendeur = dao.get_vendeur_by_id(select_data.vendeurs_id)
    if not vendeur:
        raise HTTPException(status_code=404, detail="Salesperson not found")
    
    response = JSONResponse({"success": True, "vendeur": vendeur})
    response.set_cookie(key="vendeurID", value=str(select_data.vendeurs_id), httponly=True, max_age=3600)
    return response


@app.put("/api/modify/vendeur")
@require_role(["admin"])
async def modify_vendeur(vendeur: Employee):
    """Modifie un vendeur"""
    success = dao.modify_vendeur(vendeur)
    if not success:
        raise HTTPException(status_code=404, detail="Vendeur not found")
    
    return JSONResponse({"success": True, "message": f"Vendeur {vendeur.name} modified successfully"})


@app.delete("/api/delete/vendeurs/{vendeurs_id}")
@require_role(["admin"])
async def delete_vendeur(request: Request, vendeurs_id: int):
    """Supprime un vendeur"""
    vendeur = dao.get_vendeur_by_id(vendeurs_id)
    if not vendeur:
        raise HTTPException(status_code=404, detail="Salesperson not found")
    
    # Vérifier si c'est le vendeur sélectionné
    selected_vendeur = request.cookies.get("vendeurID")
    if selected_vendeur and int(selected_vendeur) == vendeurs_id:
        response = JSONResponse({"success": True, "message": f"Salesperson {vendeurs_id} successfully deleted"})
        response.delete_cookie("vendeurID")
        dao.delete_vendeur_by_id(vendeurs_id)
        return response
    
    success = dao.delete_vendeur_by_id(vendeurs_id)
    if not success:
        raise HTTPException(status_code=500, detail="Error deleting salesperson")
    
    return JSONResponse({"success": True, "message": f"Salesperson {vendeurs_id} successfully deleted"})


# --- API Catalogue ---

@app.get("/api/catalogue")
async def get_catalogue(request: Request):
    """Récupère le catalogue des balais visibles par le client sélectionné"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    client = dao.get_client_by_id(int(client_id))
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    brooms = dao.get_client_visible_brooms(int(client_id))
    return JSONResponse(brooms)


@app.get("/api/catalogue/{broom_id}")
async def get_broom(broom_id: int):
    """Récupère les détails d'un balai spécifique"""
    broom = dao.get_broom_by_id(broom_id)
    if not broom:
        raise HTTPException(status_code=404, detail="Broom not found")
    return JSONResponse(broom)


# --- API Reservation (Location) ---

@app.get("/api/reservations")
@require_role(["admin"])
async def get_reservations():
    """Récupère toutes les locations"""
    return JSONResponse(dao.get_all_reservations())


@app.get("/api/reservations/client")
async def get_reservations_by_client(request: Request):
    """Récupère les locations du client sélectionné"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    return JSONResponse(dao.get_client_reservations(int(client_id)))


@app.get("/api/reservations/vendeur")
@require_role(["vendeur", "admin"])
async def get_reservations_by_vendeur(request: Request):
    """Récupère les locations gérées par le vendeur sélectionné"""
    vendeur_id = request.cookies.get("vendeurID")
    
    if not vendeur_id:
        raise HTTPException(status_code=400, detail="No salesperson selected")
    
    return JSONResponse(dao.get_vendeur_reservations(int(vendeur_id)))


@app.get("/api/reservations/check")
async def check_availability(broom_id: int, start_date: str, end_date: str):
    """Vérifie la disponibilité d'un balai"""
    try:
        available, conflict_date = dao.check_broom_availability(broom_id, start_date, end_date)
        
        if available:
            return JSONResponse({"available": True, "message": "Broom available"})
        else:
            return JSONResponse({
                "available": False,
                "message": "This broom is already booked",
                "conflictStart": conflict_date["startDate"],
                "conflictEnd": conflict_date["endDate"]
            })
    except Exception as e:
        return JSONResponse({"available": False, "message": f"Error: {str(e)}"}, status_code=400)


@app.post("/api/reservations")
async def create_reservation(request: Request, reservation: Reservation):
    """Crée une nouvelle location"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    # Vérifier la disponibilité
    available, _ = dao.check_broom_availability(reservation.broomId, reservation.startDate, reservation.endDate)
    
    if not available:
        raise HTTPException(status_code=409, detail="This broom is already booked for this period")
    
    try:
        success = dao.add_reservation(int(client_id), request.state.user_id, reservation)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create reservation")
        return JSONResponse({"message": "Booking made"}, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A problem occurred during the booking: {str(e)}")


@app.delete("/api/reservations/{reservation_id}")
async def delete_reservation(reservation_id: int):
    """Annule une location"""
    deleted = dao.delete_reservation(reservation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking not found")
    return JSONResponse({"message": "Booking canceled"})


# --- API Commande (Vente) ---

@app.get("/api/commandes")
@require_role(["admin"])
async def get_all_commandes():
    """Récupère toutes les commandes"""
    return JSONResponse(dao.get_all_commandes())


@app.get("/api/commandes/client")
async def get_commandes_client(request: Request):
    """Récupère les commandes du client sélectionné"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    return JSONResponse(dao.get_client_commandes(int(client_id)))


@app.get("/api/commandes/vendeur")
@require_role(["vendeur", "admin"])
async def get_commandes_vendeur(request: Request):
    """Récupère les commandes gérées par le vendeur sélectionné"""
    vendeur_id = request.cookies.get("vendeurID")
    
    if not vendeur_id:
        raise HTTPException(status_code=400, detail="No salesperson selected")
    
    return JSONResponse(dao.get_client_commandes(int(vendeur_id)))  # Note: à adapter selon votre DAO


@app.post("/api/commandes")
async def create_commande(request: Request, commande_data: CreateCommandeRequest):
    """Crée une nouvelle commande d'achat"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    try:
        commande_dict = {
            "employee_id": request.state.user_id,
            "client_id": int(client_id),
            "sale_date": commande_data.sale_date,
            "broom_ids": commande_data.broom_ids
        }
        success = dao.add_commandes(commande_dict)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create order")
        return JSONResponse({"message": "Order made"}, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A problem occurred during the order processing: {str(e)}")


# --- Lancement ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
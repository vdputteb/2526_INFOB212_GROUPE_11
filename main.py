from os import getenv
from datetime import date, timedelta
from dotenv import load_dotenv
import pymysql
import uvicorn
import bcrypt
from fastapi import FastAPI, HTTPException, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from BD.dao_mysql import DAOMySQL
from BD.models import (
    Employee, Client, Location, SorcierDetails, MolduDetails, Address,
    LoginRequest, SelectClientRequest, SelectVendeurRequest, CreateCommandeRequest
)
from utils.auth import require_role
from utils.jwt_token import create_access_token, verify_token

# Création de l'instance FastAPI
load_dotenv()
app = FastAPI()
security = HTTPBearer()

# Initialisation du DAO

dao = DAOMySQL(getenv("DB_HOST"),int(getenv("DB_PORT")),getenv("DB_USER"),getenv("DB_PASSWORD"),getenv("DB_NAME"))

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
    request.state.password = payload.get("password")

    try:
        response = await call_next(request)
    except Exception as e:
        raise e

    jwt_token = create_access_token(payload)
    response.set_cookie(
        key="userID",
        value=jwt_token,
        httponly=True,
        secure=False,  # True en production avec HTTPS
        max_age=int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES")) * 60,
        samesite="lax",
        path="/"
    )

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
    # Vérifier si l'utilisateur est admin
    is_admin = request.state.user_role == "admin"
    return templates.TemplateResponse(
        name="dashboard.html",
        request=request,
        context={"is_admin": is_admin}
    )


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


@app.get("/profile")
async def profile(request: Request):
    is_admin = request.state.user_role == "admin"
    return templates.TemplateResponse(
        request=request,
        name="profile.html",
        context={"is_admin": is_admin}
    )


@app.get("/stats")
@require_role(["admin"])
async def stat(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="stat.html",
    )


@app.get("/logout")
async def logout(request: Request):
    response = RedirectResponse(url="/auth")
    response.delete_cookie("userID")
    response.delete_cookie("clientID")
    response.delete_cookie("vendeurID")
    dao.logout(request.state.user_id)
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
        telephones=client_data.get("telephones", []),
        id_employee=request.state.user_id,
    )

    # Ajouter les détails spécifiques
    if  client_data.get("sorcier"):
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

    if  client_data.get("moldu"):
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
    if employee['actif'] == '1':
        raise HTTPException(status_code=401, detail="You are already connected elsewhere")
    
    dao.login(employee['id_employee'])

    # Vérifier si c'est un patron (admin)
    is_patron = employee['id_patron'] is None
    
    # Créer le token JWT
    jwt_token = create_access_token(data={
        "username": employee['login'],
        "user_id": employee['id_employee'],
        "mail": employee['mail_pro'],
        "admin": is_patron,
        "password": employee['password']
    })
    
    response = JSONResponse(content={
        "success": True,
        "message": "Login successful",
        "username": employee['login'],
        "role": "admin" if is_patron else "vendeur"
    })
    
    response.set_cookie(
        key="userID",
        value=jwt_token,
        httponly=True,
        secure=False,  # True en production avec HTTPS
        max_age=int(getenv("ACCESS_TOKEN_EXPIRE_MINUTES")) * 60,
        samesite="lax",
        path="/"
    )
    
    return response


# --- API Client ---

@app.get("/api/clients")
async def get_clients(request: Request):
    """Récupère tous les clients"""
    clients = dao.get_all_clients()
    if not clients:
        raise HTTPException(status_code=404, detail="Clients not found")
    
    return JSONResponse({"success": True, "clients": clients})


@app.post("/api/clients/select")
async def select_client(select_data: SelectClientRequest):
    """Sélectionne un client pour la session"""
    client = dao.get_client_by_id(select_data.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    response = JSONResponse({"success": True, "client": client})
    response.set_cookie(key="clientID", value=str(select_data.client_id), httponly=True, max_age=3600)
    return response


@app.put("/api/modify/client")
async def modify_client(request: Request, client_data: dict):
    """Modifie un client existant"""
    try:
        # Récupérer le client existant
        existing_client = dao.get_client_by_id(client_data.get("id_client"))
        if not existing_client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Créer l'objet Client avec toutes les informations
        client = Client(
            id_client=client_data.get("id_client"),
            name=client_data.get("name"),
            surname=client_data.get("surname"),
            birth_date=date.fromisoformat(client_data.get("birth_date")),
            money=client_data.get("money", 0),
            id_employee=request.state.user_id
        )
        # Ajouter les détails spécifiques
        if  client_data.get("sorcier"):
            sorcier_data = client_data["sorcier"]
            client.sorcier = SorcierDetails(
                wizard_registry_number=sorcier_data.get("wizard_registry_number"),
                chimney=sorcier_data.get("chimney"),
                add_school_name=sorcier_data.get("add_school_name"),
                add_house=sorcier_data.get("add_house"),
                add_country=sorcier_data.get("add_country"),
                flight_licence=sorcier_data.get("flight_licence", 0),
                owls=sorcier_data.get("owls", [])
            )

        if client_data.get("moldu"):
            moldu_data = client_data["moldu"]
            client.moldu = MolduDetails(
                national_register_number=moldu_data.get("national_register_number"),
                mail=moldu_data.get("mail"),
                address=Address(
                    street=moldu_data.get("add_street"),
                    city=moldu_data.get("add_city"),
                    house_number=moldu_data.get("add_house_number"),
                    country=moldu_data.get("add_country")
                ),
                telephones=moldu_data.get("telephones", [])
            )
        
        success = dao.modify_client(client)
        if not success:
            raise HTTPException(status_code=404, detail="Failed to modify client")

        return JSONResponse({"success": True, "message": f"Client {client.name} modified successfully"})
    except Exception as e:
        print(f"Erreur modification client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
async def get_vendeurs(request: Request):
    """Récupère tous les vendeurs"""
    vendeurs = dao.get_all_vendeurs(request.state.user_id)
    if not vendeurs:
        return JSONResponse({"success": True, "vendeurs": []})
    
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
async def modify_vendeur(request: Request, vendeur_data: dict):
    """
    Modifie un vendeur (le mot de passe est optionnel)
    """
    # Extraire les données
    vendeur_id = vendeur_data.get("id_employee")
    if not vendeur_id:
        raise HTTPException(status_code=400, detail="Vendeur ID required")
    
    # Récupérer le vendeur existant
    existing_vendeur = dao.get_vendeur_by_id(vendeur_id)
    if not existing_vendeur:
        raise HTTPException(status_code=404, detail="Vendeur not found")
    
    # Mettre à jour uniquement les champs fournis
    update_data = {}
    
    if "name" in vendeur_data:
        update_data["name"] = vendeur_data["name"]
    if "surname" in vendeur_data:
        update_data["surname"] = vendeur_data["surname"]
    if "mail" in vendeur_data:
        update_data["mail_pro"] = vendeur_data["mail"]
    if "username" in vendeur_data:
        update_data["login"] = vendeur_data["username"]
    
    # Téléphones
    if "phone" in vendeur_data:
        phones = vendeur_data["phone"]
        update_data["tel1"] = None
        update_data["tel2"] = None
        update_data["tel3"] = None
        for i, phone in enumerate(phones[:3], 1):
            if phone and phone.strip():
                update_data[f"tel{i}"] = phone.strip()
    
    # Mot de passe (optionnel)
    if "password" in vendeur_data and vendeur_data["password"]:
        hashed_password = bcrypt.hashpw(vendeur_data["password"].encode('utf-8'), bcrypt.gensalt())
        update_data["password"] = hashed_password.decode('utf-8')
    
    if not update_data:
        return JSONResponse({"success": True, "message": "No changes to apply"})
    
    success = dao.modify_vendeur_partial(vendeur_id, update_data)
    if success:
        return JSONResponse({"success": True, "message": "Vendeur modified successfully"})
    else:
        raise HTTPException(status_code=500, detail="Failed to modify vendeur")


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


# --- API Balai ---

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
async def get_broom(request: Request, broom_id: int):
    """Récupère les détails d'un balai spécifique"""
    broom = dao.get_broom_by_id(broom_id)
    if not broom:
        raise HTTPException(status_code=404, detail="Broom not found")
    return JSONResponse(broom)


@app.get("/api/balais/all")
async def get_all_brooms(request: Request):
    """Récupère tous les balais (pour le formulaire de commande fournisseur)"""
    brooms = dao.get_all_brooms()
    return JSONResponse({"success": True, "balais": brooms})


@app.get("/api/balais/available")
async def get_available_brooms(request: Request):
    """Récupère tous les balais disponibles"""
    brooms = dao.get_available_brooms()
    return JSONResponse({"success": True, "balais": brooms})


# --- API Location ---

@app.get("/api/locations")
@require_role(["admin"])
async def get_locations(request: Request):
    """Récupère toutes les locations"""
    return JSONResponse(dao.get_all_locations())


@app.get("/api/locations/client")
async def get_locations_by_client(request: Request):
    """Récupère les locations du client sélectionné"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    return JSONResponse(dao.get_client_locations(int(client_id)))


@app.get("/api/locations/vendeur")
async def get_locations_by_vendeur(request: Request):
    """Récupère les locations gérées par le vendeur sélectionné"""
    vendeur_id = request.cookies.get("vendeurID")
    
    if not vendeur_id:
        raise HTTPException(status_code=400, detail="No salesperson selected")
    
    return JSONResponse(dao.get_vendeur_locations(int(vendeur_id)))


@app.get("/api/locations/check")
async def check_availability(request: Request, broom_id: int, start_date: str, end_date: str):
    """Vérifie la disponibilité d'un balai"""
    try:
        available, conflict_date = dao.check_broom_availability(broom_id, start_date, end_date)
        
        if available:
            return JSONResponse({"available": True, "message": "Broom available"})
        else:
            return JSONResponse({
                "available": False,
                "message": "This broom is already booked",
                "conflictStart": conflict_date["startDate"] if conflict_date else None,
                "conflictEnd": conflict_date["endDate"] if conflict_date else None
            })
    except Exception as e:
        return JSONResponse({"available": False, "message": f"Error: {str(e)}"}, status_code=400)


@app.post("/api/locations/validate-return")
async def validate_return_location(request: Request, return_data: dict):
    """Valide le retour d'un balai en location"""
    commande_id = return_data.get("commandeId")
    actual_end_date = return_data.get("actual_end_date")
    
    success = dao.validate_location_return(commande_id, actual_end_date)
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la validation du retour")
    
    return JSONResponse({"success": True, "message": "Retour validé"})


@app.post("/api/locations")
async def create_reservation(request: Request, reservation: Location):
    """Crée une nouvelle location"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    # Vérifier la disponibilité
    available, _ = dao.check_broom_availability(reservation.broomId, reservation.startDate, reservation.endDate)
    
    if not available:
        raise HTTPException(status_code=409, detail="This broom is already booked for this period")
    
    try:
        success = dao.add_location(int(client_id), request.state.user_id, reservation)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create reservation")
        return JSONResponse({"message": "Booking made"}, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A problem occurred during the booking: {str(e)}")


@app.delete("/api/locations/{reservation_id}")
async def delete_reservation(request: Request, reservation_id: int):
    """Annule une location"""
    deleted = dao.delete_location(reservation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking not found")
    return JSONResponse({"message": "Booking canceled"})


# --- API Vente ---

@app.get("/api/ventes")
@require_role(["admin"])
async def get_all_ventes(request: Request):
    """Récupère toutes les ventes"""
    return JSONResponse(dao.get_all_ventes())


@app.get("/api/ventes/client")
async def get_ventes_client(request: Request):
    """Récupère les ventes du client sélectionné"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    return JSONResponse(dao.get_client_ventes(int(client_id)))


@app.get("/api/ventes/vendeur")
async def get_ventes_vendeur(request: Request):
    """Récupère les ventes gérées par le vendeur sélectionné"""
    vendeur_id = request.cookies.get("vendeurID")
    
    if not vendeur_id:
        raise HTTPException(status_code=400, detail="No salesperson selected")
    
    return JSONResponse(dao.get_vendeur_ventes(int(vendeur_id)))


@app.get("/api/ventes/client/detail/{commande_id}")
async def get_vente_detail(request: Request, commande_id: int):
    """Récupère les détails d'une commande client"""
    client_id = request.cookies.get("clientID")
    
    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")
    
    vente_detail = dao.get_vente_detail(commande_id, int(client_id))
    if not vente_detail:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    return JSONResponse(vente_detail)


@app.post("/api/ventes")
async def create_commande(request: Request, commande_data: CreateCommandeRequest):
    """Crée une nouvelle commande d'achat"""
    client_id = request.cookies.get("clientID")

    if not client_id:
        raise HTTPException(status_code=400, detail="No client selected")

    # Vérifier que tous les balais sont disponibles
    for broom_id in commande_data.broom_ids:
        broom = dao.get_broom_by_id(broom_id)
        if not broom or broom['status'] != 'in stock':
            raise HTTPException(status_code=409, detail=f"Broom {broom_id} is not available")

    try:
        success = dao.add_vente(request.state.user_id, int(client_id), commande_data.broom_ids)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create order")
        return JSONResponse({"message": "Order made"}, status_code=201)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"A problem occurred during the order processing: {str(e)}")


@app.delete("/api/ventes/{vente_id}")
async def delete_vente(request: Request, vente_id: int):
    """Supprime une vente et rembourse le client"""
    # Vérifier si la vente existe
    vente = dao.get_vente_by_id(vente_id)
    if not vente:
        raise HTTPException(status_code=404, detail="Vente non trouvée")
    
    success = dao.delete_vente(vente_id)
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression de la vente")
    
    return JSONResponse({"success": True, "message": "Vente supprimée avec succès et client remboursé"})


# --- API Profil ---

@app.get("/api/me")
async def get_current_user(request: Request):
    """Récupère les informations de l'utilisateur connecté"""
    employee = dao.get_vendeur_by_id(request.state.user_id)
    if not employee:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_admin = employee['id_patron'] is None
    
    return JSONResponse({
        "success": True,
        "user": {
            "id_employee": employee['id_employee'],
            "name": employee['name'],
            "surname": employee['surname'],
            "login": employee['login'],
            "mail": employee['mail_pro'],
            "is_admin": is_admin,
            "telephones": [employee.get('tel1'), employee.get('tel2'), employee.get('tel3')]
        }
    })


@app.get("/api/profile/ventes")
async def get_profile_ventes(request: Request, page: int = 1, per_page: int = 10):
    """Récupère les ventes de l'utilisateur connecté"""
    ventes = dao.get_vendeur_ventes(request.state.user_id)
    
    total = len(ventes)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = ventes[start:end]
    
    return JSONResponse({
        "success": True,
        "ventes": paginated,
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total > 0 else 1
        }
    })


@app.get("/api/profile/locations")
async def get_profile_locations(request: Request, page: int = 1, per_page: int = 10):
    """Récupère les locations gérées par l'utilisateur"""
    locations = dao.get_vendeur_locations(request.state.user_id)
    
    total = len(locations)
    start = (page - 1) * per_page
    end = start + per_page
    
    return JSONResponse({
        "success": True,
        "locations": locations[start:end],
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total > 0 else 1
        }
    })


# --- API Commande Fournisseur ---

@app.get("/api/fournisseurs")
async def get_fournisseurs(request: Request):
    """Récupère la liste des fournisseurs"""
    fournisseurs = dao.get_all_fabricants()
    return JSONResponse({"success": True, "fournisseurs": fournisseurs})


@app.post("/api/commandes-fournisseur")
async def create_commande_fournisseur(request: Request, commande_data: dict):
    """Crée une commande fournisseur"""
    data = {
        "vendeur_id": request.state.user_id,
        "fournisseur_id": commande_data.get("fournisseur_id"),
        "command_date": commande_data.get("command_date"),
        "expected_delivery_date": commande_data.get("expected_delivery_date"),
        "items": commande_data.get("items", [])
    }
    
    # Validation : vérifier que tous les balais existent
    for item in data["items"]:
        broom = dao.get_broom_by_id(item["broom_id"])
        if not broom:
            raise HTTPException(status_code=400, detail=f"Le balai {item['broom_id']} n'existe pas")
        if broom["id_fabricant"] != data["fournisseur_id"]:
            raise HTTPException(status_code=400, detail=f"Le balai {item['broom_id']} n'appartient pas au fournisseur sélectionné")
    
    success = dao.create_commande_fournisseur(data)
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la création")
    
    return JSONResponse({"success": True, "message": "Commande créée"})


@app.get("/api/profile/commandes-fournisseur")
async def get_profile_commandes_fournisseur(request: Request, page: int = 1, per_page: int = 10):
    """Récupère les commandes fournisseur de l'utilisateur"""
    commandes = dao.get_vendeur_commandes_fournisseur(request.state.user_id)
    
    total = len(commandes)
    start = (page - 1) * per_page
    end = start + per_page
    
    return JSONResponse({
        "success": True,
        "commandes": commandes[start:end],
        "pagination": {
            "current_page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total > 0 else 1
        }
    })


@app.get("/api/profile/pending-approvals")
@require_role(["admin"])
async def get_pending_approvals(request: Request):
    """Récupère les commandes fournisseur en attente d'approbation (admin uniquement)"""
    commandes = dao.get_pending_approvals()
    return JSONResponse({"success": True, "commandes": commandes})


@app.put("/api/commandes-fournisseur/approve")
@require_role(["admin"])
async def approve_commande_fournisseur(request: Request):
    """Approuve ou modifie le statut d'une commande fournisseur (admin uniquement)"""
    approve_data = await request.json()
    commande_id = approve_data.get("commandeId")
    status = approve_data.get("status")
    
    if status == "Approved":
        success = dao.approve_commande_fournisseur(commande_id)
    else:
        success = dao.update_commande_fournisseur_status(commande_id, status)
    
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")
    
    return JSONResponse({"success": True, "message": "Commande mise à jour"})


# --- API Stats ---

@app.get("/api/profile/stats")
async def get_profile_stats(request: Request):
    """Récupère les statistiques de l'utilisateur"""
    stats = dao.get_vendeur_stats(request.state.user_id)
    return JSONResponse({"success": True, "stats": stats})


@app.get("/api/admin/stats")
@require_role(["admin"])
async def get_admin_stats(request: Request, period: str = "all", start_date: str = None, end_date: str = None):
    """Récupère les statistiques globales pour l'administrateur"""
    
    # Gérer les périodes prédéfinies
    if period != "all" and not start_date and not end_date:
        today = date.today()
        if period == "last7":
            start_date = (today - timedelta(days=7)).isoformat()
            end_date = today.isoformat()
        elif period == "last30":
            start_date = (today - timedelta(days=30)).isoformat()
            end_date = today.isoformat()
        elif period == "last90":
            start_date = (today - timedelta(days=90)).isoformat()
            end_date = today.isoformat()
        elif period == "year":
            start_date = date(today.year, 1, 1).isoformat()
            end_date = today.isoformat()
    
    if start_date and end_date:
        stats = dao.get_stats_by_period(start_date, end_date)
    else:
        stats = dao.get_stats()
    
    return JSONResponse({"success": True, "stats": stats})

@app.get("/api/admin/stats/detailed")
@require_role(["admin"])
async def get_detailed_stats(request: Request, period: str = "all", start_date: str = None, end_date: str = None):
    """Récupère les statistiques détaillées pour l'administrateur"""
    # Gérer les périodes prédéfinies
    if period != "all" and not start_date and not end_date:
        today = date.today()
        if period == "last7":
            start_date = (today - timedelta(days=7)).isoformat()
            end_date = today.isoformat()
        elif period == "last30":
            start_date = (today - timedelta(days=30)).isoformat()
            end_date = today.isoformat()
        elif period == "last90":
            start_date = (today - timedelta(days=90)).isoformat()
            end_date = today.isoformat()
        elif period == "year":
            start_date = date(today.year, 1, 1).isoformat()
            end_date = today.isoformat()

    result = {}

    if start_date and end_date:
        # Utiliser les méthodes DAO avec filtrage par date
        result['ventes_detaillees'] = dao.get_ventes_by_date_range(start_date, end_date)
        result['locations_detaillees'] = dao.get_locations_by_date_range(start_date, end_date)
        result['commandes_fournisseur'] = dao.get_commandes_fournisseur_by_date_range(start_date, end_date)
        result['statistiques'] = dao.get_stats_by_period(start_date, end_date)
    else:
        result['ventes_detaillees'] = dao.get_all_ventes()
        result['locations_detaillees'] = dao.get_all_locations()
        result['commandes_fournisseur'] = dao.get_all_commandes_fournisseur()
        result['statistiques'] = dao.get_stats()

    # Récupérer tous les balais (pas besoin de filtre temporel)
    result['balais_stock'] = dao.get_all_brooms()

    return JSONResponse({"success": True, "stats": result})


# --- Lancement ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
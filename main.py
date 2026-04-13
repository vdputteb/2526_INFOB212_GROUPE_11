from os import getenv
import uvicorn
import bcrypt
from fastapi import FastAPI, HTTPException, Request
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from BD.models import Employee, Client , Reservation
from utils.auth import require_role
from utils.jwt_token import create_access_token,verify_token

# Création de l'instance FastAPI

app = FastAPI()
security = HTTPBearer()

dao = None

# Autoriser les requêtes depuis le front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Middleware d'authentification ---
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    public_routes = ["/", "/auth"]

    # if want to go in public routes or get css , JS , ...
    if request.url.path in public_routes or request.url.path.startswith("/static"):
        return await call_next(request)
    
    session_user = request.cookies.get("userID")

    if not session_user:
        if request.url.path.startswith("/api"):
            return JSONResponse(content={"message" : "Not connected"}, status_code=401)
        
        return RedirectResponse("/auth")
    
    if not verify_token(session_user):
        return RedirectResponse("/logout")
    
    # User storage in the request status
    request.state.user = session_user

    try:
        response = await call_next(request)
    except Exception as e:
        raise e
    
    return response


# --- Templates ---
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def homer():
    return RedirectResponse("/auth")


@app.get("/auth")
async def authentification(request : Request):
    return templates.TemplateResponse("auth.html",{ "request" : request, "user" : request.state.user, "role" : request.state.user_role })


@app.get("/dashboard")
async def dashboard(request : Request):
    return templates.TemplateResponse("dashboard.html",{ "request" : request})


@app.get("/shop")
async def shop(request : Request):
    client_id = request.cookies.get("clientID")
    client = None
    if client_id:
        client = dao.get_client_by_id(client_id)
        if not client:
            return templates.TemplateResponse(request=request,
                                              name="dashboard.html",
                                              context="Client Selection Expired")
        
    return templates.TemplateResponse(request=request,
                                      name="shop.html",
                                      context={"client" : client})


@app.get("/basket")
async def basket(request : Request):
    client_id = request.cookies.get("clientID")
    client = None
    if client_id:
        client = dao.get_client_by_id(client_id)
    
    return templates.TemplateResponse(request=request,
                                      name="basket.html",
                                      context={"client" : client})


@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/auth")
    response.delete_cookie("userID")
    return response


# --- API Register ---

@app.post("/api/register/employee")
@require_role(["admin"])
async def register_employee(request : Request , employee : Employee):

    # 1) the system will reject it if the email address already exists
    if dao.get_employee_by_email(employee.mail):
        raise HTTPException(status_code=400, detail="Email already used")
    
    # 2) the system will reject it if there is no phone number or too much
    nb_phone = len(employee.phone)
    if  nb_phone < 1:
        raise HTTPException(status_code=400, detail="Phone number Needed")
    if  nb_phone > 3:
        raise HTTPException(status_code=400, detail="Too much phone numbers given")
    
    # 3) Create the new employee
    new_employee = Employee(
        username = employee.username,
        password = bcrypt.hashpw(employee.password.encode('utf-8'), bcrypt.gensalt()),
        actif = False,
        name = employee.name,
        surname = employee.surname,
        mail = employee.mail,
        phone = employee.phone,
        admin = employee.is_admin,
        id_admin = request.state.user
    )
    dao.create_employee(new_employee)
    return {"message": "Registration successful", "pseudo": employee.username}


@app.post("/api/register/client")
async def register_client(request : Request , client : Client):

    # todo
    return {"message": "Registration successful", "pseudo": client.name}

# --- API Login ---

@app.post("/api/login")
async def login(user : Employee):
    # 1) Récupérer les identifiants

    #prevoir un compte serveur en default juste pour recup ceci 
    # et ducoup peut-être rajouter dans les appels dao le mdp et username de celui qi se connecte
    player = dao.get_player_identification(user.mail)
    
    # 2) Vérifier le pseudo
    if not player or user.pseudo != player[0]:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 3) Vérifier le mot de passe
    if not bcrypt.checkpw(user.password.encode('utf-8'), player[2]):
        raise HTTPException(status_code=401, detail="Incorrect Password")
    
    # 4)Créer la réponse avec le cookie
    response = JSONResponse(content={"message": "Login successful"})

    jwt_token = create_access_token(data={"username" : user.username,
                                          "password" : user.password, 
                                          "mail"     : user.mail, 
                                          "admin"    : user.is_admin
                                          })
    response.set_cookie(
        key="userID",
        value=jwt_token,
        httponly=True,
        secure=False,  # True en production avec HTTPS
        max_age=getenv("ACCESS_TOKEN_EXPIRE_MINUTES"*60),
        samesite="lax",
        path="/"
    )
    return response


# --- API Client --- 

@app.get("/api/clients")
async def get_clients():
    return JSONResponse(dao.get_all_clients())


@app.get("/api/clients/{client_id}")
async def get_client(client_id: int):
    client = dao.get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client Not found")


@app.post("/api/clients/select")
async def select_client(request: Request):
    body = await request.json()
    client_id = body.get("client_id")
    client = dao.get_client_by_id(int(client_id))
    if not client:
        raise HTTPException(status_code=404, detail="Client not fournd")
    
    response = JSONResponse({"success": True, "client": client})
    response.set_cookie(key="clientID", value=str(client_id), httponly=True, max_age=3600*1)
    return response

# --- API Catalogue ---

@app.get("/api/catalogue")
async def get_catalogue(request : Request):
    client_id = request.cookies.get("clientID")

    client = dao.get_client_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not fournd")
    
    # list of al the brooms the client can see ( moldu or sorcier )
    # Verifier de pas afficher ceux deja acheter mais peut afficher les louer 
    brooms = dao.get_client_visible_brooms(client_id)

    return JSONResponse(brooms)


@app.get("/api/catalogue/{broom_id}")
async def get_broom(broom_id: int):
    broom = dao.get_broom_by_id(broom_id)
    if not broom:
        raise HTTPException(status_code=404, detail="Broom not found")
    return JSONResponse(broom)

# --- API Reservation ---

# - Get -
@app.get("/api/reservations")
async def get_reservations():
    return JSONResponse(dao.get_all_reservations())

@app.get("/api/reservations/client")
async def get_reservations_by_client(request : Request):

    client_id = request.cookies.get("clientID")

    return JSONResponse(dao.get_client_reservations(client_id))


@app.get("/api/reservations/check")
async def check_availability(broom_id: int, start_date: str, end_date: str):
    try:
        available, conflict_date = dao.check_broom_availability(broom_id, start_date, end_date)
        
        if available:
            return JSONResponse({"available": True, "message": "Balai disponible"})
        else:
            return JSONResponse({
                "available": False,
                "message": "This broom is already booked",
                "conflictStart": conflict_date["startDate"],
                "conflictEnd": conflict_date["endDate"]
            })
    except Exception as e:
        return JSONResponse({"available": False, "message": f"Erreur: {str(e)}"}, status_code=400)

# - Post -

@app.post("/api/reservations")
async def create_reservation(request : Request, reservation: Reservation):
    client_id = request.cookies.get("userID")
    available, _ = dao.check_broom_availability( reservation.broomId, reservation.startDate, reservation.endDate)
    
    if not available:
        raise HTTPException(status_code=409, detail="This broom is already booked for this period")
    
    try :
        dao.add_reservation(client_id , reservation)
        return JSONResponse("Booking made", status_code=201)
    except:
        raise HTTPException(status_code=500 ,detail="A problem occured during the booking please try again")
    

# - Delete -
@app.delete("/api/reservations/{reservation_id}")
async def delete_reservation(reservation_id: int):
    deleted = dao.delete_reservation(reservation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking not found")
    return JSONResponse({"message": "Booking canceled"})


# --- API Commande ---

# - Get -
@app.get("/api/commandes")
async def get_all_commandes():
    return JSONResponse(dao.get_all_commandes())


@app.get("/api/commandes/client")
async def get_commandes_client(request : Request):
    client_id = request.cookies.get("userID")

    return JSONResponse(dao.get_client_commandes(client_id))


# - Post -
@app.post("/api/commandes")
async def create_commande(request: Request):
    body = await request.json()
    try : 
        dao.add_commandes(body)
        return JSONResponse("Command made", status_code=201)
    
    except:
        raise HTTPException(status_code=500 ,detail="A problem occured during the command processing please try again")
    

# --- Lancement ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

import bcrypt
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles



app = FastAPI()

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
    public_routes = ["/" , "/static", "/shop" ]
    
    if request.url.path in public_routes or request.url.path.startswith("/static"):
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

@app.get("/")
async def homer(request: Request):
    return RedirectResponse("/shop")


# Redirect to the Shop template
@app.get("/shop")
async def shop(request: Request):
    return templates.TemplateResponse(request=request, name="shop.html")


# --- API ---

@app.get("/shop/balai_moldu/")
async def get_balai_moldu():
    balai_info = "APPEL BDD avec un DAO"
    if not balai_info:
        raise HTTPException(status_code=404, detail="Balais not found")
    
    return JSONResponse(balai_info)




# Lancement automatique du serveur au lancement du python
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )

from functools import wraps
from os import getenv
from dotenv import load_dotenv
from fastapi import HTTPException, Request
from BD.dao_mysql import DAOMySQL
from utils.jwt_token import verify_token

load_dotenv()
dao = DAOMySQL(getenv("DB_HOST"),int(getenv("DB_PORT")),getenv("DB_USER"),getenv("DB_PASSWORD"),getenv("DB_NAME"))


def require_role(allowed_roles: list):
    """
    Décorateur pour vérifier que l'utilisateur a un rôle autorisé
    
    Usage:
        @app.get("/admin/dashboard")
        @require_role(["admin"])
        async def admin_dashboard(request: Request):
            return {"message": "Welcome admin"}
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Récupérer la requête (premier argument)
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request and 'request' in kwargs:
                request = kwargs['request']
            
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")
            
            # Récupérer l'utilisateur depuis le cookie
            session_token = request.cookies.get("userID")
            
            if not session_token:
                raise HTTPException(
                    status_code=401, 
                    detail="You are not logged in. Please log in."
                )
            
            session_user = verify_token(session_token)
            
            if not session_user:
                raise HTTPException(
                    status_code=401, 
                    detail="Invalid or expired session. Please log in again."
                )
            
            # Vérifier si l'utilisateur existe toujours dans la BDD et récupérer son rôle
            employee = dao.get_vendeur_by_id((getenv("DB_USER"), getenv("DB_PASSWORD")) , session_user['user_id'])
            if not employee:
                raise HTTPException(
                    status_code=404, 
                    detail="User not found in the database"
                )
            
            # Déterminer le rôle: admin si id_patron est NULL
            user_role = "admin" if employee['id_patron'] is None else "vendeur"
            
            # Vérifier si le rôle est autorisé
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Insufficient permissions. "
                           f"Required role: {', '.join(allowed_roles)}. "
                           f"Your role: {user_role}"
                )
            
            # Ajouter le rôle et l'utilisateur à request.state pour une utilisation ultérieure
            request.state.user_role = user_role
            request.state.user = session_user
            request.state.user_id = session_user['user_id']
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def check_user_role(request: Request, required_roles: list) -> tuple:
    """
    Vérifie le rôle d'un utilisateur et retourne (user_data, role)
    Utile pour les vérifications dans les fonctions existantes
    """
    session_token = request.cookies.get("userID")
    if not session_token:
        raise HTTPException(status_code=401, detail="Non connecté")
    
    session_user = verify_token(session_token)
    
    if not session_user:
        raise HTTPException(status_code=401, detail="Session invalide ou expirée")
    
    employee = dao.get_vendeur_by_id((getenv("DB_USER"), getenv("DB_PASSWORD")),session_user["user_id"])
    
    if not employee:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_role = "admin" if employee['id_patron'] is None else "vendeur"
    
    if user_role not in required_roles:
        raise HTTPException(
            status_code=403, 
            detail=f"Accès refusé. Rôle requis: {', '.join(required_roles)}"
        )
    
    return session_user, user_role
from functools import wraps
from fastapi import HTTPException, Request
from BD.dao import DAO
from utils.jwt_token import verify_token;

dao = DAO()

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
            session_user = verify_token(request.cookies.get("userID"))
            
            if not session_user:
                raise HTTPException(
                    status_code=401, 
                    detail="You are not logged in. Please log in."
                )
            
            # Récupérer le rôle depuis la BDD
            
            user_role = dao.is_admin(session_user['user_id'])
            if not user_role:
                
                raise HTTPException(
                    status_code=404, 
                    detail="User not found in the database"
                )
            
            user_role = "admin" if  bool(user_role) is True else "vendeur"
            
            # Vérifier si le rôle est autorisé
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Insufficient permissions. "
                           f"Required role: {', '.join(allowed_roles)}. "
                           f"Your role: {'patron' if user_role == 1 else 'vendeur'}"
                )
            
            # Ajouter le rôle et l'utilisateur à request.state pour une utilisation ultérieure
            request.state.user_role = user_role
            request.state.user = session_user
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def check_user_role(request: Request, required_roles: list) -> tuple:
    """
    Vérifie le rôle d'un utilisateur et retourne (pseudo, role)
    Utile pour les vérifications dans les fonctions existantes
    """
    session_user = verify_token(request.cookies.get("session_user"))
    
    if not session_user:
        raise HTTPException(status_code=401, detail="Non connecté")
    
    user_role = dao.is_admin(session_user["user_id"])
    
    if not user_role:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_role = "admin" if  bool(user_role) is True else "vendeur"
    
    if user_role not in required_roles:
        raise HTTPException(
            status_code=403, 
            detail=f"Accès refusé. Rôle requis: {', '.join(required_roles)}"
        )
    
    return session_user, user_role



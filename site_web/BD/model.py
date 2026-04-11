# BD/model.py
from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    id: Optional[int] = None
    username: str
    password: str
    role: str = "client"
    nom: str
    prenom: str
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class Client(BaseModel):
    id: Optional[int] = None
    nom: str
    prenom: str
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class Reservation(BaseModel):
    broomId: int
    startDate: str
    endDate: str
    userId: str

class ArticleCommande(BaseModel):
    id: int
    name: str
    type: str
    price: float
    quantity: int
    total: float
    rental_dates: Optional[str] = None

class Commande(BaseModel):
    client_id: int
    client_nom: str
    client_prenom: str
    client_email: str
    client_adresse: str
    articles: List[ArticleCommande]
    sous_total: float
    frais_livraison: float
    eco_participation: float
    total: float

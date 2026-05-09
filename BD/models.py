from typing import Optional, List
from datetime import date
from enum import Enum
from pydantic import BaseModel, Field


# --- Enums pour les valeurs contraintes ---
class BalaiStatus(str, Enum):
    IN_LOCATION = "in location"
    IN_STOCK = "in stock"
    ARRIVING = "arriving"

class CommandeFournisseurStatus(str, Enum):
    PENDING_APPROVAL = "Pending Approuval"
    PENDING = "Pending"
    PROCESSING = "Processing"
    IN_TRANSIT = "In transit"
    CANCELLED = "Cancelled"

class LocationStatus(str, Enum):
    IN_PROGRESS = "in Progress"
    FINISHED = "Finished"
    PENDING = "Pending"

# --- Modèles existants ---
class Employee(BaseModel):
    """
    Model of the EMPLOYEE table in the database.
    """
    __tablename__ = "EMPLOYEE"
    id_employee: Optional[int] = None
    username: str  # login
    password: str
    actif: bool = False
    name: str
    surname: str
    mail: str  # mail_pro
    phone: List[str] = Field(default_factory=list)  # tel1, tel2, tel3
    is_admin: bool = False  # is_patron
    id_patron: Optional[int] = None  # id_admin
    role: str = "vendeur"  # "vendeur", "patron", "comptable"

# --- Modèles pour les CLIENTS (Sorciers et Moldus) ---

class SorcierDetails(BaseModel):
    """Détails spécifiques aux sorciers"""
    wizard_registry_number: int
    chimney: str
    add_school_name: str
    add_house: str
    add_country: str = "United Kingdom"
    flight_licence: int = Field(ge=0, le=5)
    owls: List[str] = Field(default_factory=list)  # Owls_number1,2,3


class Address(BaseModel):
    """Adresse pour les moldus"""
    street: str
    city: str
    house_number: str
    country: str = "United Kingdom"


class MolduDetails(BaseModel):
    """Détails spécifiques aux moldus"""
    national_register_number: int
    mail: str  # Email du moldu
    address: Address
    telephones: List[str] = Field(default_factory=list)  # tel1, tel2, tel3


class Client(BaseModel):
    """
    Model of the CLIENT table in the database.
    """
    __tablename__ = "CLIENT"
    id_client: Optional[int] = None
    name: str
    surname: str
    birth_date: date
    money: float = Field(ge=0)
    id_employee: Optional[int] = None  # Employee qui a créé/enregistré le client
    telephones: List[str] = Field(default_factory=list)
    
    # Champs conditionnels selon le type
    sorcier: Optional[SorcierDetails] = None
    moldu: Optional[MolduDetails] = None


# --- Modèles pour les BALAIS ---

class Fabricant(BaseModel):
    """Modèle FABRICANT"""
    __tablename__ = "FABRICANT"
    id_fabricant: Optional[int] = None
    name: str
    mail: str


class Detail(BaseModel):
    """Modèle DETAIL (prix unitaire)"""
    __tablename__ = "DETAIL"
    id_detail: Optional[int] = None
    price: float = Field(ge=0)


class BalaiMagique(BaseModel):
    """Modèle BALAI_MAGIQUE"""
    __tablename__ = "BALAI_MAGIQUE"
    id_balai: int
    flight_licence_required: int = Field(ge=1, le=5)
    speed: int = Field(gt=0)
    magic_component: str


class Balai(BaseModel):
    """
    Model of the BALAI table in the database.
    """
    __tablename__ = "BALAI"
    id_balai: Optional[int] = None
    libelle: str
    description: str
    img: str
    uses_number: int = Field(ge=0)
    sale_price: float = Field(ge=0)
    location_price: float = Field(ge=0)
    wear: int = Field(ge=0, le=100)
    status: BalaiStatus = BalaiStatus.IN_STOCK
    id_detail: int
    id_fabricant: int
    balai_magique_id: Optional[int] = None  # Pour la relation 1-1
    
    # Champs optionnels pour les jointures
    fabricant_name: Optional[str] = None
    magique_details: Optional[BalaiMagique] = None


# --- Modèles pour les RÉSERVATIONS (LOCATIONS) ---

class Location(BaseModel):
    """
    Model for creating/reading Locations (LOCATIONS)
    """
    broomId: int
    startDate: str  # Format: YYYY-MM-DD
    endDate: str    # Format: YYYY-MM-DD
    userId: Optional[str] = None  # ID de l'utilisateur connecté


class Reservation(BaseModel):
    """
    Model of the LOCATION table
    """
    __tablename__ = "LOCATION"
    id_commande: int
    begin_date: date
    end_date: date
    actual_end_date: Optional[date] = None
    status: LocationStatus = LocationStatus.PENDING
    
    # Jointure
    client_name: Optional[str] = None
    client_surname: Optional[str] = None
    broom_name: Optional[str] = None


# --- Modèles pour les COMMANDES ---

class Vente(BaseModel):
    """
    Model of the VENTE table
    """
    __tablename__ = "VENTE"
    id_commande: int
    sale_date: date


class Commande(BaseModel):
    """
    Model of the COMMANDE table
    """
    __tablename__ = "COMMANDE"
    id_commande: Optional[int] = None
    id_employee: int
    id_client: int
    vente_id: Optional[int] = None  # Si c'est une vente
    location_id: Optional[int] = None  # Si c'est une location
    
    # Jointure
    client_name: Optional[str] = None
    client_surname: Optional[str] = None
    employee_name: Optional[str] = None
    employee_surname: Optional[str] = None
    sale_date: Optional[date] = None
    location_status: Optional[str] = None
    broom_name: Optional[str] = None


class CommandeFournisseur(BaseModel):
    """
    Model of the COMMANDE_FOURNISSEUR table (commandes aux fabricants)
    """
    __tablename__ = "COMMANDE_FOURNISSEUR"
    id_commande: Optional[int] = None
    status: CommandeFournisseurStatus = CommandeFournisseurStatus.PENDING
    command_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    id_vendeur: int  # Employee qui passe la commande
    id_patron: int   # Patron qui approuve


# --- Modèles pour les requêtes API ---

class LoginRequest(BaseModel):
    """Requête de connexion"""
    username: str
    mail: str
    password: str
    is_admin: bool = False


class RegisterEmployeeRequest(BaseModel):
    """Requête d'inscription d'employé"""
    username: str
    password: str
    name: str
    surname: str
    mail: str
    phone: List[str] = Field(default_factory=list)
    is_admin: bool = False


class SelectClientRequest(BaseModel):
    """Requête pour sélectionner un client"""
    client_id: int


class SelectVendeurRequest(BaseModel):
    """Requête pour sélectionner un vendeur"""
    vendeurs_id: int


class CreateCommandeRequest(BaseModel):
    """Requête pour créer une commande d'achat"""
    sale_date: str  # YYYY-MM-DD
    broom_ids: List[int]



class CheckAvailabilityRequest(BaseModel):
    """Requête pour vérifier la disponibilité d'un balai"""
    broom_id: int
    start_date: str
    end_date: str


class ApiResponse(BaseModel):
    """Réponse API standard"""
    success: bool
    message: str
    data: Optional[dict] = None
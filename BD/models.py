from typing import Optional
from datetime import datetime

from pydantic import BaseModel
from sqlmodel import SQLModel, Field


class Employee(SQLModel, table=True):
    """
    Model of the employee Player table in the database.
    """
    __tablename__ = "EMPLOYEE"
    id : int = Field(primary_key=True)
    username : str
    password : str
    actif : bool
    name : str
    surname : str
    mail : str
    phone : list[str]
    is_admin : bool
    id_admin : Optional[int] = None


#todo
class Client(SQLModel, table=True):
    """
    Model of the employee Player table in the database.
    """
    __tablename__ = "EMPLOYEE"
    id : int = Field(primary_key=True)
    name : str
    surname : str
    mail : str
    birthdate : datetime
    money : int

class Reservation(BaseModel):
    broomId: int
    startDate: str
    endDate: str
    userId: str
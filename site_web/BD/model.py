from typing import List, Optional
from pydantic import BaseModel

class Reservation(BaseModel):
    id: Optional[int] = None
    broomId: int
    startDate: str
    endDate: str
    userId: str



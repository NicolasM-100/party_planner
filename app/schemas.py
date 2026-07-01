from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., max_length=200)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class EventCreate(BaseModel):
    title: str
    description: str = ""
    event_date: Optional[date] = None
    location: str = ""
    budget_cap: Decimal = Decimal("0")
    status: str = "planning"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    location: Optional[str] = None
    budget_cap: Optional[Decimal] = None
    status: Optional[str] = None


class EventOut(BaseModel):
    id: int
    title: str
    description: str
    event_date: Optional[date] = None
    location: str
    budget_cap: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TimelineItemCreate(BaseModel):
    title: str
    event_datetime: Optional[datetime] = None
    completed: bool = False
    sort_order: int = 0


class TimelineItemUpdate(BaseModel):
    title: Optional[str] = None
    event_datetime: Optional[datetime] = None
    completed: Optional[bool] = None
    sort_order: Optional[int] = None


class TimelineItemOut(BaseModel):
    id: int
    event_id: int
    title: str
    event_datetime: Optional[datetime] = None
    completed: bool
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class VendorCreate(BaseModel):
    name: str
    category: str = ""
    contact: str = ""
    cost: Decimal = Decimal("0")
    eco_verified: bool = False
    notes: str = ""


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact: Optional[str] = None
    cost: Optional[Decimal] = None
    eco_verified: Optional[bool] = None
    notes: Optional[str] = None


class VendorOut(BaseModel):
    id: int
    event_id: int
    name: str
    category: str
    contact: str
    cost: Decimal
    eco_verified: bool
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetItemCreate(BaseModel):
    category: str
    allocated: Decimal = Decimal("0")
    spent: Decimal = Decimal("0")


class BudgetItemUpdate(BaseModel):
    category: Optional[str] = None
    allocated: Optional[Decimal] = None
    spent: Optional[Decimal] = None


class BudgetItemOut(BaseModel):
    id: int
    event_id: int
    category: str
    allocated: Decimal
    spent: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class RSVPCreate(BaseModel):
    guest_name: str
    email: str = ""
    status: str = "pending"
    plus_ones: int = 0


class RSVPUpdate(BaseModel):
    guest_name: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    plus_ones: Optional[int] = None


class RSVPOut(BaseModel):
    id: int
    event_id: int
    guest_name: str
    email: str
    status: str
    plus_ones: int
    created_at: datetime

    class Config:
        from_attributes = True


class SustainabilityMetricCreate(BaseModel):
    carbon_offset_kg: Decimal = Decimal("0")
    local_sourcing_pct: Decimal = Decimal("0")
    waste_reduction_kg: Decimal = Decimal("0")


class SustainabilityMetricUpdate(BaseModel):
    carbon_offset_kg: Optional[Decimal] = None
    local_sourcing_pct: Optional[Decimal] = None
    waste_reduction_kg: Optional[Decimal] = None


class SustainabilityMetricOut(BaseModel):
    id: int
    event_id: int
    carbon_offset_kg: Decimal
    local_sourcing_pct: Decimal
    waste_reduction_kg: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardCard(BaseModel):
    total_events: int
    upcoming_events: int
    total_budget: Decimal
    total_spent: Decimal
    pending_rsvps: int
    confirmed_guests: int
    eco_vendors: int
    recent_events: List[EventOut]


class AIGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3)


class AIAction(BaseModel):
    action: str
    item: str
    value: str


class AITimelineItem(BaseModel):
    title: str
    sort_order: int = 0
    event_datetime: Optional[str] = None
    completed: bool = False


class AIVendor(BaseModel):
    name: str
    category: str = ""
    contact: str = ""
    cost: float = 0
    eco_verified: bool = False


class AIBudgetItem(BaseModel):
    category: str
    allocated: float = 0
    spent: float = 0


class AIRSVP(BaseModel):
    guest_name: str
    email: str = ""
    status: str = "pending"
    plus_ones: int = 0


class AISustainability(BaseModel):
    carbon_offset_kg: float = 0
    local_sourcing_pct: float = 0
    waste_reduction_kg: float = 0


class AIGeneratedEvent(BaseModel):
    title: str
    description: str = ""
    event_date: Optional[date] = None
    location: str = ""
    budget_cap: float = 0
    timeline_items: List[AITimelineItem] = []
    vendor_suggestions: List[AIVendor] = []
    budget_estimates: List[AIBudgetItem] = []
    guest_suggestions: List[AIRSVP] = []
    sustainability: Optional[AISustainability] = None

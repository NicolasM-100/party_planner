from decimal import Decimal
from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.models import BudgetItem, Event, RSVP, Vendor
from app.schemas import (
    DashboardCard,
    EventCreate,
    EventOut,
    EventUpdate,
)

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events", response_model=List[EventOut])
async def list_events(
    status: str = Query(None),
    sort: str = Query("-created_at"),
):
    qs = Event.all()
    if status:
        qs = qs.filter(status=status)
    return await qs.order_by(sort)


@router.post("/events", response_model=EventOut, status_code=201)
async def create_event(data: EventCreate):
    event = await Event.create(**data.model_dump())
    await event.refresh_from_db()
    return event


@router.get("/events/{event_id}", response_model=EventOut)
async def get_event(event_id: int):
    event = await Event.get_or_none(id=event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    return event


@router.put("/events/{event_id}", response_model=EventOut)
async def update_event(event_id: int, data: EventUpdate):
    event = await Event.get_or_none(id=event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    await event.update_from_dict(data.model_dump(exclude_unset=True))
    await event.save()
    await event.refresh_from_db()
    return event


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(event_id: int):
    event = await Event.get_or_none(id=event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    await event.delete()


@router.get("/dashboard", response_model=DashboardCard)
async def dashboard():
    events = await Event.all().order_by("-created_at")
    upcoming = [e for e in events if e.status == "planning"]

    total_budget = Decimal("0")
    total_spent = Decimal("0")
    for e in events:
        total_budget += e.budget_cap
        budget_rows = await BudgetItem.filter(event_id=e.id).all()
        for row in budget_rows:
            total_spent += row.spent

    pending_rsvps = 0
    confirmed_guests = 0
    for e in events:
        rsvps = await RSVP.filter(event_id=e.id).all()
        for r in rsvps:
            if r.status == "pending":
                pending_rsvps += 1
            elif r.status == "confirmed":
                confirmed_guests += 1 + r.plus_ones

    eco_count = await Vendor.filter(eco_verified=True).count()

    return DashboardCard(
        total_events=len(events),
        upcoming_events=len(upcoming),
        total_budget=total_budget,
        total_spent=total_spent,
        pending_rsvps=pending_rsvps,
        confirmed_guests=confirmed_guests,
        eco_vendors=eco_count,
        recent_events=[EventOut.model_validate(e) for e in events[:5]],
    )

from typing import List

from fastapi import APIRouter, HTTPException

from app.models import Event, RSVP
from app.schemas import RSVPCreate, RSVPOut, RSVPUpdate

router = APIRouter(prefix="/api/events/{event_id}/rsvps", tags=["rsvps"])


@router.get("", response_model=List[RSVPOut])
async def list_rsvps(event_id: int):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    return await RSVP.filter(event_id=event_id)


@router.post("", response_model=RSVPOut, status_code=201)
async def create_rsvp(event_id: int, data: RSVPCreate):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    rsvp = await RSVP.create(event_id=event_id, **data.model_dump())
    await rsvp.refresh_from_db()
    return rsvp


@router.patch("/{rsvp_id}", response_model=RSVPOut)
async def update_rsvp(event_id: int, rsvp_id: int, data: RSVPUpdate):
    rsvp = await RSVP.get_or_none(id=rsvp_id, event_id=event_id)
    if not rsvp:
        raise HTTPException(404, "RSVP not found")
    await rsvp.update_from_dict(data.model_dump(exclude_unset=True))
    await rsvp.save()
    await rsvp.refresh_from_db()
    return rsvp


@router.delete("/{rsvp_id}", status_code=204)
async def delete_rsvp(event_id: int, rsvp_id: int):
    rsvp = await RSVP.get_or_none(id=rsvp_id, event_id=event_id)
    if not rsvp:
        raise HTTPException(404, "RSVP not found")
    await rsvp.delete()

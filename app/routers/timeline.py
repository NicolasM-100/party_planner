from typing import List

from fastapi import APIRouter, HTTPException

from app.models import Event, TimelineItem
from app.schemas import TimelineItemCreate, TimelineItemOut, TimelineItemUpdate

router = APIRouter(prefix="/api/events/{event_id}/timeline", tags=["timeline"])

def _to_out(item: TimelineItem) -> TimelineItemOut:
    return TimelineItemOut(
        id=item.id,
        event_id=item.event_id,
        title=item.title,
        event_datetime=item.event_datetime,
        completed=item.completed,
        sort_order=item.sort_order,
        created_at=item.created_at,
    )


@router.get("", response_model=List[TimelineItemOut])
async def list_timeline(event_id: int):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    items = await TimelineItem.filter(event_id=event_id).order_by("sort_order", "event_datetime")
    return [_to_out(i) for i in items]


@router.post("", response_model=TimelineItemOut, status_code=201)
async def create_timeline_item(event_id: int, data: TimelineItemCreate):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    item = await TimelineItem.create(event_id=event_id, **data.model_dump())
    return _to_out(item)


@router.patch("/{item_id}", response_model=TimelineItemOut)
async def update_timeline_item(event_id: int, item_id: int, data: TimelineItemUpdate):
    item = await TimelineItem.get_or_none(id=item_id, event_id=event_id)
    if not item:
        raise HTTPException(404, "Timeline item not found")
    await item.update_from_dict(data.model_dump(exclude_unset=True))
    await item.save()
    return _to_out(item)


@router.delete("/{item_id}", status_code=204)
async def delete_timeline_item(event_id: int, item_id: int):
    item = await TimelineItem.get_or_none(id=item_id, event_id=event_id)
    if not item:
        raise HTTPException(404, "Timeline item not found")
    await item.delete()

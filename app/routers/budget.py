from typing import List

from fastapi import APIRouter, HTTPException

from app.models import BudgetItem, Event
from app.schemas import BudgetItemCreate, BudgetItemOut, BudgetItemUpdate

router = APIRouter(prefix="/api/events/{event_id}/budget", tags=["budget"])


@router.get("", response_model=List[BudgetItemOut])
async def list_budget(event_id: int):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    return await BudgetItem.filter(event_id=event_id)


@router.post("", response_model=BudgetItemOut, status_code=201)
async def create_budget_item(event_id: int, data: BudgetItemCreate):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    item = await BudgetItem.create(event_id=event_id, **data.model_dump())
    await item.refresh_from_db()
    return item


@router.patch("/{item_id}", response_model=BudgetItemOut)
async def update_budget_item(event_id: int, item_id: int, data: BudgetItemUpdate):
    item = await BudgetItem.get_or_none(id=item_id, event_id=event_id)
    if not item:
        raise HTTPException(404, "Budget item not found")
    await item.update_from_dict(data.model_dump(exclude_unset=True))
    await item.save()
    await item.refresh_from_db()
    return item


@router.delete("/{item_id}", status_code=204)
async def delete_budget_item(event_id: int, item_id: int):
    item = await BudgetItem.get_or_none(id=item_id, event_id=event_id)
    if not item:
        raise HTTPException(404, "Budget item not found")
    await item.delete()

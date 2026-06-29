from typing import List

from fastapi import APIRouter, HTTPException

from app.models import Event, Vendor
from app.schemas import VendorCreate, VendorOut, VendorUpdate

router = APIRouter(prefix="/api/events/{event_id}/vendors", tags=["vendors"])


@router.get("", response_model=List[VendorOut])
async def list_vendors(event_id: int):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    return await Vendor.filter(event_id=event_id)


@router.post("", response_model=VendorOut, status_code=201)
async def create_vendor(event_id: int, data: VendorCreate):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    vendor = await Vendor.create(event_id=event_id, **data.model_dump())
    await vendor.refresh_from_db()
    return vendor


@router.put("/{vendor_id}", response_model=VendorOut)
async def update_vendor(event_id: int, vendor_id: int, data: VendorUpdate):
    vendor = await Vendor.get_or_none(id=vendor_id, event_id=event_id)
    if not vendor:
        raise HTTPException(404, "Vendor not found")
    await vendor.update_from_dict(data.model_dump(exclude_unset=True))
    await vendor.save()
    await vendor.refresh_from_db()
    return vendor


@router.delete("/{vendor_id}", status_code=204)
async def delete_vendor(event_id: int, vendor_id: int):
    vendor = await Vendor.get_or_none(id=vendor_id, event_id=event_id)
    if not vendor:
        raise HTTPException(404, "Vendor not found")
    await vendor.delete()

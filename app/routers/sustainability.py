from typing import List

from fastapi import APIRouter, HTTPException

from app.models import Event, SustainabilityMetric
from app.schemas import (
    SustainabilityMetricCreate,
    SustainabilityMetricOut,
    SustainabilityMetricUpdate,
)

router = APIRouter(prefix="/api/events/{event_id}/sustainability", tags=["sustainability"])


@router.get("", response_model=List[SustainabilityMetricOut])
async def list_metrics(event_id: int):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    return await SustainabilityMetric.filter(event_id=event_id)


@router.post("", response_model=SustainabilityMetricOut, status_code=201)
async def create_metric(event_id: int, data: SustainabilityMetricCreate):
    if not await Event.get_or_none(id=event_id):
        raise HTTPException(404, "Event not found")
    metric = await SustainabilityMetric.create(
        event_id=event_id, **data.model_dump()
    )
    await metric.refresh_from_db()
    return metric


@router.patch("/{metric_id}", response_model=SustainabilityMetricOut)
async def update_metric(
    event_id: int, metric_id: int, data: SustainabilityMetricUpdate
):
    metric = await SustainabilityMetric.get_or_none(
        id=metric_id, event_id=event_id
    )
    if not metric:
        raise HTTPException(404, "Sustainability metric not found")
    await metric.update_from_dict(data.model_dump(exclude_unset=True))
    await metric.save()
    await metric.refresh_from_db()
    return metric


@router.delete("/{metric_id}", status_code=204)
async def delete_metric(event_id: int, metric_id: int):
    metric = await SustainabilityMetric.get_or_none(
        id=metric_id, event_id=event_id
    )
    if not metric:
        raise HTTPException(404, "Sustainability metric not found")
    await metric.delete()

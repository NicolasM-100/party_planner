from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from tortoise.contrib.fastapi import RegisterTortoise

from app.config import settings
from app.routers import ai, auth, budget, events, rsvps, sustainability, timeline, vendors

templates = Jinja2Templates(directory="app/templates")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with RegisterTortoise(
        app,
        db_url=settings.db_url,
        modules={"models": ["app.models"]},
        generate_schemas=True,
        add_exception_handlers=True,
    ):
        yield


app = FastAPI(title="Party Planner", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(events.router)
app.include_router(timeline.router)
app.include_router(vendors.router)
app.include_router(budget.router)
app.include_router(rsvps.router)
app.include_router(sustainability.router)
app.include_router(ai.router)
app.include_router(auth.router)


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse, include_in_schema=False)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/events/{event_id}", response_class=HTMLResponse, include_in_schema=False)
async def event_detail(request: Request, event_id: int):
    return templates.TemplateResponse(
        "event_detail.html", {"request": request, "event_id": event_id}
    )

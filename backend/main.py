from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.simulation import router as simulation_router
from routes.appliances import router as appliances_router
from routes.energy import router as energy_router
from routes.actions import router as actions_router
from database.connection import Base, engine, SessionLocal
from database.seed import seed_appliances
from database import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    seed_appliances(db)
finally:
    db.close()
app = FastAPI(
    title="WattProof Twin API",
    description="Backend API for the WattProof Twin energy management platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(appliances_router)
app.include_router(energy_router)
app.include_router(simulation_router)
app.include_router(actions_router)
@app.get("/")
def root():
    return {
        "project": "WattProof Twin",
        "status": "running",
        "version": "1.0.0"
    }
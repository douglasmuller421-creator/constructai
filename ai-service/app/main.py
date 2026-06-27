from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.estimates import router as estimates_router
from app.routers.logs import router as logs_router
from app.routers.safety import router as safety_router
from app.routers.chat import router as chat_router
from app.routers.bids import router as bids_router

app = FastAPI(
    title="Construction AI Service",
    description="AI-powered construction cost estimation, log summaries, safety insights, and chat assistant",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(estimates_router)
app.include_router(logs_router)
app.include_router(safety_router)
app.include_router(chat_router)
app.include_router(bids_router)


@app.get("/")
async def root():
    return {
        "service": "Construction AI Service",
        "version": "2.0.0",
        "endpoints": {
            "estimates": "/api/v1/estimates",
            "logs": "/api/v1/logs/summarize",
            "safety": "/api/v1/safety/insights",
            "chat": "/api/v1/chat",
            "health": "/api/v1/health",
        },
        "docs": "/docs",
    }
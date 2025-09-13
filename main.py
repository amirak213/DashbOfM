from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, dashboard  # Add dashboard import
from app.config import API_PREFIX
import uvicorn
import ssl

# Create FastAPI app
app = FastAPI(
    title="L'Instant M Chatbot API",
    description="API for personalized chatbot to assist users of L'Instant M website",
    version="1.0.0"
)

# Configure CORS - IMPORTANT: Allow your Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://v0-dynamic-api-dashboard.vercel.app",  # Your Vercel app
        "http://localhost:3000",  # Local development
        "https://localhost:3000",  # Local development with HTTPS
        "*"  # Remove this in production, only for testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix=f"{API_PREFIX}/chat", tags=["chat"])
app.include_router(dashboard.router, prefix=f"{API_PREFIX}/chat", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API du chatbot de L'Instant M"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    # For HTTPS, you'll need SSL certificates
    # You can get free certificates from Let's Encrypt
    
    # Option 1: Run with HTTPS (if you have certificates)
    # uvicorn.run(
    #     "main:app", 
    #     host="0.0.0.0", 
    #     port=8000, 
    #     reload=True,
    #     ssl_keyfile="path/to/private.key",
    #     ssl_certfile="path/to/certificate.crt"
    # )
    
    # Option 2: Run with HTTP (current setup)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

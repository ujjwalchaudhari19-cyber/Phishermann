import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from app.middleware.auth_middleware import verify_token

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction="You are a cybersecurity assistant for PhisherMann, a phishing and scam detection platform. You only answer questions related to cybersecurity, phishing, scams, online safety, and digital threats. If asked anything unrelated to these topics, politely decline and redirect to cybersecurity topics. IMPORTANT: ALWAYS structure your answers strictly using bullet points or numbered lists. Use clear spacing and formatting so the response is easy to read. Keep answers concise, clear, and non-technical for general users."
    )
except Exception as e:
    model = None
    import logging
    logging.getLogger(__name__).warning("Gemini model not initialized properly. %s", e)

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, token_data: dict = Depends(verify_token)):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    if not model:
        return ChatResponse(response="Sorry, my AI brain is currently disconnected. Please try again later.")
    try:
        response = model.generate_content(request.message)
        return ChatResponse(response=response.text)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Chat error: {e}")
        return ChatResponse(response="Sorry, I couldn't process that. Please try again.")

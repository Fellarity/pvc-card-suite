from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import cv2
import base64
import pdf_service
import cv_service
import ocr_service

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "app://-"], # app:// for production electron
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "sidecar"}

@app.post("/api/process-document")
async def process_document_api(
    file: UploadFile = File(...), 
    password: str = Form(None)
):
    file_bytes = await file.read()
    filename = file.filename
    
    try:
        img_bgr, was_encrypted = pdf_service.process_document(file_bytes, filename, password)
    except pdf_service.NeedsPasswordError:
        return JSONResponse(status_code=401, content={"error": "needs_password", "message": "The document is password protected."})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Run OpenCV detection
    regions = cv_service.detect_regions(img_bgr)
    
    # Convert numpy array back to base64 jpeg to send to frontend
    _, buffer = cv2.imencode('.jpg', img_bgr)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "image_data": f"data:image/jpeg;base64,{img_base64}",
        "was_encrypted": was_encrypted,
        "regions": regions
    }

@app.post("/api/extract-text")
async def extract_text_api(
    file: UploadFile = File(...), 
    password: str = Form(None),
    doc_type: str = Form("generic")
):
    file_bytes = await file.read()
    filename = file.filename
    
    try:
        img_bgr, _ = pdf_service.process_document(file_bytes, filename, password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    extracted_data = ocr_service.extract_text(img_bgr, doc_type)
    
    return extracted_data

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

import pytesseract
import cv2
import numpy as np
import re

def extract_text(img_bgr: np.ndarray, doc_type: str = "generic") -> dict:
    """
    Extracts text from the image using Tesseract OCR.
    Parses basic fields based on the doc_type heuristic.
    """
    # Preprocess image for better OCR
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    # Simple binary thresholding for text
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    
    # Run Tesseract
    raw_text = pytesseract.image_to_string(thresh)
    
    parsed_fields = {}
    
    # Basic Heuristics
    if doc_type == "aadhaar":
        # Look for 12 digit number in format XXXX XXXX XXXX
        aadhaar_pattern = r'\b\d{4}\s\d{4}\s\d{4}\b'
        match = re.search(aadhaar_pattern, raw_text)
        if match:
            parsed_fields['id_number'] = match.group(0)
            
        # DOB pattern DD/MM/YYYY
        dob_pattern = r'\b\d{2}/\d{2}/\d{4}\b'
        dob_match = re.search(dob_pattern, raw_text)
        if dob_match:
            parsed_fields['dob'] = dob_match.group(0)
            
    elif doc_type == "pan":
        # Look for PAN format: 5 letters, 4 digits, 1 letter
        pan_pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
        match = re.search(pan_pattern, raw_text)
        if match:
            parsed_fields['id_number'] = match.group(0)
            
    # Always return raw text as fallback
    parsed_fields['raw_text'] = raw_text.strip()
    
    return parsed_fields

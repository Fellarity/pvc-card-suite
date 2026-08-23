import cv2
import numpy as np

def detect_regions(img_bgr: np.ndarray) -> dict:
    """
    Detects faces and signatures in the image.
    Returns a dict with 'face' and 'signature' bounding boxes (x, y, w, h) and confidence.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # 1. Face Detection using Haar Cascades
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces, rejectLevels, levelWeights = face_cascade.detectMultiScale3(
        gray, 
        scaleFactor=1.1, 
        minNeighbors=5, 
        minSize=(100, 100),
        outputRejectLevels=True
    )
    
    face_box = None
    face_confidence = 0
    
    if len(faces) > 0:
        # Sort by weight (confidence) and take the best one
        best_idx = np.argmax(levelWeights)
        (x, y, w, h) = faces[best_idx]
        weight = levelWeights[best_idx][0]
        
        face_box = {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
        # Normalize weight to a 0-100 score (heuristic)
        face_confidence = min(int((weight / 5.0) * 100), 100)
        if face_confidence < 0: face_confidence = 0
        
    # 2. Signature Detection Placeholder
    # High-quality signature extraction typically requires a segmentation model (e.g., U-Net).
    # For Phase 2, we return a low confidence to trigger the React manual crop fallback UI.
    
    height, width = gray.shape
    # Default signature box: bottom-ish center
    sig_box = {
        "x": int(width * 0.4),
        "y": int(height * 0.7),
        "width": int(width * 0.2),
        "height": int(height * 0.1)
    }

    return {
        "face": {
            "box": face_box,
            "confidence": face_confidence
        },
        "signature": {
            "box": sig_box,
            "confidence": 0 # Forces manual review
        }
    }

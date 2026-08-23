import fitz
import numpy as np
import cv2
import os

class NeedsPasswordError(Exception):
    pass

def process_document(file_bytes: bytes, filename: str, password: str = None) -> tuple[np.ndarray, bool]:
    """
    Takes raw bytes of a PDF or Image, decrypts if necessary, and returns a BGR numpy array suitable for OpenCV.
    Returns: (image_bgr_array, was_encrypted_flag)
    """
    is_pdf = filename.lower().endswith(".pdf")
    
    if is_pdf:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        was_encrypted = doc.is_encrypted
        
        if doc.is_encrypted:
            # 1. Try provided password
            if password and doc.authenticate(password):
                pass
            # 2. Try empty password
            elif doc.authenticate(""):
                pass
            # 3. Try filename without extension
            elif doc.authenticate(os.path.splitext(filename)[0]):
                pass
            else:
                raise NeedsPasswordError("PDF is password protected and decryption failed.")
                
        # Rasterize first page
        page = doc.load_page(0)
        # Render at 300 DPI for good OpenCV precision
        pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
        
        # Convert fitz pixmap to numpy array
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        
        # Convert colorspace for OpenCV (BGR)
        if pix.n == 4: # RGBA to BGR
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
        else: # RGB to BGR
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
        return img_bgr, was_encrypted
    else:
        # Assume it's a standard image (jpg, png)
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError(f"Failed to decode image from bytes. Filename: {filename}")
        return img_bgr, False

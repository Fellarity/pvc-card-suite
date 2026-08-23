import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { UploadCloud, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  onComplete?: (imageData: string, ocrData: any) => void;
}

export default function IngestionPipeline({ onComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [imageData, setImageData] = useState<string | null>(null);
  const [regions, setRegions] = useState<any>(null);
  const [crop, setCrop] = useState<Crop>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
        'application/pdf': ['.pdf'], 
        'image/*': ['.jpg', '.jpeg', '.png']
    } 
  });

  const processFile = async (currentFile: File, currentPassword?: string) => {
    setLoading(true);
    setError('');
    setShowPasswordPrompt(false);
    
    const formData = new FormData();
    formData.append('file', currentFile);
    if (currentPassword) {
      formData.append('password', currentPassword);
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/process-document', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 401) {
        setShowPasswordPrompt(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to process document');
      }

      const data = await res.json();
      setImageData(data.image_data);
      setRegions(data.regions);
      
      if (data.regions?.face?.box) {
         setCrop({
           unit: 'px',
           x: data.regions.face.box.x,
           y: data.regions.face.box.y,
           width: data.regions.face.box.width,
           height: data.regions.face.box.height,
         });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && password) {
      processFile(file, password);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);
    // Simple heuristic: if face confidence is high, it's likely a photo ID. We can try 'aadhaar' layout parsing.
    formData.append('doc_type', 'aadhaar'); 

    try {
      const res = await fetch('http://127.0.0.1:8000/api/extract-text', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (onComplete && imageData) {
        onComplete(imageData, data);
      }
    } catch (err) {
      console.error("OCR failed", err);
      // Proceed anyway with blank data
      if (onComplete && imageData) onComplete(imageData, {});
    } finally {
      setLoading(false);
    }
  };

  if (imageData) {
    return (
      <div className="glass-panel" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="login-header">
          <h2>Document Processed</h2>
          <p>Review the detected regions below.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
              <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                <img src={imageData} alt="Document" style={{ width: '100%', display: 'block' }} />
              </ReactCrop>
            </div>
            
            <div style={{ width: '250px' }}>
                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {regions?.face?.confidence > 80 ? <CheckCircle size={18} color="var(--success)"/> : <AlertTriangle size={18} color="var(--danger)"/>}
                        Face Confidence: {regions?.face?.confidence}%
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Adjust the crop box on the left if necessary.</p>
                </div>
                
                <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
                  {loading ? <span className="spinner"></span> : 'Confirm & Proceed'}
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '600px' }}>
      <div className="login-header">
        <h2>Upload Document</h2>
        <p>Drop a PDF or image here to begin processing</p>
      </div>

      {showPasswordPrompt ? (
        <form onSubmit={handlePasswordSubmit}>
           <div style={{ textAlign: 'center', marginBottom: '20px' }}>
             <Lock size={48} color="var(--primary)" style={{ margin: '0 auto 10px auto' }}/>
             <h3>Password Protected</h3>
             <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>This document requires a password to decrypt.</p>
           </div>
           
           <div className="floating-label-group">
            <input 
              type="password" 
              id="pdf-password" 
              placeholder=" " 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="pdf-password">Document Password</label>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Decrypt & Process'}
          </button>
        </form>
      ) : (
        <div {...getRootProps()} style={{
          border: '2px dashed var(--surface-border)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
          transition: 'all 0.3s'
        }}>
          <input {...getInputProps()} />
          <UploadCloud size={48} color={isDragActive ? "var(--primary)" : "var(--text-muted)"} style={{ margin: '0 auto 16px auto' }} />
          {isDragActive ? (
            <p style={{ color: 'var(--primary)', fontWeight: 500 }}>Drop the files here ...</p>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Drag 'n' drop a file here, or click to select files</p>
          )}
          {loading && <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}><span className="spinner"></span></div>}
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}

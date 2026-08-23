import React, { useState, useEffect } from 'react';
import aadhaarTemplate from '../templates/aadhaar.json';
import panTemplate from '../templates/pan.json';
import { CardTemplate } from '../../../shared/template_schema';
import { Save, Printer, Edit3 } from 'lucide-react';

interface Props {
  croppedImage: string | null;
  ocrData: any;
  onBack: () => void;
}

export default function TemplateDesigner({ croppedImage, ocrData, onBack }: Props) {
  const [template, setTemplate] = useState<CardTemplate>(aadhaarTemplate as CardTemplate);
  const [fields, setFields] = useState<any>({});
  
  // Initialize fields from OCR Data
  useEffect(() => {
    if (ocrData) {
      setFields({
        name: ocrData.name || '',
        dob: ocrData.dob || '',
        id_number: ocrData.id_number || ''
      });
    }
  }, [ocrData]);

  const handleFieldChange = (id: string, value: string) => {
    setFields((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'aadhaar') setTemplate(aadhaarTemplate as CardTemplate);
    if (e.target.value === 'pan') setTemplate(panTemplate as CardTemplate);
  };

  // Scaling factor for preview (CR80 cards are ~1011px wide, preview at 60%)
  const scale = 0.6;

  return (
    <div style={{ display: 'flex', gap: '30px', width: '100%', maxWidth: '1200px' }}>
      
      {/* Sidebar: Data Entry & Template Selection */}
      <div className="glass-panel" style={{ width: '350px' }}>
        <div className="login-header" style={{ marginBottom: '20px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px' }}><Edit3 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Card Data</h2>
        </div>
        
        <div className="form-group">
          <label>Select Template</label>
          <select className="input-field" onChange={handleTemplateChange}>
            <option value="aadhaar">Aadhaar Card (Front)</option>
            <option value="pan">PAN Card</option>
          </select>
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '24px' }}>
          {template.textFields.map(field => (
            <div className="floating-label-group" key={field.id}>
              <input 
                type="text" 
                id={field.id}
                placeholder=" "
                value={fields[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
              <label htmlFor={field.id}>{field.label}</label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--surface-border)' }} onClick={onBack}>
            Back
          </button>
          <button className="btn-primary">
            <Printer size={18} /> Print Card
          </button>
        </div>
      </div>

      {/* Main Area: Visual Preview */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
        
        <div style={{
          position: 'relative',
          width: `${template.width * scale}px`,
          height: `${template.height * scale}px`,
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          
          {/* Background Art placeholder */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'repeating-linear-gradient(45deg, #ccc, #ccc 10px, #eee 10px, #eee 20px)' }}></div>

          {/* Render Text Fields */}
          {template.textFields.map(tf => (
            <div key={tf.id} style={{
              position: 'absolute',
              left: `${tf.x * scale}px`,
              top: `${tf.y * scale}px`,
              fontSize: `${tf.fontSize * scale}px`,
              fontFamily: tf.fontFamily,
              color: tf.color,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}>
              {fields[tf.id] || tf.label}
            </div>
          ))}

          {/* Render Image Fields */}
          {template.imageFields.map(img => (
            <div key={img.id} style={{
              position: 'absolute',
              left: `${img.x * scale}px`,
              top: `${img.y * scale}px`,
              width: `${img.width * scale}px`,
              height: `${img.height * scale}px`,
              border: '1px dashed #ccc',
              background: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '12px',
              overflow: 'hidden'
            }}>
              {img.isCropBox && croppedImage ? (
                <img src={croppedImage} alt="Crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                img.label
              )}
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}

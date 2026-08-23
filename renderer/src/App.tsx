import { useState, FormEvent } from 'react';
import './index.css';
import IngestionPipeline from './components/IngestionPipeline';
import TemplateDesigner from './components/TemplateDesigner';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [ingestionComplete, setIngestionComplete] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      // Mocking login by hitting the sidecar health check
      const res = await fetch('http://127.0.0.1:8000/health');
      if (res.ok) {
        // Simulate a small delay for the animation
        setTimeout(() => {
          setSuccess(true);
          setLoading(false);
        }, 1000);
      } else {
        throw new Error('Invalid credentials or sidecar unreachable');
      }
    } catch (err) {
      setTimeout(() => {
        setError('Connection to local service failed. Is the sidecar running?');
        setLoading(false);
      }, 800);
    }
  };

  if (success) {
    return (
      <div style={{ width: '100%', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', alignItems: 'center' }}>
            <h1 style={{ fontSize: '24px' }}>PVC Card Suite Dashboard</h1>
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setSuccess(false)}>
              Sign Out
            </button>
         </div>
         
         {!ingestionComplete ? (
            <IngestionPipeline onComplete={(img, data) => {
              setFinalImage(img);
              setOcrData(data);
              setIngestionComplete(true);
            }} />
         ) : (
            <TemplateDesigner 
              croppedImage={finalImage} 
              ocrData={ocrData} 
              onBack={() => setIngestionComplete(false)} 
            />
         )}
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="login-header">
        <h1>PVC Card Suite</h1>
        <p>Sign in to access your print dashboard</p>
      </div>

      <form onSubmit={handleLogin}>
        <div className="floating-label-group">
          <input 
            type="email" 
            id="email" 
            placeholder=" " 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="email">Email Address</label>
        </div>

        <div className="floating-label-group">
          <input 
            type="password" 
            id="password" 
            placeholder=" " 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="password">Password</label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner"></span> : 'Sign In'}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}

export default App;

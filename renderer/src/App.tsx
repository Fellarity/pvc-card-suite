import { useState, FormEvent } from 'react';
import './index.css';
import IngestionPipeline from './components/IngestionPipeline';
import TemplateDesigner from './components/TemplateDesigner';
import PrintQueue, { PrintJob } from './components/PrintQueue';
import { LayoutDashboard, Printer as PrinterIcon, LogOut } from 'lucide-react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [ingestionComplete, setIngestionComplete] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);

  // App State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue'>('dashboard');
  const [jobs, setJobs] = useState<PrintJob[]>([]);

  const handleAddToQueue = (htmlPayload: string) => {
    const newJob: PrintJob = {
      id: `JOB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: Date.now(),
      htmlPayload,
      status: 'queued'
    };
    setJobs(prev => [...prev, newJob]);
    setIngestionComplete(false); // Reset to allow next document
    setActiveTab('queue'); // Auto-switch to queue to see it
  };

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
      <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        
        {/* Sidebar */}
        <div style={{ width: '250px', background: 'rgba(15, 23, 42, 0.8)', borderRight: '1px solid var(--surface-border)', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '40px', color: 'var(--primary)', fontWeight: 'bold' }}>PVC Suite</h2>
          
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="btn-primary" 
              style={{ background: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent', textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} style={{ marginRight: '10px' }}/> Dashboard
            </button>
            <button 
              className="btn-primary" 
              style={{ background: activeTab === 'queue' ? 'var(--primary)' : 'transparent', textAlign: 'left', justifyContent: 'flex-start' }}
              onClick={() => setActiveTab('queue')}
            >
              <PrinterIcon size={18} style={{ marginRight: '10px' }}/> Print Queue 
              {jobs.filter(j => j.status === 'queued').length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                  {jobs.filter(j => j.status === 'queued').length}
                </span>
              )}
            </button>
          </nav>

          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }} onClick={() => setSuccess(false)}>
            <LogOut size={18} style={{ marginRight: '10px' }}/> Sign Out
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
           
           {activeTab === 'dashboard' && (
             <>
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
                    onAddToQueue={handleAddToQueue}
                  />
               )}
             </>
           )}

           {activeTab === 'queue' && (
             <PrintQueue jobs={jobs} />
           )}
           
        </div>
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

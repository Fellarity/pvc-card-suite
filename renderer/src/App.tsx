import { useState, FormEvent } from 'react';
import './index.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--success)' }}>Welcome!</h1>
        <p style={{ marginTop: '10px' }}>You have successfully logged in to the PVC Card Creation Suite.</p>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setSuccess(false)}>
          Sign Out
        </button>
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

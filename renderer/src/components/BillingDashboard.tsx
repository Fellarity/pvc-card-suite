import React, { useState } from 'react';
import { CreditCard, Key, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  walletBalance: number;
  onAddCredits: (amount: number) => void;
}

export default function BillingDashboard({ walletBalance, onAddCredits }: Props) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleOfflineActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Activation failed');
      }

      onAddCredits(data.payload.credits);
      setMessage(`Successfully activated! Added ${data.payload.credits} credits to your wallet.`);
      setLicenseKey('');
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async () => {
    // Mock Razorpay Flow
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      // 1. Create order
      const orderRes = await fetch('http://127.0.0.1:8000/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 99 }) // 99 INR
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error("Failed to create order");

      // 2. Normally here we'd open the Razorpay JS checkout modal. 
      // For this implementation, we skip straight to verification mock
      // await new Promise(r => setTimeout(r, 1000)); // Simulate user paying

      // 3. Verify
      const verifyRes = await fetch('http://127.0.0.1:8000/api/verify-razorpay-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          payment_id: "pay_mock123", 
          order_id: orderData.order.id, 
          signature: "mock_sig" 
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.detail);

      onAddCredits(verifyData.credits_added);
      setMessage(`Payment successful! Added ${verifyData.credits_added} credits.`);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header & Wallet Balance */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(15, 23, 42, 0.8))' }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <CreditCard size={24} color="var(--primary)"/> Wallet Balance
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>1 Credit = 1 Printed Card</p>
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff' }}>
          {walletBalance}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* Offline Activation */}
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="var(--primary)"/> Offline Activation
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Enter the 256-bit RSA license key provided by your reseller. This works without an internet connection.
          </p>
          
          <form onSubmit={handleOfflineActivation}>
            <div className="floating-label-group">
              <textarea 
                id="licenseKey" 
                placeholder=" " 
                rows={4}
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading || !licenseKey} style={{ width: '100%', marginTop: '10px' }}>
              {loading ? <span className="spinner"></span> : <><ShieldCheck size={18} style={{ marginRight: '8px', verticalAlign: 'bottom' }}/> Validate & Activate</>}
            </button>
          </form>
        </div>

        {/* Online Razorpay */}
        <div className="glass-panel" style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--primary)"/> Buy Credits Online
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Instantly top-up your wallet using Razorpay. Supports UPI, NetBanking, and Credit Cards.
          </p>

          <div style={{ padding: '20px', border: '1px solid var(--surface-border)', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
             <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>₹99.00</div>
             <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>for 100 Credits</div>
          </div>

          <button className="btn-primary" onClick={handleRazorpay} disabled={loading} style={{ width: '100%', background: '#3395ff' }}>
            {loading ? <span className="spinner"></span> : 'Pay via Razorpay'}
          </button>
        </div>

      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '8px', background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isError ? 'var(--danger)' : 'var(--success)', border: `1px solid ${isError ? 'var(--danger)' : 'var(--success)'}` }}>
          {message}
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export interface PrintJob {
  id: string;
  timestamp: number;
  htmlPayload: string;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  error?: string;
}

interface Props {
  jobs: PrintJob[];
}

export default function PrintQueue({ jobs: initialJobs }: Props) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [jobs, setJobs] = useState<PrintJob[]>(initialJobs);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // Keep internal state updated if props change
    setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    async function fetchPrinters() {
      if ((window as any).electronAPI) {
        try {
          const list = await (window as any).electronAPI.getPrinters();
          setPrinters(list);
          if (list.length > 0) {
            // Preselect default or first printer
            const defaultPrinter = list.find((p: any) => p.isDefault);
            setSelectedPrinter(defaultPrinter ? defaultPrinter.name : list[0].name);
          }
        } catch (e) {
          console.error("Failed to fetch printers", e);
        }
      }
    }
    fetchPrinters();
  }, []);

  const handlePrintBatch = async () => {
    if (!selectedPrinter) return;
    setIsPrinting(true);

    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].status === 'completed') continue;

      // Update to printing
      const updatedJobs = [...jobs];
      updatedJobs[i].status = 'printing';
      setJobs([...updatedJobs]);

      try {
        if ((window as any).electronAPI) {
          await (window as any).electronAPI.printCard(jobs[i].htmlPayload, selectedPrinter);
        } else {
          // Dev mock
          await new Promise(r => setTimeout(r, 1000));
        }
        updatedJobs[i].status = 'completed';
      } catch (err: any) {
        updatedJobs[i].status = 'failed';
        updatedJobs[i].error = err.message;
      }
      setJobs([...updatedJobs]);
    }
    setIsPrinting(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Batch Print Queue</h2>
          <p style={{ color: 'var(--text-muted)' }}>{jobs.filter(j => j.status === 'queued').length} jobs pending</p>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select 
            className="input-field" 
            style={{ width: '250px' }}
            value={selectedPrinter} 
            onChange={(e) => setSelectedPrinter(e.target.value)}
          >
            {printers.length === 0 && <option value="">No printers found</option>}
            {printers.map(p => (
              <option key={p.name} value={p.name}>{p.name} {p.isDefault ? '(Default)' : ''}</option>
            ))}
          </select>

          <button 
            className="btn-primary" 
            onClick={handlePrintBatch} 
            disabled={isPrinting || jobs.filter(j => j.status === 'queued' || j.status === 'failed').length === 0}
          >
            {isPrinting ? <span className="spinner"></span> : <><Printer size={18} style={{ marginRight: '8px', verticalAlign: 'bottom' }}/> Print Batch</>}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '16px' }}>Job ID</th>
              <th style={{ padding: '16px' }}>Time Added</th>
              <th style={{ padding: '16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
               <tr>
                 <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No jobs in queue. Process documents to add them here.
                 </td>
               </tr>
            )}
            {jobs.map(job => (
              <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontFamily: 'monospace', color: 'var(--primary)' }}>{job.id}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(job.timestamp).toLocaleTimeString()}</td>
                <td style={{ padding: '16px' }}>
                  {job.status === 'queued' && <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={16}/> Queued</span>}
                  {job.status === 'printing' && <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span> Printing...</span>}
                  {job.status === 'completed' && <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}><CheckCircle size={16}/> Completed</span>}
                  {job.status === 'failed' && <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={16}/> Failed: {job.error}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

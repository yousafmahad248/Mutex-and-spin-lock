import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_BASE = 'http://localhost:5000/api/mutex';

function App() {
  const [status, setStatus] = useState({
    locked: false,
    currentProcess: null,
    waitingQueue: [],
    queueLength: 0
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [processes, setProcesses] = useState([]);
  const [numProcesses, setNumProcesses] = useState(3);
  const [algorithm, setAlgorithm] = useState('simple');

  // Fetch mutex status periodically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const initializeProcesses = () => {
    const newProcesses = [];
    for (let i = 0; i < numProcesses; i++) {
      newProcesses.push({
        id: i,
        status: 'idle', // idle, active, waiting
        hasLock: false
      });
    }
    setProcesses(newProcesses);
    showMessage(`${numProcesses} processes initialized`, 'info');
  };

  const updateProcessState = (processId, status, hasLock) => {
    setProcesses(prev => prev.map(p => {
      if (p.id === processId) {
        return { ...p, status, hasLock };
      }
      return p;
    }));
  };

  const spin = (processId) => {
    setTimeout(async () => {
      setProcesses(currentProcesses => {
        const p = currentProcesses.find(p => p.id === processId);
        if (p && p.status === 'spinning') {
          checkSpinLock(processId);
        }
        return currentProcesses;
      });
    }, 1000);
  };

  const checkSpinLock = async (processId) => {
    try {
      const response = await axios.post(`${API_BASE}/lock`, {
        processId,
        algorithm: 'spinlock'
      });
      if (response.data.success) {
        updateProcessState(processId, 'active', true);
        fetchStatus();
        showMessage(`Process ${processId} successfully acquired spin lock`, 'success');
      } else {
        spin(processId);
      }
    } catch (error) {
      console.error('Error during spin:', error);
    }
  };

  const acquireLock = async (processId) => {
    try {
      const response = await axios.post(`${API_BASE}/lock`, {
        processId,
        algorithm
      });
      
      if (response.data.success) {
        showMessage(response.data.message, 'success');
        updateProcessState(processId, 'active', true);
      } else if (response.data.isSpinning) {
        showMessage(response.data.message, 'warning');
        updateProcessState(processId, 'spinning', false);
        spin(processId);
      } else {
        showMessage(response.data.message, 'error');
        updateProcessState(processId, 'waiting', false);
      }
      
      fetchStatus();
    } catch (error) {
      showMessage('Error acquiring lock', 'error');
    }
  };

  const releaseLock = async (processId) => {
    try {
      const response = await axios.post(`${API_BASE}/unlock`, {
        processId
      });
      
      showMessage(response.data.message, response.data.success ? 'success' : 'error');
      
      // Update process status
      setProcesses(prev => prev.map(p => {
        if (p.id === processId) {
          return {
            ...p,
            status: 'idle',
            hasLock: false
          };
        }
        return p;
      }));
      
      fetchStatus();
    } catch (error) {
      showMessage('Error releasing lock', 'error');
    }
  };

  const resetMutex = async () => {
    try {
      await axios.post(`${API_BASE}/reset`);
      setProcesses(prev => prev.map(p => ({
        ...p,
        status: 'idle',
        hasLock: false
      })));
      showMessage('Mutex reset successfully', 'success');
      fetchStatus();
    } catch (error) {
      showMessage('Error resetting mutex', 'error');
    }
  };

  const getProcessStatus = (processId) => {
    const process = processes.find(p => p.id === processId);
    if (!process) return 'idle';
    
    if (process.hasLock) return 'active';
    if (process.status === 'spinning') return 'spinning';
    if (status.waitingQueue.includes(processId)) return 'waiting';
    return 'idle';
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🔒 Mutex Algorithm Visualization</h1>
        <p>Process Synchronization using Mutex Locks</p>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="algorithm-info">
        <h3>📚 About Mutex Algorithm</h3>
        <p>
          A <strong>Mutex (Mutual Exclusion)</strong> is a synchronization mechanism that ensures 
          only one process can access a critical section at a time. When a process acquires a mutex lock, 
          other processes must wait until the lock is released. This prevents race conditions and ensures 
          data consistency in concurrent systems.
        </p>
      </div>

      <div className="controls">
        <div>
          <select 
            value={algorithm} 
            onChange={(e) => setAlgorithm(e.target.value)}
            style={{ padding: '12px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          >
            <option value="simple">Mutex (Queue)</option>
            <option value="spinlock">Spin Lock (Busy Wait)</option>
          </select>
          <input
            type="number"
            min="2"
            max="10"
            value={numProcesses}
            onChange={(e) => setNumProcesses(parseInt(e.target.value))}
            style={{ padding: '12px', width: '60px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button className="btn-primary" onClick={initializeProcesses}>
            Initialize Processes
          </button>
        </div>
        <button className="btn-danger" onClick={resetMutex}>
          Reset Mutex
        </button>
      </div>

      <div className="status-panel">
        <h2>📊 Mutex Status</h2>
        <div className="status-item">
          <span className="status-label">Lock Status:</span>
          <span className="status-value" style={{ color: status.locked ? '#dc3545' : '#28a745' }}>
            {status.locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Current Process:</span>
          <span className="status-value">
            {status.currentProcess !== null ? `Process ${status.currentProcess}` : 'None'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Queue Length:</span>
          <span className="status-value">{status.queueLength}</span>
        </div>
      </div>

      {status.waitingQueue.length > 0 && (
        <div className="queue-display">
          <h3>⏳ Waiting Queue</h3>
          <div className="queue-list">
            {status.waitingQueue.map((processId, index) => (
              <div key={index} className="queue-item">
                Process {processId}
              </div>
            ))}
          </div>
        </div>
      )}

      {processes.length > 0 && (
        <div className="processes-container">
          <h2>⚙️ Processes</h2>
          <div className="process-grid">
            {processes.map((process) => {
              const processStatus = getProcessStatus(process.id);
              return (
                <div
                  key={process.id}
                  className={`process-card ${processStatus === 'active' ? 'active' : ''} ${processStatus === 'waiting' ? 'waiting' : ''} ${processStatus === 'spinning' ? 'spinning' : ''}`}
                >
                  <div className="process-header">
                    <span className="process-id">Process {process.id}</span>
                    <span className={`process-status status-${processStatus}`}>
                      {processStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="process-actions">
                    <button
                      className="btn-success"
                      onClick={() => acquireLock(process.id)}
                      disabled={processStatus === 'active' || processStatus === 'waiting' || processStatus === 'spinning'}
                    >
                      Acquire Lock
                    </button>
                    <button
                      className="btn-warning"
                      onClick={() => releaseLock(process.id)}
                      disabled={processStatus !== 'active'}
                    >
                      Release Lock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
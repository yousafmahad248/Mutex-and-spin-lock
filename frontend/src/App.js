import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// Remove /api/mutex or /api/spinlock suffix from API_BASE to avoid double path
const RAW_API_BASE = process.env.REACT_APP_API_URL || 'https://mutex-and-spin-lock.onrender.com';
const API_BASE = RAW_API_BASE.replace(/\/api\/(mutex|spinlock)$/, '');

function App() {
  const [mode, setMode] = useState('mutex'); // 'mutex' or 'spinlock'
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [processes, setProcesses] = useState([]);
  const [numProcesses, setNumProcesses] = useState(3);
  const [spinCounts, setSpinCounts] = useState({});
  const spinIntervalsRef = useRef({});

  const fetchStatus = useCallback(async () => {
    try {
      // Use appropriate endpoint based on mode
      const endpoint = mode === 'spinlock' ? '/api/spinlock/status' : '/api/mutex/status';
      const response = await axios.get(`${API_BASE}${endpoint}`);
      const data = response.data;
      
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  }, [mode]);

  // Fetch status periodically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 800);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Cleanup spin intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(spinIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const initializeProcesses = () => {
    // Clear any existing spin intervals
    Object.values(spinIntervalsRef.current).forEach(clearInterval);
    spinIntervalsRef.current = {};
    setSpinCounts({});

    const newProcesses = [];
    for (let i = 0; i < numProcesses; i++) {
      newProcesses.push({
        id: i + 1, // Use 1-based indexing for deployed backend compatibility
        status: 'idle',
        hasLock: false
      });
    }
    setProcesses(newProcesses);
    showMessage(`${numProcesses} processes initialized for ${mode === 'mutex' ? 'Mutex' : 'Spin Lock'}`, 'info');
  };

  const updateProcessState = (processId, newStatus, hasLock) => {
    setProcesses(prev => prev.map(p => {
      if (p.id === processId) {
        return { ...p, status: newStatus, hasLock };
      }
      return p;
    }));
  };

  const startSpinning = (processId) => {
    setSpinCounts(prev => ({ ...prev, [processId]: 1 }));

    const intervalId = setInterval(async () => {
      try {
        // Use spinlock endpoint for spinning
        const response = await axios.post(`${API_BASE}/api/spinlock/lock`, {
          processId
        });

        const data = response.data;
        
        setSpinCounts(prev => ({ ...prev, [processId]: (prev[processId] || 0) + 1 }));

        if (data.success) {
          clearInterval(intervalId);
          delete spinIntervalsRef.current[processId];
          updateProcessState(processId, 'active', true);
          fetchStatus();
          showMessage(`Process ${processId} acquired spin lock after ${spinCounts[processId] || 1} spins!`, 'success');
        }
      } catch (error) {
        console.error('Spin error:', error);
      }
    }, 1200);

    spinIntervalsRef.current[processId] = intervalId;
  };

  const acquireLock = async (processId) => {
    try {
      // Use appropriate endpoint based on mode
      const endpoint = mode === 'spinlock' ? '/api/spinlock/lock' : '/api/mutex/lock';
      const response = await axios.post(`${API_BASE}${endpoint}`, {
        processId
      });

      const data = response.data;
      
      if (data.success) {
        showMessage(data.message, 'success');
        updateProcessState(processId, 'active', true);
      } else if (data.isSpinning) {
        showMessage(`Process ${processId} is now spinning (busy waiting)...`, 'warning');
        updateProcessState(processId, 'spinning', false);
        startSpinning(processId);
      } else {
        showMessage(data.message, 'error');
        updateProcessState(processId, 'waiting', false);
      }

      fetchStatus();
    } catch (error) {
      showMessage('Error acquiring lock', 'error');
    }
  };

  const releaseLock = async (processId) => {
    try {
      // Use appropriate endpoint based on mode
      const endpoint = mode === 'spinlock' ? '/api/spinlock/unlock' : '/api/mutex/unlock';
      const response = await axios.post(`${API_BASE}${endpoint}`, {
        processId
      });

      showMessage(response.data.message, response.data.success ? 'success' : 'error');

      setProcesses(prev => prev.map(p => {
        if (p.id === processId) {
          return { ...p, status: 'idle', hasLock: false };
        }
        return p;
      }));

      fetchStatus();
    } catch (error) {
      showMessage('Error releasing lock', 'error');
    }
  };

  const resetLock = async () => {
    try {
      // Use appropriate endpoint based on mode
      const endpoint = mode === 'spinlock' ? '/api/spinlock/reset' : '/api/mutex/reset';
      await axios.post(`${API_BASE}${endpoint}`);

      // Clear all spin intervals
      Object.values(spinIntervalsRef.current).forEach(clearInterval);
      spinIntervalsRef.current = {};
      setSpinCounts({});

      setProcesses(prev => prev.map(p => ({
        ...p,
        status: 'idle',
        hasLock: false
      })));
      showMessage(`${mode === 'mutex' ? 'Mutex' : 'Spin Lock'} reset successfully`, 'success');
      fetchStatus();
    } catch (error) {
      showMessage('Error resetting', 'error');
    }
  };

  const getProcessStatus = (processId) => {
    const process = processes.find(p => p.id === processId);
    if (!process) return 'idle';

    if (process.hasLock) return 'active';
    if (process.status === 'spinning') return 'spinning';
    if (status && status.waitingQueue && status.waitingQueue.includes(processId)) return 'waiting';
    return 'idle';
  };

  const isSpinLock = mode === 'spinlock';

  return (
    <div className={`app ${isSpinLock ? 'app-spinlock' : 'app-mutex'}`}>
      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${!isSpinLock ? 'tab-active' : ''}`}
          onClick={() => { setMode('mutex'); resetLock(); }}
        >
          🔒 Mutex Lock
        </button>
        <button
          className={`tab-btn ${isSpinLock ? 'tab-active tab-active-spin' : ''}`}
          onClick={() => { setMode('spinlock'); resetLock(); }}
        >
          🔄 Spin Lock
        </button>
      </div>

      {/* Header */}
      <div className="header">
        <h1>{isSpinLock ? '🔄 Spin Lock Visualization' : '🔒 Mutex Lock Visualization'}</h1>
        <p>{isSpinLock ? 'Process Synchronization using Busy Waiting' : 'Process Synchronization using Mutex Locks'}</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Info Panel */}
      <div className={`algorithm-info ${isSpinLock ? 'info-spinlock' : ''}`}>
        <h3>{isSpinLock ? '⚡ About Spin Lock' : '📚 About Mutex Lock'}</h3>
        {isSpinLock ? (
          <p>
            A <strong>Spin Lock</strong> is a synchronization mechanism where a process continuously
            checks (spins) in a loop until the lock becomes available. Unlike mutex, the process does
            <strong> NOT sleep</strong> — it keeps the CPU busy with active polling. This is efficient
            for <strong>short wait times</strong> but wastes CPU cycles for longer waits.
            Watch the spin counter increase as processes actively poll!
          </p>
        ) : (
          <p>
            A <strong>Mutex (Mutual Exclusion)</strong> is a synchronization mechanism that ensures
            only one process can access a critical section at a time. When a process acquires a mutex lock,
            other processes are put into a <strong>waiting queue</strong> and go to sleep. This prevents
            race conditions and ensures data consistency in concurrent systems.
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="controls-left">
          <input
            type="number"
            min="2"
            max="10"
            value={numProcesses}
            onChange={(e) => setNumProcesses(parseInt(e.target.value))}
            className="num-input"
          />
          <button className={`btn-primary ${isSpinLock ? 'btn-spin-primary' : ''}`} onClick={initializeProcesses}>
            Initialize Processes
          </button>
        </div>
        <button className="btn-danger" onClick={resetLock}>
          Reset All
        </button>
      </div>

      {/* Lock Visual */}
      {status && (
        <div className="lock-visual">
          <div className={`lock-icon-big ${status.locked ? 'locked' : 'unlocked'}`}>
            <span className="lock-emoji">{status.locked ? '🔒' : '🔓'}</span>
            <span className="lock-text">{status.locked ? 'LOCKED' : 'UNLOCKED'}</span>
            {status.currentProcess !== null && (
              <span className="lock-owner">by Process {status.currentProcess}</span>
            )}
          </div>
        </div>
      )}

      {/* Status Panel */}
      {status && (
        <div className={`status-panel ${isSpinLock ? 'status-panel-spin' : ''}`}>
          <h2>{isSpinLock ? '⚡ Lock Status' : '📊 Mutex Status'}</h2>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-card-label">Lock State</div>
              <div className={`status-card-value ${status.locked ? 'text-red' : 'text-green'}`}>
                {status.locked ? 'LOCKED' : 'FREE'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-card-label">Owner</div>
              <div className="status-card-value">
                {status.currentProcess !== null ? `P${status.currentProcess}` : '—'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-card-label">{isSpinLock ? 'Spinning' : 'Queue'}</div>
              <div className="status-card-value">
                {isSpinLock
                  ? status.spinningCount || 0
                  : status.queueLength
                }
              </div>
            </div>
            <div className="status-card">
              <div className="status-card-label">Mode</div>
              <div className={`status-card-value ${isSpinLock ? 'text-cyan' : 'text-purple'}`}>
                {isSpinLock ? 'SPIN' : 'MUTEX'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Queue (Mutex only) */}
      {!isSpinLock && status && status.waitingQueue && status.waitingQueue.length > 0 && (
        <div className="queue-display">
          <h3>⏳ Waiting Queue</h3>
          <div className="queue-list">
            {status.waitingQueue.map((processId, index) => (
              <div key={index} className="queue-item">
                <span className="queue-pos">#{index + 1}</span>
                Process {processId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spinning Processes (Spin Lock only) */}
      {isSpinLock && status && status.spinningProcesses && status.spinningProcesses.length > 0 && (
        <div className="spin-monitor">
          <h3>🔄 Active Spinners</h3>
          <div className="spinner-list">
            {status.spinningProcesses.map(p => (
              <div key={p.processId} className="spinner-item">
                <div className="spinner-icon-container">
                  <div className="spinner-anim"></div>
                </div>
                <div className="spinner-details">
                  <span className="spinner-name">Process {p.processId}</span>
                  <span className="spinner-count">Spin #{p.spinCount}</span>
                </div>
                <div className="spinner-bar">
                  <div className="spinner-bar-fill" style={{ width: `${Math.min(p.spinCount * 10, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Cards */}
      {processes.length > 0 && (
        <div className="processes-container">
          <h2>⚙️ Processes</h2>
          <div className="process-grid">
            {processes.map((process) => {
              const processStatus = getProcessStatus(process.id);
              return (
                <div
                  key={process.id}
                  className={`process-card process-card-${processStatus} ${isSpinLock ? 'spin-card' : ''}`}
                >
                  {processStatus === 'spinning' && (
                    <div className="spin-overlay">
                      <div className="spin-ring"></div>
                      <div className="spin-count-badge">#{spinCounts[process.id] || 0}</div>
                    </div>
                  )}

                  <div className="process-header">
                    <span className="process-id">
                      {processStatus === 'spinning' && <span className="spin-dot"></span>}
                      Process {process.id}
                    </span>
                    <span className={`process-status status-${processStatus}`}>
                      {processStatus === 'spinning' ? `SPINNING` : processStatus.toUpperCase()}
                    </span>
                  </div>

                  {processStatus === 'spinning' && (
                    <div className="spin-info">
                      <div className="spin-loop-text">
                        while(lock == 1) {'{'} {'{'} {'}'} {'}'}
                      </div>
                    </div>
                  )}

                  <div className="process-actions">
                    <button
                      className={`${isSpinLock ? 'btn-spin-acquire' : 'btn-success'}`}
                      onClick={() => acquireLock(process.id)}
                      disabled={processStatus === 'active' || processStatus === 'waiting' || processStatus === 'spinning'}
                    >
                      {isSpinLock ? '⚡ Acquire' : '🔒 Acquire'}
                    </button>
                    <button
                      className="btn-warning"
                      onClick={() => releaseLock(process.id)}
                      disabled={processStatus !== 'active'}
                    >
                      🔓 Release
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="comparison-section">
        <h2>📋 Mutex vs Spin Lock</h2>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className={!isSpinLock ? 'highlight-col' : ''}>Mutex Lock</th>
              <th className={isSpinLock ? 'highlight-col-spin' : ''}>Spin Lock</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Wait Method</td>
              <td className={!isSpinLock ? 'highlight-col' : ''}>Sleep (Queue)</td>
              <td className={isSpinLock ? 'highlight-col-spin' : ''}>Busy Wait (Loop)</td>
            </tr>
            <tr>
              <td>CPU Usage</td>
              <td className={!isSpinLock ? 'highlight-col' : ''}>Low</td>
              <td className={isSpinLock ? 'highlight-col-spin' : ''}>High</td>
            </tr>
            <tr>
              <td>Context Switch</td>
              <td className={!isSpinLock ? 'highlight-col' : ''}>Yes</td>
              <td className={isSpinLock ? 'highlight-col-spin' : ''}>No</td>
            </tr>
            <tr>
              <td>Best For</td>
              <td className={!isSpinLock ? 'highlight-col' : ''}>Long waits</td>
              <td className={isSpinLock ? 'highlight-col-spin' : ''}>Short waits</td>
            </tr>
            <tr>
              <td>Overhead</td>
              <td className={!isSpinLock ? 'highlight-col' : ''}>High (sleep/wake)</td>
              <td className={isSpinLock ? 'highlight-col-spin' : ''}>Low (no switching)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
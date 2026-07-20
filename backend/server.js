const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ============ MUTEX CLASS ============
class Mutex {
  constructor() {
    this.locked = false;
    this.waitingQueue = [];
    this.currentProcess = null;
  }

  // Simple mutex: process sleeps in queue if lock not available
  async acquire(processId) {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        this.currentProcess = processId;
        resolve({ 
          success: true, 
          processId, 
          type: 'mutex',
          message: `Process ${processId} acquired mutex lock` 
        });
      } else {
        // Add to waiting queue (sleep)
        if (!this.waitingQueue.includes(processId)) {
          this.waitingQueue.push(processId);
        }
        resolve({ 
          success: false, 
          processId, 
          type: 'mutex',
          message: `Process ${processId} added to waiting queue (sleeping)`, 
          queue: [...this.waitingQueue] 
        });
      }
    });
  }

  release(processId) {
    if (this.locked && this.currentProcess === processId) {
      this.locked = false;
      this.currentProcess = null;
      
      // Wake up next process in queue
      if (this.waitingQueue.length > 0) {
        const nextProcess = this.waitingQueue.shift();
        this.locked = true;
        this.currentProcess = nextProcess;
        return { 
          success: true, 
          type: 'mutex',
          message: `Lock released. Process ${nextProcess} woken up and acquired lock`, 
          nextProcess 
        };
      }
      
      return { success: true, type: 'mutex', message: `Process ${processId} released lock` };
    }
    return { success: false, type: 'mutex', message: `Process ${processId} does not hold the lock` };
  }

  getStatus() {
    return {
      type: 'mutex',
      locked: this.locked,
      currentProcess: this.currentProcess,
      waitingQueue: [...this.waitingQueue],
      queueLength: this.waitingQueue.length
    };
  }

  reset() {
    this.locked = false;
    this.currentProcess = null;
    this.waitingQueue = [];
  }
}

// ============ SPIN LOCK CLASS ============
class SpinLock {
  constructor() {
    this.locked = false;
    this.currentProcess = null;
    this.spinningProcesses = new Map(); // Track spinning processes and their spin counts
  }

  // Spin lock: process busy waits (spins) until lock available
  async acquire(processId) {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        this.currentProcess = processId;
        this.spinningProcesses.delete(processId);
        resolve({ 
          success: true, 
          processId, 
          type: 'spinlock',
          message: `Process ${processId} acquired spin lock`,
          spinCount: this.spinningProcesses.get(processId) || 0
        });
      } else {
        // Start spinning (busy waiting)
        const currentSpins = this.spinningProcesses.get(processId) || 0;
        this.spinningProcesses.set(processId, currentSpins + 1);
        
        resolve({ 
          success: false, 
          processId, 
          type: 'spinlock',
          isSpinning: true,
          message: `Process ${processId} spinning... (busy waiting)`, 
          spinCount: currentSpins + 1
        });
      }
    });
  }

  release(processId) {
    if (this.locked && this.currentProcess === processId) {
      this.locked = false;
      this.currentProcess = null;
      
      return { 
        success: true, 
        type: 'spinlock',
        message: `Process ${processId} released spin lock` 
      };
    }
    return { success: false, type: 'spinlock', message: `Process ${processId} does not hold the spin lock` };
  }

  getStatus() {
    const spinning = [];
    this.spinningProcesses.forEach((count, pid) => {
      spinning.push({ processId: pid, spinCount: count });
    });

    return {
      type: 'spinlock',
      locked: this.locked,
      currentProcess: this.currentProcess,
      spinningProcesses: spinning,
      spinningCount: spinning.length
    };
  }

  reset() {
    this.locked = false;
    this.currentProcess = null;
    this.spinningProcesses.clear();
  }
}

// ============ INITIALIZE LOCKS ============
const mutex = new Mutex();
const spinLock = new SpinLock();

// ============ MUTEX API ROUTES ============

// Get mutex status
app.get('/api/mutex/status', (req, res) => {
  res.json(mutex.getStatus());
});

// Acquire mutex lock
app.post('/api/mutex/lock', (req, res) => {
  const { processId } = req.body;
  
  if (!processId && processId !== 0) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  
  mutex.acquire(processId).then(result => {
    res.json(result);
  });
});

// Release mutex lock
app.post('/api/mutex/unlock', (req, res) => {
  const { processId } = req.body;
  
  if (!processId && processId !== 0) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  
  const result = mutex.release(processId);
  res.json(result);
});

// Reset mutex
app.post('/api/mutex/reset', (req, res) => {
  mutex.reset();
  res.json({ success: true, message: 'Mutex reset successfully' });
});

// ============ SPIN LOCK API ROUTES ============

// Get spin lock status
app.get('/api/spinlock/status', (req, res) => {
  res.json(spinLock.getStatus());
});

// Acquire spin lock
app.post('/api/spinlock/lock', (req, res) => {
  const { processId } = req.body;
  
  if (!processId && processId !== 0) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  
  spinLock.acquire(processId).then(result => {
    res.json(result);
  });
});

// Release spin lock
app.post('/api/spinlock/unlock', (req, res) => {
  const { processId } = req.body;
  
  if (!processId && processId !== 0) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  
  const result = spinLock.release(processId);
  res.json(result);
});

// Reset spin lock
app.post('/api/spinlock/reset', (req, res) => {
  spinLock.reset();
  res.json({ success: true, message: 'Spin Lock reset successfully' });
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Mutex and Spin Lock API is running',
    endpoints: {
      mutex: ['/api/mutex/status', '/api/mutex/lock', '/api/mutex/unlock', '/api/mutex/reset'],
      spinlock: ['/api/spinlock/status', '/api/spinlock/lock', '/api/spinlock/unlock', '/api/spinlock/reset']
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mutex API: http://localhost:${PORT}/api/mutex`);
  console.log(`Spin Lock API: http://localhost:${PORT}/api/spinlock`);
});
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Mutex implementation for process synchronization
class Mutex {
  constructor() {
    this.locked = false;
    this.waitingQueue = [];
    this.processId = 0;
  }

  // Peterson's Algorithm for two processes
  petersonLock(processId, turn) {
    const other = 1 - processId;
    const flag = [false, false];
    
    flag[processId] = true;
    turn = other;
    
    while (flag[other] && turn === other) {
      // Busy waiting
    }
    
    // Critical section
    return true;
  }

  petersonUnlock(processId) {
    // Implementation would reset the flag
  }

  // Bakery Algorithm for N processes
  bakeryLock(processId, n) {
    const choosing = new Array(n).fill(false);
    const number = new Array(n).fill(0);
    
    choosing[processId] = true;
    
    // Find max number and assign next
    let maxNum = 0;
    for (let i = 0; i < n; i++) {
      if (number[i] > maxNum) {
        maxNum = number[i];
      }
    }
    number[processId] = maxNum + 1;
    choosing[processId] = false;
    
    // Wait until it's our turn
    for (let j = 0; j < n; j++) {
      while (choosing[j]) { /* busy wait */ }
      while (number[j] !== 0 && (number[j] < number[processId] || (number[j] === number[processId] && j < processId))) {
        // busy wait
      }
    }
    
    return true;
  }

  // Simple mutex lock using atomic operations simulation
  async acquireLock(processId, algorithm = 'simple') {
    return new Promise((resolve) => {
      if (algorithm === 'spinlock') {
        if (!this.locked) {
          this.locked = true;
          this.processId = processId;
          resolve({ success: true, processId, message: `Process ${processId} acquired spin lock` });
        } else {
          resolve({ success: false, isSpinning: true, processId, message: `Process ${processId} spinning...` });
        }
      } else {
        if (!this.locked) {
          this.locked = true;
          this.processId = processId;
          resolve({ success: true, processId, message: `Process ${processId} acquired lock` });
        } else {
          if (!this.waitingQueue.includes(processId)) {
            this.waitingQueue.push(processId);
          }
          resolve({ success: false, processId, message: `Process ${processId} waiting in queue`, queue: [...this.waitingQueue] });
        }
      }
    });
  }

  releaseLock(processId) {
    if (this.locked && this.processId === processId) {
      this.locked = false;
      this.processId = null;
      
      // Process next in queue
      if (this.waitingQueue.length > 0) {
        const nextProcess = this.waitingQueue.shift();
        this.locked = true;
        this.processId = nextProcess;
        return { success: true, message: `Lock released. Process ${nextProcess} acquired lock`, nextProcess };
      }
      
      return { success: true, message: `Process ${processId} released lock` };
    }
    return { success: false, message: `Process ${processId} does not hold the lock` };
  }

  getStatus() {
    return {
      locked: this.locked,
      currentProcess: this.processId,
      waitingQueue: [...this.waitingQueue],
      queueLength: this.waitingQueue.length
    };
  }
}

const mutex = new Mutex();

// API Routes

// Get mutex status
app.get('/api/mutex/status', (req, res) => {
  res.json(mutex.getStatus());
});

// Acquire lock
app.post('/api/mutex/lock', (req, res) => {
  const { processId, algorithm } = req.body;
  
  if (!processId) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  
  mutex.acquireLock(processId, algorithm).then(result => {
    res.json(result);
  });
});

// Release lock
app.post('/api/mutex/unlock', (req, res) => {
  const { processId } = req.body;
  
  if (!processId) {
    return res.status(400).json({ error: 'Process ID is required' });
  }
  
  const result = mutex.releaseLock(processId);
  res.json(result);
});

// Reset mutex
app.post('/api/mutex/reset', (req, res) => {
  mutex.locked = false;
  mutex.processId = null;
  mutex.waitingQueue = [];
  res.json({ success: true, message: 'Mutex reset successfully' });
});

// Simulate multiple processes
app.post('/api/mutex/simulate', (req, res) => {
  const { numProcesses } = req.body;
  const results = [];
  
  for (let i = 0; i < numProcesses; i++) {
    results.push({
      processId: i,
      action: 'requesting',
      timestamp: Date.now()
    });
  }
  
  res.json({ simulation: results, message: `Simulating ${numProcesses} processes` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
# Mutex vs Spin Lock Visualization

A comprehensive web-based visualization comparing Mutex and Spin Lock synchronization mechanisms, built with React frontend and Node.js backend.

## 🎯 Project Structure

```
mutex lock/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        └── App.js
```

## ✨ Features

- **🔒 Mutex Lock Implementation**: Demonstrates mutual exclusion with waiting queue
- **🔄 Spin Lock Implementation**: Shows busy waiting with real-time spin counter
- **⚡ Separate UI Tabs**: Easy switching between Mutex and Spin Lock modes
- **🎨 Distinct Visual Themes**: Purple theme for Mutex, Cyan theme for Spin Lock
- **📊 Real-time Status**: Live updates of lock state, owner, and queue/spinning status
- **🎬 Animations**: Smooth transitions and visual feedback for better understanding
- **📋 Comparison Table**: Side-by-side comparison of both mechanisms
- **🔧 Process Management**: Create and manage multiple processes (2-10)

## 🚀 Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```
   
   The server will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   
   The application will open at `http://localhost:3000`

## 📖 How to Use

### 1. Choose Your Lock Type
- Use the **tab switcher** at the top to select either:
  - 🔒 **Mutex Lock** - Processes sleep in queue when lock is unavailable
  - 🔄 **Spin Lock** - Processes busy wait (spin) until lock becomes available

### 2. Initialize Processes
- Set the number of processes (2-10) using the input field
- Click **"Initialize Processes"** to create process cards

### 3. Acquire Lock
- Click **"🔒 Acquire"** (Mutex) or **"⚡ Acquire"** (Spin Lock) on any process card

**Mutex Behavior:**
- If lock is available → Process acquires it and shows as **ACTIVE** (green)
- If lock is held → Process is added to **waiting queue** and shows as **WAITING** (yellow)

**Spin Lock Behavior:**
- If lock is available → Process acquires it and shows as **ACTIVE** (green)
- If lock is held → Process starts **spinning** with animated counter (cyan)

### 4. Release Lock
- Click **"🔓 Release"** on an active process to release the lock

**Mutex Behavior:**
- Next process in waiting queue automatically acquires the lock

**Spin Lock Behavior:**
- Lock becomes free, next spinning process acquires it

### 5. Reset
- Click **"Reset All"** to clear all locks and reset the system

## 🔧 API Endpoints

### Backend API (Port 5000)

#### Mutex Endpoints
- `GET /api/mutex/status` - Get current mutex status
- `POST /api/mutex/lock` - Acquire mutex lock
  - Body: `{ processId: number }`
- `POST /api/mutex/unlock` - Release mutex lock
  - Body: `{ processId: number }`
- `POST /api/mutex/reset` - Reset mutex to initial state

#### Spin Lock Endpoints
- `GET /api/spinlock/status` - Get current spin lock status
- `POST /api/spinlock/lock` - Acquire spin lock
  - Body: `{ processId: number }`
- `POST /api/spinlock/unlock` - Release spin lock
  - Body: `{ processId: number }`
- `POST /api/spinlock/reset` - Reset spin lock to initial state

#### Health Check
- `GET /api/health` - API health check with endpoint list

## 📊 Response Formats

### Mutex Status Response
```json
{
  "type": "mutex",
  "locked": true,
  "currentProcess": 0,
  "waitingQueue": [1, 2],
  "queueLength": 2
}
```

### Spin Lock Status Response
```json
{
  "type": "spinlock",
  "locked": true,
  "currentProcess": 0,
  "spinningProcesses": [
    { "processId": 1, "spinCount": 5 },
    { "processId": 2, "spinCount": 3 }
  ],
  "spinningCount": 2
}
```

## 🎨 Visual Themes

### Mutex Lock (Purple Theme)
- **Primary Color**: Purple (#667eea)
- **Waiting Queue**: Animated queue items with slide-in effect
- **Process States**: 
  - IDLE (gray)
  - ACTIVE (green glow)
  - WAITING (yellow glow)

### Spin Lock (Cyan Theme)
- **Primary Color**: Cyan (#00e5ff)
- **Spinning Animation**: Rotating spinner with counter
- **Process States**:
  - IDLE (gray)
  - ACTIVE (green glow)
  - SPINNING (cyan pulse animation)

## 📚 Understanding the Concepts

### Mutex Lock
A **Mutex (Mutual Exclusion)** is a synchronization mechanism that ensures only one process can access a critical section at a time. When a process requests a lock:

1. If lock is free → Process acquires it
2. If lock is held → Process is added to waiting queue and **sleeps**
3. When lock is released → Next process in queue is **woken up** and acquires lock

**Advantages:**
- Low CPU usage (processes sleep while waiting)
- No wasted CPU cycles
- Good for long wait times

**Disadvantages:**
- Context switch overhead
- Higher latency due to sleep/wake operations

### Spin Lock
A **Spin Lock** is a synchronization mechanism where a process continuously checks (spins) in a loop until the lock becomes available:

1. If lock is free → Process acquires it
2. If lock is held → Process **busy waits** (spins) in a loop
3. Process keeps polling until lock becomes available

**Advantages:**
- No context switch overhead
- Low latency for short waits
- Efficient for short critical sections

**Disadvantages:**
- High CPU usage (wastes cycles while spinning)
- Not suitable for long waits
- Can cause performance degradation

## 🆚 Comparison: Mutex vs Spin Lock

| Feature | Mutex Lock | Spin Lock |
|---------|-----------|-----------|
| **Wait Method** | Sleep (Queue) | Busy Wait (Loop) |
| **CPU Usage** | Low | High |
| **Context Switch** | Yes | No |
| **Best For** | Long waits | Short waits |
| **Overhead** | High (sleep/wake) | Low (no switching) |
| **Process State** | Sleeping | Running (spinning) |
| **Queue Management** | Yes (FIFO) | No (race to acquire) |

## 🛠️ Technologies Used

- **Frontend**: React 18, Axios, CSS3
- **Backend**: Node.js, Express.js, CORS
- **Concepts**: Process Synchronization, Mutual Exclusion, Critical Sections, Busy Waiting

## 🎓 Learning Objectives

- Understand the difference between mutex and spin locks
- Learn about race conditions and how locks prevent them
- Visualize process synchronization in real-time
- Understand waiting queues vs busy waiting
- See CPU usage implications of each approach
- Learn when to use which synchronization mechanism

## 🔮 Future Enhancements

- Implement Peterson's and Bakery algorithms with visualization
- Add deadlock detection and prevention
- Implement priority-based scheduling
- Add performance metrics and timing analysis
- Support for multiple mutex resources
- Add real CPU usage monitoring
- Implement lock convoy visualization

## 📝 License

This project is created for educational purposes to understand process synchronization concepts.

## 👨‍💻 Author

Created as a learning tool for operating system concepts, specifically process synchronization and mutual exclusion mechanisms.
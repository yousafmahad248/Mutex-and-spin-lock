# Mutex Algorithm Visualization

A web-based visualization of mutex algorithm for process synchronization, built with React frontend and Node.js backend.

## Project Structure

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

## Features

- **Mutex Lock Implementation**: Demonstrates mutual exclusion algorithm
- **Process Management**: Create and manage multiple processes
- **Real-time Visualization**: Watch processes acquire and release locks
- **Waiting Queue**: Visualize processes waiting for the lock
- **Status Monitoring**: Real-time mutex status updates

## Algorithms Implemented

1. **Simple Mutex**: Basic mutual exclusion with waiting queue
2. **Peterson's Algorithm**: For two-process synchronization
3. **Bakery Algorithm**: For N-process synchronization

## Installation & Setup

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

## How to Use

1. **Initialize Processes**: Use the input field to set the number of processes (2-10) and click "Initialize Processes"

2. **Acquire Lock**: Click "Acquire Lock" on any process card to request the mutex lock
   - If the lock is available, the process will acquire it and show as "ACTIVE"
   - If the lock is held by another process, the requesting process will be added to the waiting queue and show as "WAITING"

3. **Release Lock**: Click "Release Lock" on an active process to release the mutex
   - The next process in the waiting queue will automatically acquire the lock

4. **Reset Mutex**: Click "Reset Mutex" to clear all locks and reset the system

## API Endpoints

### Backend API (Port 5000)

- `GET /api/mutex/status` - Get current mutex status
- `POST /api/mutex/lock` - Acquire mutex lock
  - Body: `{ processId: number, algorithm: string }`
- `POST /api/mutex/unlock` - Release mutex lock
  - Body: `{ processId: number }`
- `POST /api/mutex/reset` - Reset mutex to initial state
- `POST /api/mutex/simulate` - Simulate multiple processes

## Mutex Status Response

```json
{
  "locked": true,
  "currentProcess": 0,
  "waitingQueue": [1, 2],
  "queueLength": 2
}
```

## Technologies Used

- **Frontend**: React 18, Axios, CSS3
- **Backend**: Node.js, Express.js, CORS
- **Concepts**: Process Synchronization, Mutual Exclusion, Critical Sections

## Learning Objectives

- Understand mutex locks and mutual exclusion
- Learn about race conditions and how mutex prevents them
- Visualize process synchronization in real-time
- Understand waiting queues and process scheduling

## Future Enhancements

- Implement Peterson's and Bakery algorithms with visualization
- Add deadlock detection and prevention
- Implement priority-based scheduling
- Add performance metrics and timing analysis
- Support for multiple mutex resources
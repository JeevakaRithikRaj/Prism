# PRISM - Predictive Reliability & Intelligent Systems for Maintenance

An AI-driven predictive maintenance system for manufacturing plants that monitors multiple machines, detects early degradation patterns, classifies machine health states, and provides human-readable explanations using explainable AI techniques.

## Features

- **Multi-Machine Monitoring**: Track 4 manufacturing machines simultaneously (CNC Mill, Cooling Pump, Conveyor Motor, Air Compressor)
- **Health State Classification**: Automatic classification into Normal, Advisory, Action Required, or Post-Maintenance states
- **Explainable AI**: Human-readable explanations using deterministic template-based logic
- **Bearing Vibration Evidence**: CWRU dataset integration for bearing fault diagnosis
- **State-Based Simulation**: Deterministic simulation engine for reliable demonstrations
- **Offline Operation**: Runs entirely on local datasets without external dependencies

## Table of Contents

- [Prerequisites](#prerequisites)
- [Dataset Requirements](#dataset-requirements)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
  - [Start Backend Server](#start-backend-server)
  - [Start Frontend Dev Server](#start-frontend-dev-server)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Testing](#testing)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Python**: 3.9 or higher
  - Check version: `python --version` or `python3 --version`
  - Download: [python.org](https://www.python.org/downloads/)

- **Node.js**: 18.x or higher
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **npm**: 9.x or higher (comes with Node.js)
  - Check version: `npm --version`

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: ~500MB for dependencies and datasets
- **CPU**: No GPU required - runs entirely on CPU

## Dataset Requirements

The system requires the following dataset files in the `datasets/` directory:

### AI4I 2020 Predictive Maintenance Dataset
- **File**: `ai4i2020.csv`
- **Source**: UCI Machine Learning Repository
- **Size**: ~10,000 rows
- **Description**: Synthetic dataset reflecting real predictive maintenance data

### CWRU Bearing Dataset
- **Files**:
  - `Time_Normal_1_098.mat` - Normal bearing condition
  - `B014_1_190.mat` - Ball defect (0.014 inches)
  - `IR014_1_175.mat` - Inner race defect (0.014 inches)
  - `OR014_6_1_202.mat` - Outer race defect (0.014 inches)
  - `feature_time_48k_2048_load_1.csv` - Extracted features (optional)
- **Source**: Case Western Reserve University Bearing Data Center
- **Format**: MATLAB .mat files containing vibration data

**Note**: All required dataset files are included in the `datasets/` directory. See `datasets/README.md` for detailed information.

## Installation

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   
   # Linux/Mac
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   ```bash
   # Windows (Command Prompt)
   venv\Scripts\activate
   
   # Windows (PowerShell)
   venv\Scripts\Activate.ps1
   
   # Linux/Mac
   source venv/bin/activate
   ```

4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

   **Dependencies installed**:
   - `fastapi==0.109.0` - Web framework
   - `pandas` - Data manipulation
   - `numpy` - Numerical computing
   - `scipy` - Scientific computing (.mat file loading)
   - `scikit-learn` - Machine learning (Isolation Forest)
   - `uvicorn==0.27.0` - ASGI server
   - `hypothesis==6.98.0` - Property-based testing
   - `python-multipart==0.0.6` - Form data parsing

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

   **Dependencies installed**:
   - `react` - UI library
   - `react-dom` - React DOM rendering
   - `react-router-dom` - Client-side routing
   - `axios` - HTTP client for API calls
   - `recharts` - Time-series chart visualization
   - `vite` - Build tool and dev server

## Running the Application

### Start Backend Server

1. **Navigate to the backend directory** (if not already there):
   ```bash
   cd backend
   ```

2. **Activate the virtual environment** (if not already activated):
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload
   ```

   **Expected output**:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Initializing PRISM system...
   INFO:     Loading AI4I dataset...
   INFO:     Loaded AI4I dataset: 10000 rows
   INFO:     Creating machine slices and identifying state windows...
   INFO:     Slice manager initialized
   INFO:     Initializing simulation engine...
   INFO:     Simulation engine initialized
   INFO:     Explanation engine initialized
   INFO:     CWRU evidence provider initialized
   INFO:     PRISM system initialization complete
   INFO:     Application startup complete.
   ```

4. **Verify the backend is running**:
   - Open browser to: http://localhost:8000
   - API documentation: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

### Start Frontend Dev Server

1. **Open a new terminal** (keep backend running in the first terminal)

2. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

   **Expected output**:
   ```
   VITE v5.0.11  ready in 500 ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ➜  press h to show help
   ```

4. **Open the application**:
   - Open browser to: http://localhost:5173
   - The PRISM dashboard should load showing all 4 machines

**Important**: The backend must be running before starting the frontend, as the frontend makes API calls to http://localhost:8000.

## API Endpoints

The PRISM backend provides the following REST API endpoints:

### Health & Status

#### `GET /`
Root endpoint returning API information.

**Response**:
```json
{
  "message": "PRISM API",
  "version": "1.0.0",
  "status": "running"
}
```

#### `GET /health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy"
}
```

### Machine Monitoring

#### `GET /api/machines`
Get current state for all machines.

**Response**:
```json
{
  "machines": [
    {
      "machine_id": "CNC-MILL-01",
      "machine_name": "CNC Milling Machine",
      "health_state": "Normal",
      "one_line_summary": "Operating normally with all sensors in range"
    },
    ...
  ],
  "global_alerts": [
    {
      "machine_id": "COOL-PUMP-02",
      "machine_name": "Industrial Cooling Pump",
      "health_state": "Action Required",
      "one_line_summary": "Critical temperature and vibration levels detected"
    }
  ],
  "global_advisories": [
    {
      "machine_id": "CONV-MOTOR-01",
      "machine_name": "Conveyor Drive Motor",
      "health_state": "Advisory",
      "one_line_summary": "Elevated vibration levels detected"
    }
  ]
}
```

#### `GET /api/machines/{machine_id}`
Get detailed information for a specific machine.

**Parameters**:
- `machine_id` (path): Machine identifier (e.g., "CNC-MILL-01", "COOL-PUMP-02", "CONV-MOTOR-01", "AIR-COMP-01")

**Response**:
```json
{
  "machine_id": "CNC-MILL-01",
  "machine_name": "CNC Milling Machine",
  "health_state": "Advisory",
  "cursor_position": 150,
  "current_window": {
    "state": "Advisory",
    "start_index": 100,
    "end_index": 200
  },
  "sensor_readings": {
    "temperature": 305.2,
    "air_temperature": 300.1,
    "rotational_speed": 1500.0,
    "torque": 45.3,
    "tool_wear": 120.0,
    "vibration": 52.5
  },
  "sensor_history": [
    {
      "temperature": 303.1,
      "air_temperature": 299.5,
      "rotational_speed": 1480.0,
      "torque": 44.1,
      "tool_wear": 118.0,
      "vibration": 48.2
    },
    ...
  ],
  "explanation": "Vibration levels are increasing, indicating potential bearing wear or shaft imbalance. Temperature remains within acceptable range.",
  "affected_component": "Bearings",
  "recommended_action": "Schedule bearing inspection within 48 hours. Monitor vibration trends closely.",
  "bearing_evidence": {
    "health_state": "Advisory",
    "vibration_data": [0.012, 0.015, ...],
    "sample_rate": 12000,
    "description": "Ball defect vibration signature detected"
  }
}
```

**Error Responses**:
- `404 Not Found`: Invalid machine_id
- `500 Internal Server Error`: System initialization error

### Simulation Control

#### `POST /api/simulation/control`
Set machine scenario (jump to specific health state).

**Request Body**:
```json
{
  "machine_id": "CNC-MILL-01",
  "scenario": "Advisory"
}
```

**Valid scenarios**: "Normal", "Advisory", "Action Required", "Post-Maintenance"

**Response**:
```json
{
  "success": true,
  "machine_id": "CNC-MILL-01",
  "scenario": "Advisory",
  "new_state": {
    "machine_id": "CNC-MILL-01",
    "machine_name": "CNC Milling Machine",
    "health_state": "Advisory",
    "cursor_position": 100,
    "one_line_summary": "Elevated vibration levels detected"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid machine_id or scenario
- `500 Internal Server Error`: System error

#### `POST /api/simulation/advance`
Advance simulation cursor forward.

**Request Body**:
```json
{
  "machine_id": "CNC-MILL-01",
  "steps": 1
}
```

**Response**:
```json
{
  "success": true,
  "machine_id": "CNC-MILL-01",
  "steps": 1,
  "new_state": {
    "machine_id": "CNC-MILL-01",
    "machine_name": "CNC Milling Machine",
    "health_state": "Advisory",
    "cursor_position": 101,
    "one_line_summary": "Elevated vibration levels detected"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid machine_id or negative steps
- `500 Internal Server Error`: System error

## Project Structure

```
prism-predictive-maintenance/
├── backend/                          # FastAPI backend server
│   ├── main.py                       # API endpoints and application entry
│   ├── dataset_loader.py             # Dataset loading (AI4I, CWRU)
│   ├── slice_manager.py              # Data partitioning and state windows
│   ├── simulation_engine.py          # State-based simulation engine
│   ├── health_classifier.py          # Health state classification
│   ├── explanation_engine.py         # Explainable AI logic
│   ├── cwru_evidence_provider.py     # Bearing vibration evidence
│   ├── requirements.txt              # Python dependencies
│   ├── test_*.py                     # Unit and property tests
│   └── README.md                     # Backend documentation
│
├── frontend/                         # React frontend application
│   ├── src/
│   │   ├── App.jsx                   # Main application component
│   │   ├── components/
│   │   │   ├── Dashboard.jsx         # Main dashboard view
│   │   │   ├── MachineCard.jsx       # Machine status card
│   │   │   ├── MachineDetail.jsx     # Detailed machine view
│   │   │   ├── SensorReadings.jsx    # Sensor data display
│   │   │   ├── TrendCharts.jsx       # Time-series charts
│   │   │   ├── ExplanationPanel.jsx  # AI explanation display
│   │   │   ├── BearingEvidencePanel.jsx  # Bearing vibration charts
│   │   │   ├── SimulationControlPanel.jsx  # Simulation controls
│   │   │   ├── GlobalAlerts.jsx      # Critical alerts section
│   │   │   ├── GlobalAdvisories.jsx  # Advisory warnings section
│   │   │   └── Header.jsx            # Navigation header
│   │   └── test/                     # Frontend tests
│   ├── package.json                  # Node.js dependencies
│   ├── vite.config.js                # Vite configuration
│   └── README.md                     # Frontend documentation
│
├── datasets/                         # Local datasets
│   ├── ai4i2020.csv                  # AI4I predictive maintenance data
│   ├── Time_Normal_1_098.mat         # CWRU normal bearing data
│   ├── B014_1_190.mat                # CWRU ball defect data
│   ├── IR014_1_175.mat               # CWRU inner race defect data
│   ├── OR014_6_1_202.mat             # CWRU outer race defect data
│   ├── feature_time_48k_2048_load_1.csv  # CWRU features (optional)
│   └── README.md                     # Dataset documentation
│
└── .kiro/                            # Kiro spec files
    └── specs/
        └── prism-predictive-maintenance/
            ├── requirements.md       # System requirements
            ├── design.md             # Architecture and design
            └── tasks.md              # Implementation tasks
```

## Technology Stack

### Backend Technologies

- **FastAPI 0.109.0**: Modern Python web framework with automatic API documentation
- **pandas**: Data manipulation and analysis for AI4I dataset
- **numpy**: Numerical computing for sensor data processing
- **scipy**: Scientific computing library for loading MATLAB .mat files
- **scikit-learn**: Machine learning library (Isolation Forest for anomaly detection)
- **uvicorn 0.27.0**: Lightning-fast ASGI server
- **hypothesis 6.98.0**: Property-based testing framework

### Frontend Technologies

- **React 18.2**: Modern UI library with hooks and functional components
- **Vite 5.0**: Next-generation frontend build tool
- **React Router 6.21**: Declarative routing for React applications
- **axios 1.6**: Promise-based HTTP client for API calls
- **Recharts 2.10**: Composable charting library for time-series visualization

### Key Design Principles

- **Offline-First**: No external API calls or internet connectivity required
- **Deterministic**: Same inputs always produce same outputs
- **Explainable AI**: Template-based explanations, no black-box models
- **CPU-Only**: No GPU required, runs on any modern CPU
- **Lightweight ML**: Isolation Forest for anomaly detection, threshold-based classification

## Testing

### Backend Tests

Run all backend tests:
```bash
cd backend
pytest
```

Run with coverage:
```bash
pytest --cov=. --cov-report=html
```

Run property-based tests only:
```bash
pytest -k "property" -v
```

**Test Categories**:
- **Unit Tests**: Specific examples and edge cases
- **Property Tests**: Universal properties across random inputs (100+ iterations)
- **Integration Tests**: API endpoint testing
- **Offline Tests**: Verify no external API calls

### Frontend Tests

Run frontend tests:
```bash
cd frontend
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

**Test Categories**:
- **Component Tests**: React component rendering and behavior
- **Integration Tests**: End-to-end user flows
- **Responsive Tests**: Mobile, tablet, desktop layouts

## Development

### Development Workflow

This project follows a spec-driven development methodology:

1. **Requirements** (`.kiro/specs/prism-predictive-maintenance/requirements.md`)
   - 18 detailed requirements with acceptance criteria
   - User stories for each feature

2. **Design** (`.kiro/specs/prism-predictive-maintenance/design.md`)
   - System architecture and component design
   - 19 correctness properties for property-based testing
   - Data models and API specifications

3. **Tasks** (`.kiro/specs/prism-predictive-maintenance/tasks.md`)
   - 17 major tasks with subtasks
   - Incremental implementation plan
   - Test-driven development approach

### Adding New Features

1. Update requirements.md with new acceptance criteria
2. Update design.md with component changes and properties
3. Add tasks to tasks.md
4. Implement with tests (unit + property tests)
5. Update API documentation in this README

### Code Style

- **Python**: Follow PEP 8 style guide
- **JavaScript**: Use ESLint with React recommended rules
- **Comments**: Document complex logic and design decisions
- **Docstrings**: All Python classes and methods should have docstrings

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError` when starting backend
- **Solution**: Ensure virtual environment is activated and dependencies are installed:
  ```bash
  cd backend
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt
  ```

**Problem**: `FileNotFoundError` for dataset files
- **Solution**: Verify all dataset files exist in `datasets/` directory:
  ```bash
  ls datasets/
  # Should show: ai4i2020.csv and all .mat files
  ```

**Problem**: Backend starts but crashes during initialization
- **Solution**: Check dataset file integrity. Re-download corrupted files.

**Problem**: Port 8000 already in use
- **Solution**: Kill existing process or use different port:
  ```bash
  uvicorn main:app --reload --port 8001
  ```

### Frontend Issues

**Problem**: `npm install` fails
- **Solution**: Clear npm cache and retry:
  ```bash
  npm cache clean --force
  npm install
  ```

**Problem**: Frontend can't connect to backend
- **Solution**: 
  1. Verify backend is running on http://localhost:8000
  2. Check CORS configuration in `backend/main.py`
  3. Check browser console for error messages

**Problem**: Charts not rendering
- **Solution**: Verify Recharts is installed:
  ```bash
  npm list recharts
  # If not found: npm install recharts
  ```

**Problem**: Port 5173 already in use
- **Solution**: Vite will automatically try next available port (5174, 5175, etc.)

### General Issues

**Problem**: System runs slowly
- **Solution**: 
  1. Reduce sensor history window size in API calls
  2. Increase available RAM
  3. Close other applications

**Problem**: Tests failing
- **Solution**:
  1. Ensure datasets are present and valid
  2. Check Python/Node.js versions match requirements
  3. Run tests with verbose output: `pytest -v` or `npm test -- --verbose`

**Problem**: Deterministic behavior not working
- **Solution**: Check that `random_state` is set in all ML models (Isolation Forest)

### Getting Help

- Check the spec files in `.kiro/specs/prism-predictive-maintenance/`
- Review backend logs for detailed error messages
- Check browser console for frontend errors
- Verify all prerequisites are installed with correct versions

## License

This project is for educational and demonstration purposes.

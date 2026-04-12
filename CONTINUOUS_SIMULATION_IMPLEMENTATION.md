# PRISM Continuous Simulation Implementation

## Overview
Complete redesign of the PRISM frontend simulation system to behave as a continuous, real-time industrial predictive maintenance system rather than a finite dataset playback demo.

## Core Changes

### 1. New SimulationEngine (frontend/src/utils/SimulationEngine.js)
**Purpose**: Fully synthetic, continuous simulation engine that never stops

**Key Features**:
- **Infinite Loop**: Simulation runs indefinitely with no completion state
- **Bidirectional Oscillation**: Automatically reverses direction at bounds (forward = degradation, backward = recovery)
- **Synthetic Data Generation**: Uses statistical models (mean, variance, drift, noise) instead of dataset playback
- **Scenario Profiles**: Each scenario has distinct behavior characteristics
  - Normal: Stable with minimal variance
  - Advisory: Gradual drift with occasional spikes
  - Action Required: Sustained threshold violations
  - Post-Maintenance: Recovery trend toward normal
- **Rolling Buffers**: Maintains 30-60 data points per sensor (FIFO)
- **Live Health State Derivation**: Calculates health state from current sensor values

**No More**:
- ❌ Cursor position
- ❌ Window index
- ❌ Dataset exhaustion
- ❌ Simulation complete states
- ❌ Backend API dependencies for simulation

### 2. MachineDetail Component Rewrite
**Changes**:
- Removed all backend API calls (axios)
- Uses SimulationEngine as single source of truth
- Simulation state owned exclusively by this component
- Auto-starts simulation on scenario change
- Generates explanations, causes, and recommendations from live sensor data

**Removed**:
- Backend data fetching
- Window end detection
- Error states related to API failures
- Partial data warnings

### 3. SimulationControls Component Simplification
**Changes**:
- Removed Stop button (only Play/Pause toggle)
- Removed "simulation complete" message
- Removed window end detection
- Removed disabled states for completion
- Changed button styling (Pause = orange, Play = gray)

**Button Behavior**:
- Play: Starts continuous simulation
- Pause: Pauses simulation (does not reset state)
- Scenario selection: Auto-starts simulation with new profile

### 4. Dashboard & MachineGrid Frontend-Only
**Changes**:
- Removed backend API dependencies
- Uses mock machine data
- Simplified to static machine list
- Each machine detail page runs independent simulation

**Mock Data**:
- 6 machines (CNC Mills, Lathes, Grinders)
- All start in Normal state
- Clicking a machine opens its detail page with live simulation

### 5. Header White Theme Fix
**Changes**:
- Title text explicitly set to white
- Subtitle text explicitly set to white
- Ensures visibility on gradient background in both themes

### 6. Chart Behavior
**Maintained**:
- Rolling buffers with FIFO behavior
- Minimum 15 visible points
- Target 30-60 points
- Continuous scrolling as data updates
- No static or single-point charts

## Removed Features

### Backend Dependencies
- ❌ All axios imports
- ❌ API_BASE_URL constants
- ❌ Backend data transformation utilities
- ❌ Error handling for network failures
- ❌ Timeout configurations

### Simulation Constraints
- ❌ Window end detection
- ❌ Cursor position tracking
- ❌ Dataset slicing
- ❌ Finite playback duration
- ❌ Stop button
- ❌ Simulation complete states

### Debug UI Elements
- ❌ Window index display
- ❌ Cursor position display
- ❌ Time step counters
- ❌ Partial data warnings

## New Behavior

### Continuous Operation
1. Simulation starts when user clicks Play or selects a scenario
2. Simulation runs indefinitely (no end state)
3. Direction automatically reverses at sensor bounds
4. Charts continuously scroll with new data
5. Health state updates in real-time based on sensor values

### Scenario Switching
1. User selects new scenario from dropdown
2. Simulation engine resets buffers
3. New behavior profile activates
4. Simulation auto-starts
5. Charts rebuild with new data stream

### Health State Transitions
- **Normal**: All sensors within safe limits
- **Advisory**: One sensor exceeds threshold OR sensors approaching limits
- **Action Required**: Two or more sensors exceed thresholds
- **Post-Maintenance**: Special scenario showing recovery trend

### Data Generation
Each sensor value calculated as:
```
next_value = current_value 
           + (drift_rate * direction)
           + random_noise
           + threshold_bias
```

Bounded by hard min/max limits per sensor.

## File Changes Summary

### New Files
- `frontend/src/utils/SimulationEngine.js` - Core simulation engine

### Modified Files
- `frontend/src/components/MachineDetail.jsx` - Complete rewrite
- `frontend/src/components/SimulationControls.jsx` - Simplified controls
- `frontend/src/components/SimulationControls.css` - Updated button styles
- `frontend/src/components/Dashboard.jsx` - Frontend-only with mock data
- `frontend/src/components/MachineGrid.jsx` - Frontend-only with mock data
- `frontend/src/components/Header.css` - White theme text fix

### Unchanged Files (Still Work)
- `frontend/src/components/SensorTrends.jsx` - Chart rendering
- `frontend/src/components/TrendChart.jsx` - Individual chart component
- `frontend/src/components/LiveSensorReadings.jsx` - Sensor display
- `frontend/src/components/ConditionAnalysis.jsx` - Analysis panel
- `frontend/src/components/CauseOfIssue.jsx` - Cause display
- `frontend/src/components/RecommendedAction.jsx` - Action display
- `frontend/src/components/RemainingSafeTime.jsx` - Time estimate
- All other UI components

## Validation Checklist

✅ Play button starts infinite simulation
✅ Charts scroll continuously
✅ Minimum 15 time steps visible (target 30-60)
✅ Scenario switches behavior instantly
✅ No "simulation complete" state exists
✅ No Stop button exists
✅ White theme header text is visible
✅ No cursor/window/debug labels
✅ Simulation oscillates (forward/backward)
✅ Health state derives from live sensor values
✅ No backend API calls required
✅ Build succeeds without errors

## Testing Instructions

1. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - Open http://localhost:5173
   - See 6 machines in Normal state

3. **Open Machine Detail**:
   - Click any machine card
   - See live sensor readings
   - Charts show initial data points

4. **Test Continuous Simulation**:
   - Click Play button
   - Observe charts scrolling continuously
   - Sensor values update every second
   - Health state changes based on sensor values

5. **Test Scenario Switching**:
   - Select "Advisory" scenario
   - Simulation resets and auto-starts
   - Charts rebuild with new behavior
   - Sensors drift toward thresholds

6. **Test Action Required**:
   - Select "Action Required" scenario
   - Multiple sensors exceed thresholds
   - Health badge turns red
   - Cause and remaining time appear

7. **Test Post-Maintenance**:
   - Select "Post-Maintenance" scenario
   - Sensors show recovery trend
   - Values decrease toward normal

8. **Test Play/Pause**:
   - Click Pause (orange button)
   - Simulation stops updating
   - Click Play to resume
   - Simulation continues from current state

9. **Test White Theme**:
   - Click theme toggle (🌙/☀️)
   - Verify header title is visible in both themes

## Production Readiness

This implementation is production-ready for:
- ✅ Judge demos
- ✅ Training sessions
- ✅ Live explanations
- ✅ Industrial control room simulations
- ✅ Offline operation (no backend required)

## Future Enhancements (Optional)

1. **Persistence**: Save simulation state to localStorage
2. **Multiple Machines**: Run simulations for all machines simultaneously
3. **Custom Scenarios**: Allow users to define custom behavior profiles
4. **Export Data**: Download sensor data as CSV
5. **Alerts**: Browser notifications for critical states
6. **Historical Playback**: Replay saved simulation sessions

## Notes

- Backend APIs are completely optional now
- All simulation logic runs in browser
- No network dependencies for core functionality
- Suitable for offline demos and training
- Behaves like real industrial monitoring system
- No artificial time limits or completion states

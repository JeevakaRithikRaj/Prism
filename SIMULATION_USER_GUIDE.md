# PRISM Continuous Simulation - User Guide

## Quick Start

### Running the Application
```bash
cd frontend
npm install
npm run dev
```

Open browser to: http://localhost:5173

## Dashboard Overview

The dashboard shows all available machines in a grid layout:
- **Machine Cards**: Display machine name and current health state
- **Alerts Sidebar**: Shows machines requiring attention
- **Click any machine** to view detailed simulation

## Machine Detail Page

### Controls

**Scenario Selector**
- Dropdown menu with 4 scenarios
- Changing scenario resets and auto-starts simulation
- Scenarios:
  - **Normal**: Stable operation, all sensors within limits
  - **Advisory**: Gradual degradation, sensors approaching thresholds
  - **Action Required**: Critical state, multiple threshold violations
  - **Post-Maintenance**: Recovery mode, sensors returning to normal

**Play/Pause Button**
- **Play (▶)**: Starts continuous simulation
- **Pause (⏸)**: Pauses simulation (does not reset)
- Simulation auto-starts when scenario changes
- No stop button - simulation runs indefinitely

### Live Sensor Readings

Six sensors displayed in real-time:
1. **Temperature** (K) - Process temperature
2. **Air Temperature** (K) - Ambient temperature
3. **Vibration** (μm) - Mechanical vibration
4. **Torque** (Nm) - Motor torque
5. **Rotational Speed** (rpm) - Spindle speed
6. **Tool Wear** (min) - Cumulative tool usage

**Color Coding**:
- Green: Normal (within threshold)
- Red: Exceeded threshold

### Analysis Panels

**Condition Analysis**
- Real-time explanation of machine health
- Updates based on current sensor values
- Describes detected anomalies

**Cause of Issue** (Advisory/Action Required only)
- Identifies problematic sensors
- Explains mechanical implications
- Suggests root cause

**Recommended Action**
- Guidance based on health state
- Escalates from monitoring to emergency maintenance

**Remaining Safe Time** (Action Required only)
- Estimates time until critical failure
- Based on severity of threshold violations

### Sensor Trend Charts

**Layout**: 2 columns, 3 rows (6 charts total)

**Features**:
- Continuous scrolling as simulation runs
- Rolling window of 30-60 data points
- Threshold lines (red dashed)
- Real-time updates every second

**Chart Types**:
1. Temperature vs Time
2. Air Temperature vs Time
3. Vibration vs Time
4. Torque vs Time
5. Rotational Speed vs Time
6. Tool Wear vs Time

## Simulation Behavior

### How It Works

The simulation uses **synthetic data generation** with statistical models:

1. **Base Values**: Each sensor has a baseline mean
2. **Drift**: Gradual change based on scenario profile
3. **Noise**: Random variation for realism
4. **Bounds**: Hard limits prevent unrealistic values
5. **Oscillation**: Direction reverses at bounds

### Direction Oscillation

**Forward (Degradation)**:
- Sensors drift toward higher values
- Simulates wear and tear
- Continues until upper bounds reached

**Backward (Recovery)**:
- Sensors drift toward lower values
- Simulates maintenance or cooling
- Continues until lower bounds reached

**Automatic Reversal**:
- No user intervention needed
- Creates natural degradation/recovery cycles
- Simulates real industrial patterns

### Health State Logic

**Normal**:
- All sensors within safe limits
- No threshold violations
- Green health badge

**Advisory**:
- One sensor exceeds threshold, OR
- Multiple sensors approaching thresholds (>90%)
- Yellow health badge
- Increased monitoring recommended

**Action Required**:
- Two or more sensors exceed thresholds
- Red health badge
- Immediate intervention required
- Remaining safe time displayed

**Post-Maintenance**:
- Special scenario only
- Blue health badge
- Shows recovery progress

## Usage Scenarios

### Demo for Judges
1. Start on Dashboard
2. Click Machine #1
3. Select "Normal" scenario
4. Click Play - show stable operation
5. Switch to "Advisory" - show gradual degradation
6. Switch to "Action Required" - show critical state
7. Switch to "Post-Maintenance" - show recovery
8. Highlight continuous operation (no stops)

### Training Session
1. Explain each scenario's behavior
2. Show how sensors correlate with health state
3. Demonstrate threshold violations
4. Explain recommended actions
5. Show oscillation behavior over time
6. Discuss real-world parallels

### Live Explanation
1. Run "Advisory" scenario
2. Pause at interesting moments
3. Explain sensor readings
4. Discuss mechanical causes
5. Resume to show progression
6. Switch scenarios to compare behaviors

## Tips & Tricks

### Best Practices
- Let simulation run for 30+ seconds to see full oscillation
- Use Pause to freeze interesting states for discussion
- Switch scenarios to demonstrate different failure modes
- Charts need 15+ points to be meaningful

### Troubleshooting

**Charts not updating?**
- Check if simulation is playing (Pause button visible)
- Verify browser console for errors
- Refresh page to reset

**Sensors stuck at same values?**
- Click Play button
- Simulation may be paused

**Health state not changing?**
- Health state derives from live sensor values
- May take time for sensors to reach thresholds
- Try "Action Required" scenario for immediate effect

**Want to reset?**
- Select a different scenario
- Simulation resets automatically

## Keyboard Shortcuts

Currently none - all controls are mouse/touch based.

## Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Mobile Support

Responsive design works on:
- Tablets (landscape recommended)
- Large phones (portrait/landscape)
- Small phones (limited, landscape recommended)

## Performance

**Optimal**:
- Modern desktop/laptop
- 8GB+ RAM
- Recent browser version

**Acceptable**:
- Tablets
- 4GB+ RAM
- May have slight lag on older devices

## Offline Operation

✅ **Fully Functional Offline**
- No backend required
- No network calls
- All simulation runs in browser
- Perfect for demos without internet

## Data Privacy

- No data sent to servers
- No analytics tracking
- All computation local
- Safe for sensitive environments

## Known Limitations

1. **No Persistence**: Simulation state not saved between sessions
2. **Single Machine**: Only one machine simulation at a time
3. **No History**: Cannot replay past simulations
4. **Fixed Scenarios**: Cannot create custom scenarios (yet)

## Future Features

Planned enhancements:
- Multi-machine simultaneous simulation
- Custom scenario builder
- Export sensor data to CSV
- Save/load simulation sessions
- Browser notifications for alerts
- Historical playback mode

## Support

For issues or questions:
1. Check browser console for errors
2. Verify npm packages installed
3. Try clearing browser cache
4. Rebuild with `npm run build`

## Version

Current Version: 2.0.0 (Continuous Simulation)
Previous Version: 1.0.0 (Backend-dependent playback)

## Credits

PRISM Predictive Maintenance System
Continuous Simulation Engine
Frontend-Only Architecture

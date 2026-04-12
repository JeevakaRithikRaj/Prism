# PRISM Continuous Simulation - Quick Reference

## 🚀 Start Application
```bash
cd frontend
npm run dev
```
Open: http://localhost:5173

## 🎮 Controls

| Control | Action |
|---------|--------|
| **Play ▶** | Start continuous simulation |
| **Pause ⏸** | Pause simulation (keeps state) |
| **Scenario Dropdown** | Switch behavior profile (auto-starts) |

## 📊 Scenarios

| Scenario | Behavior | Health State |
|----------|----------|--------------|
| **Normal** | Stable, minimal drift | Normal |
| **Advisory** | Gradual degradation | Advisory |
| **Action Required** | Critical violations | Action Required |
| **Post-Maintenance** | Recovery trend | Post-Maintenance |

## 🔧 Sensors

| Sensor | Unit | Threshold |
|--------|------|-----------|
| Temperature | K | 310 |
| Air Temperature | K | 308 |
| Vibration | μm | 100 |
| Torque | Nm | 50 |
| Rotational Speed | rpm | 2000 |
| Tool Wear | min | 200 |

## 🎯 Key Features

✅ **Infinite Loop** - Never stops
✅ **Oscillating** - Forward/backward cycles
✅ **Synthetic Data** - No dataset playback
✅ **Rolling Buffers** - 30-60 points
✅ **Live Health** - Real-time derivation
✅ **Offline Ready** - No backend needed

## 🚫 Removed

❌ Stop button
❌ Simulation complete
❌ Window end detection
❌ Cursor position
❌ Backend APIs
❌ Network errors

## 📁 Key Files

```
frontend/src/
├── utils/
│   └── SimulationEngine.js      ← Core simulation logic
├── components/
│   ├── MachineDetail.jsx        ← Owns simulation
│   ├── SimulationControls.jsx   ← Play/Pause UI
│   ├── Dashboard.jsx            ← Machine grid
│   └── SensorTrends.jsx         ← Charts
```

## 🔄 Simulation Loop

```
1. Generate synthetic sensor values
2. Update rolling buffers (FIFO)
3. Derive health state from values
4. Update UI components
5. Check bounds → reverse direction if needed
6. Repeat every 1 second
```

## 🎨 Health State Logic

```
Normal:
  All sensors < threshold

Advisory:
  1 sensor > threshold OR
  Multiple sensors > 90% threshold

Action Required:
  2+ sensors > threshold

Post-Maintenance:
  Scenario-specific (recovery mode)
```

## 📈 Chart Behavior

- **Minimum**: 15 visible points
- **Target**: 30-60 points
- **Update**: Every tick (1 second)
- **Scroll**: Continuous (FIFO)
- **Layout**: 2 columns × 3 rows

## 🎭 Demo Script

1. **Start**: Dashboard → Click Machine #1
2. **Normal**: Click Play → Show stable operation
3. **Advisory**: Switch scenario → Show degradation
4. **Critical**: Switch to Action Required → Show alerts
5. **Recovery**: Switch to Post-Maintenance → Show recovery
6. **Continuous**: Let run 60+ seconds → Show oscillation

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Charts not updating | Click Play button |
| Sensors stuck | Verify simulation is playing |
| Health not changing | Wait for sensors to reach thresholds |
| Want to reset | Select different scenario |

## 📦 Build & Deploy

**Development**:
```bash
npm run dev
```

**Production Build**:
```bash
npm run build
```

**Preview Production**:
```bash
npm run preview
```

**Deploy**: Upload `dist/` folder to static host

## ✅ Validation

- [ ] Play starts simulation
- [ ] Pause stops simulation
- [ ] Charts scroll continuously
- [ ] Scenario switching works
- [ ] Health state updates live
- [ ] No stop button visible
- [ ] No completion messages
- [ ] White theme readable
- [ ] Works offline

## 📞 Support

**Check**:
1. Browser console for errors
2. npm packages installed
3. Build succeeds
4. Port 5173 available

**Rebuild**:
```bash
npm install
npm run build
```

## 🎯 Success Criteria

✅ Simulation never stops
✅ No backend required
✅ Charts always scroll
✅ Health derives from live data
✅ Professional appearance
✅ Demo-ready

---

**Version**: 2.0.0
**Status**: Production Ready
**Updated**: February 2, 2026

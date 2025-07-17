const { useState, useEffect } = React;

const Dash = () => {
  const [state, setState] = useState({
    rpm: 0,
    mph: 0,
    coolantTemp: 0,
    dash: "fullscreenDash",
    drawer: false,
    airFlowVolt: 0,
    wTemp: 0,
    throttleVolt: 0,
    batteryVolt: 0,
    showRPM: false,
    showTV: false,
    showAFV: false,
    intTemp: 0
  });

  // Helper function to format numbers with proper decimal places
  const formatValue = (value, decimals = 0) => {
    const num = parseFloat(value) || 0;
    return decimals > 0 ? parseFloat(num.toFixed(decimals)) : Math.round(num);
  };

  // Helper function to calculate percentage
  const calculatePercentage = (value, max) => {
    return Math.min(Math.max(((parseFloat(value) || 0) / max) * 100, 0), 100);
  };

  useEffect(() => {
    const socket = io();
    
    socket.on('ecuData', (data) => {
      const rpmValue = data.rpm || 0;
      const mphValue = data.mph || 0;
      const coolantTempValue = data.coolantTemp || 0;
      const airFlowVoltValue = data.airFlowVolt || 0;
      const wTempValue = data.wTemp || 0;
      const throttleVoltValue = data.throttleVolt || 0;
      const batteryVoltValue = data.batteryVolt || 0;

      setState(prevState => ({
        ...prevState,
        rpm: formatValue(rpmValue, 0),
        mph: formatValue(mphValue, 0),
        intTemp: formatValue(coolantTempValue, 0),
        airFlowVolt: formatValue(airFlowVoltValue, 2),
        wTemp: formatValue(wTempValue, 0),
        throttleVolt: formatValue(throttleVoltValue, 0),
        batteryVolt: formatValue(batteryVoltValue, 2),
        showRPM: rpmValue >= 7500,
        showAFV: airFlowVoltValue >= 5.1,
        showTV: throttleVoltValue >= 90
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getGaugeColor = (percentage) => {
    if (percentage <= 60) return '#00ff41'; // Green
    if (percentage <= 85) return '#ffff00'; // Yellow
    return '#ff0000'; // Red
  };

  const FullScreenGauge = ({ label, value, maxValue, unit, icon, showAlert, isLarge = false }) => {
    const percentage = calculatePercentage(value, maxValue);
    const color = getGaugeColor(percentage);
    
    return (
      <div className={`fullscreen-gauge ${showAlert ? 'alert' : ''} ${isLarge ? 'large' : ''}`}>
        <div className="gauge-header">
          <div className="gauge-icon-container">
            <img src={icon} alt={label} className="gauge-icon" />
          </div>
          <div className="gauge-info">
            <span className="gauge-label">{label}</span>
            <div className="gauge-value">
              <span className="value-number">{value}</span>
              <span className="value-unit">{unit}</span>
            </div>
          </div>
          {showAlert && <div className="alert-indicator">⚠️</div>}
        </div>
        
        <div className="gauge-container">
          <div className="gauge-track">
            {/* Background segments for visual reference */}
            <div className="gauge-segments">
              <div className="segment green" style={{width: '60%'}}></div>
              <div className="segment yellow" style={{width: '25%'}}></div>
              <div className="segment red" style={{width: '15%'}}></div>
            </div>
            
            {/* Actual fill bar */}
            <div 
              className="gauge-fill"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: color,
                boxShadow: `0 0 20px ${color}80, inset 0 0 20px ${color}40`
              }}
            >
              <div className="gauge-shine"></div>
            </div>
          </div>
          
          <div className="gauge-percentage">{percentage.toFixed(1)}%</div>
        </div>
      </div>
    );
  };

  const CircularSpeedometer = ({ value, maxValue, label, unit, dangerZone = 80 }) => {
    const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
    
    // Configure the arc - using 240 degrees (leaves 60 degrees at bottom for labels)
    const startAngle = 150; // Start angle in degrees (bottom left)
    const endAngle = 390;   // End angle in degrees (bottom right) - 240 degree sweep
    const totalArcDegrees = endAngle - startAngle; // 240 degrees
    
    // Calculate current angle based on value
    const currentAngle = startAngle + (percentage / 100) * totalArcDegrees;
    
    // Convert angles to radians for calculations
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const currentRad = (currentAngle * Math.PI) / 180;
    
    // Arc parameters
    const centerX = 100;
    const centerY = 100;
    const radius = 75;
    
    // Calculate arc path coordinates
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    
    // Calculate current position for needle
    const needleX = centerX + (radius - 10) * Math.cos(currentRad);
    const needleY = centerY + (radius - 10) * Math.sin(currentRad);
    
    // Create the background arc path
    const backgroundArcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;
    
    // Calculate the current value arc
    const currentX = centerX + radius * Math.cos(currentRad);
    const currentY = centerY + radius * Math.sin(currentRad);
    const largeArcFlag = totalArcDegrees * (percentage / 100) > 180 ? 1 : 0;
    const valueArcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${currentX} ${currentY}`;
    
    const color = getGaugeColor(percentage);
    
    // Generate tick marks
    const generateTicks = () => {
      const ticks = [];
      const majorTickCount = 8; // Number of major ticks
      const minorTickCount = 4; // Minor ticks between major ticks
      
      // Major ticks
      for (let i = 0; i <= majorTickCount; i++) {
        const tickAngle = startAngle + (i / majorTickCount) * totalArcDegrees;
        const tickRad = (tickAngle * Math.PI) / 180;
        const tickValue = (i / majorTickCount) * maxValue;
        
        const outerX = centerX + (radius - 5) * Math.cos(tickRad);
        const outerY = centerY + (radius - 5) * Math.sin(tickRad);
        const innerX = centerX + (radius - 15) * Math.cos(tickRad);
        const innerY = centerY + (radius - 15) * Math.sin(tickRad);
        
        const labelX = centerX + (radius - 25) * Math.cos(tickRad);
        const labelY = centerY + (radius - 25) * Math.sin(tickRad);
        
        ticks.push(
          <g key={`major-${i}`}>
            <line
              x1={outerX}
              y1={outerY}
              x2={innerX}
              y2={innerY}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="tick-label"
              fontSize="10"
              fill="rgba(255,255,255,0.9)"
            >
              {Math.round(tickValue)}
            </text>
          </g>
        );
        
        // Minor ticks between major ticks
        if (i < majorTickCount) {
          for (let j = 1; j <= minorTickCount; j++) {
            const minorTickAngle = tickAngle + (j / (minorTickCount + 1)) * (totalArcDegrees / majorTickCount);
            const minorTickRad = (minorTickAngle * Math.PI) / 180;
            
            const minorOuterX = centerX + (radius - 5) * Math.cos(minorTickRad);
            const minorOuterY = centerY + (radius - 5) * Math.sin(minorTickRad);
            const minorInnerX = centerX + (radius - 10) * Math.cos(minorTickRad);
            const minorInnerY = centerY + (radius - 10) * Math.sin(minorTickRad);
            
            ticks.push(
              <line
                key={`minor-${i}-${j}`}
                x1={minorOuterX}
                y1={minorOuterY}
                x2={minorInnerX}
                y2={minorInnerY}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
            );
          }
        }
      }
      
      return ticks;
    };
    
    return (
      <div className="circular-speedometer">
        <div className="speedometer-container">
          <svg viewBox="0 0 200 200" className="speedometer-svg">
            {/* Background arc */}
            <path
              d={backgroundArcPath}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            {/* Tick marks */}
            {generateTicks()}
            
            {/* Danger zone arc (if applicable) */}
            {dangerZone < maxValue && (
              <path
                d={`M ${centerX + radius * Math.cos(((startAngle + (dangerZone/maxValue) * totalArcDegrees) * Math.PI) / 180)} ${centerY + radius * Math.sin(((startAngle + (dangerZone/maxValue) * totalArcDegrees) * Math.PI) / 180)} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
                fill="none"
                stroke="rgba(255,0,0,0.3)"
                strokeWidth="12"
                strokeLinecap="round"
              />
            )}
            
            {/* Value arc */}
            <path
              d={valueArcPath}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 10px ${color})`,
                transition: 'all 0.8s ease'
              }}
            />
            
            {/* Center circle */}
            <circle cx={centerX} cy={centerY} r="8" fill={color} />
            
            {/* Needle */}
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX}
              y2={needleY}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 5px ${color})`,
                transition: 'all 0.8s ease'
              }}
            />
            
            {/* Needle center dot */}
            <circle cx={centerX} cy={centerY} r="4" fill="#ffffff" />
            
            {/* Value text */}
            <text x={centerX} y={centerY + 35} textAnchor="middle" className="speedometer-value">
              {value}
            </text>
            <text x={centerX} y={centerY + 50} textAnchor="middle" className="speedometer-unit">
              {unit}
            </text>
          </svg>
        </div>
        <div className="speedometer-label">{label}</div>
      </div>
    );
  };

  const createFullScreenDashboard = () => (
    <div className="fullscreen-dashboard">
      {/* Top Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <h1 className="dashboard-title">ECU DASHBOARD</h1>
          <div className="connection-status">
            <div className="status-indicator active"></div>
            <span>CONNECTED</span>
          </div>
        </div>
        <div className="status-right">
          <div className="time-display">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Column - Primary Gauges */}
        <div className="left-column">
          <div className="primary-section">
            <CircularSpeedometer
              value={state.rpm}
              maxValue={8000}
              label="RPM"
              unit="rpm"
              dangerZone={7000}
            />
            <CircularSpeedometer
              value={state.mph}
              maxValue={240}
              label="SPEED"
              unit="kph"
              dangerZone={200}
            />
          </div>
        </div>

        {/* Right Column - Secondary Gauges */}
        <div className="right-column">
          <FullScreenGauge
            label="THROTTLE POSITION"
            value={state.throttleVolt}
            maxValue={100}
            unit="%"
            icon="1654014342705.jpg"
            showAlert={state.showTV}
          />
          
          <FullScreenGauge
            label="COOLANT TEMP"
            value={state.intTemp}
            maxValue={120}
            unit="°C"
            icon="1654014330436.jpg"
            showAlert={state.intTemp > 100}
          />
          
          <FullScreenGauge
            label="WATER TEMP"
            value={state.wTemp}
            maxValue={120}
            unit="°C"
            icon="1654014316323.jpg"
            showAlert={state.wTemp > 100}
          />
          <FullScreenGauge
            label="AIR FLOW"
            value={state.airFlowVolt}
            maxValue={6}
            unit="V"
            icon="1654014323912.jpg"
            showAlert={state.showAFV}
          />
          
          <FullScreenGauge
            label="BATTERY VOLTAGE"
            value={state.batteryVolt}
            maxValue={16}
            unit="V"
            icon="1654014320355.jpg"
            showAlert={state.batteryVolt < 12}
          />
        </div>
      </div>

      {/* Bottom Alert Bar */}
      <div className="alert-bar">
        {(state.showRPM || state.showTV || state.showAFV || state.intTemp > 100) && (
          <div className="alert-message">
            <span className="alert-icon">⚠️</span>
            <span>SYSTEM ALERT: Check highlighted parameters</span>
          </div>
        )}
      </div>
    </div>
  );

  const toggleDash = (dashType) => {
    setState(prevState => ({
      ...prevState,
      dash: dashType,
      drawer: false
    }));
  };

  const toggleDrawer = () => {
    setState(prevState => ({
      ...prevState,
      drawer: !prevState.drawer
    }));
  };

  return (
    <div className="app-container">
      <div className="dashboard-controls">
        <button 
          className="control-button"
          onClick={toggleDrawer}
        >
          ⚙️
        </button>
        
        {state.drawer && (
          <div className="settings-drawer">
            <button 
              className={`dash-option ${state.dash === 'fullscreenDash' ? 'active' : ''}`}
              onClick={() => toggleDash('fullscreenDash')}
            >
              Full Screen Dashboard
            </button>
            <button 
              className={`dash-option ${state.dash === 'defaultDash' ? 'active' : ''}`}
              onClick={() => toggleDash('defaultDash')}
            >
              Classic Table View
            </button>
          </div>
        )}
      </div>
      
      <div className="content-container">
        {state.dash === 'fullscreenDash' ? createFullScreenDashboard() : createTableDashboard()}
      </div>
    </div>
  );

  // Add the classic table dashboard for comparison
  function createTableDashboard() {
    return (
      <div className="table-dashboard">
        <table className="classic-table">
          <tbody>
            <tr>
              <td>RPM</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014347028.jpg" width="30px" />
              </td>
              <td>
                <div className="container" style={{ borderRight: state.showRPM ? `2px solid white` : "" }}>
                  <div style={{ 
                    width: `${calculatePercentage(state.rpm, 8000)}%`, 
                    height: "100%", 
                    background: `${state.rpm > 7500 ? "red" : "#4dfa40"}`, 
                    borderRight: !state.showRPM ? `2px solid white` : "" 
                  }}></div>
                </div>
              </td>
              <td>{state.rpm} rpm</td>
            </tr>
            <tr>
              <td>THROTTLE</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014342705.jpg" width="30px" />
              </td>
              <td className="td">
                <div className="container" style={{ borderRight: state.showTV ? `2px solid white` : "" }}>
                  <div style={{ 
                    width: `${state.throttleVolt}%`, 
                    height: "100%", 
                    background: "#4dfa40", 
                    borderRight: !state.showTV ? `2px solid white` : "" 
                  }}></div>
                </div>
              </td>
              <td className="td2">{state.throttleVolt} %</td>
            </tr>
            <tr>
              <td>AIR FLOW</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014323912.jpg" width="30px" />
              </td>
              <td>
                <div className="container" style={{ borderRight: state.showAFV ? `2px solid white` : "" }}>
                  <div style={{ 
                    width: `${calculatePercentage(state.airFlowVolt, 6)}%`, 
                    height: "100%", 
                    background: "#4dfa40", 
                    borderRight: !state.showAFV ? `2px solid white` : "" 
                  }}></div>
                </div>
              </td>
              <td>{state.airFlowVolt} volt</td>
            </tr>
            <tr>
              <td>BATTERY</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014320355.jpg" width="30px" />
              </td>
              <td>
                <div className="container" style={{ borderRight: state.showAFV ? `2px solid white` : "" }}>
                  <div style={{ 
                    width: `${calculatePercentage(state.batteryVolt, 16)}%`, 
                    height: "100%", 
                    background: "#4dfa40", 
                    borderRight: !state.showAFV ? `2px solid white` : "" 
                  }}></div>
                </div>
              </td>
              <td>{state.batteryVolt} volt</td>
            </tr>
            <tr>
              <td>W-TEMP</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014316323.jpg" width="30px" />
              </td>
              <td className="td">
                <div className="container" style={{ borderRight: state.showTV ? `2px solid white` : "" }}>
                  <div style={{ 
                    width: `${calculatePercentage(state.wTemp, 120)}%`, 
                    height: "100%", 
                    background: "#4dfa40", 
                    borderRight: !state.showTV ? `2px solid white` : "" 
                  }}></div>
                </div>
              </td>
              <td>{state.wTemp} &#176;C</td>
            </tr>
            <tr>
              <td>INT-TEMP</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014330436.jpg" width="30px" />
              </td>
              <td>
                <div className="container" style={{ borderRight: state.showAFV ? `2px solid white` : "" }}>
                  <div style={{ 
                    width: `${calculatePercentage(state.intTemp, 120)}%`, 
                    height: "100%", 
                    background: "#4dfa40", 
                    borderRight: !state.showAFV ? `2px solid white` : "" 
                  }}></div>
                </div>
              </td>
              <td>{state.intTemp} &#176;C</td>
            </tr>
            <tr>
              <td>SPEED</td>
              <td style={{ textAlign: "center" }}>
                <img src="1654014335661.jpg" width="30px" />
              </td>
              <td>
                <div className="container" style={{ borderRight: "2px solid white" }}>
                  <div style={{ 
                    width: `${calculatePercentage(state.mph, 240)}%`, 
                    height: "100%", 
                    background: "#4dfa40" 
                  }}></div>
                </div>
              </td>
              <td>{state.mph} kph</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
};

ReactDOM.render(<Dash />, document.getElementById('content'));

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
    const percentage = (value / maxValue) * 100;
    const angle = (percentage / 100) * 270; // 270 degrees for speedometer arc
    const color = getGaugeColor(percentage);
    
    return (
      <div className="circular-speedometer">
        <div className="speedometer-container">
          <svg viewBox="0 0 200 200" className="speedometer-svg">
            {/* Background arc */}
            <path
              d="M 30 170 A 85 85 0 1 1 170 170"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            
            {/* Value arc */}
            <path
              d="M 30 170 A 85 85 0 1 1 170 170"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={`${(angle/270) * 267} 267`}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 10px ${color})`,
                transition: 'stroke-dasharray 0.8s ease'
              }}
            />
            
            {/* Center circle */}
            <circle cx="100" cy="100" r="8" fill={color} />
            
            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2={100 + 60 * Math.cos((angle - 135) * Math.PI / 180)}
              y2={100 + 60 * Math.sin((angle - 135) * Math.PI / 180)}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 5px ${color})`,
                transition: 'all 0.8s ease'
              }}
            />
            
            {/* Value text */}
            <text x="100" y="130" textAnchor="middle" className="speedometer-value">
              {value}
            </text>
            <text x="100" y="145" textAnchor="middle" className="speedometer-unit">
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
          </div>
        )}
      </div>
      
      <div className="content-container">
        {createFullScreenDashboard()}
      </div>
    </div>
  );
};

ReactDOM.render(<Dash />, document.getElementById('content'));

var Dash = React.createClass({
	getInitialState: function () {
		return {
			rpm: 0,
			mph: 0,
			airFlowVoltPercent: 0,
			coolantTemp: 0,
			dash: "defaultDash",
			drawer: false,
			airFlowVolt: 0,
			wTemp: 0,
			throttleVolt: 0,
			batteryVolt: 0,
			showRPM: false,
			showTV: false,
			showAFV: false,
			RPMPercent: 0
		};
	},
	componentDidMount: function () {
		var that = this;
		this.socket = io();
		this.socket.on('ecuData', function (data) {
			that.setState({ rpm: data.rpm });
			that.setState({ mph: data.mph.toFixed(0) })
			that.setState({
				intTemp: data.coolantTemp.toFixed(0),
				airFlowVolt: data.airFlowVolt.toFixed(2),
				wTemp: data.wTemp.toFixed(0),
				throttleVolt: data.throttleVolt.toFixed(0),
				batteryVolt: data.batteryVolt.toFixed(1)
			});
			that.setState({
				RPMPercent: data.rpm / 8000 * 100,
				mphPercent: data.mph / 240 * 100,
				intTempPercent: data.coolantTemp / 120 * 100,
				wTempPercent: data.wTemp / 120 * 100,
				batteryVoltPercent: data.batteryVolt / 16 * 100,
				airFlowVoltPercent: data.airFlowVolt / 6 * 100,
				showRPM: data.rpm >= 8000 && !that.state.showRPM ? true : that.state.showRPM,
				showAFV: data.airFlowVolt >= 510 && !that.state.showAFV ? true : that.state.showAFV,
				showTV: data.throttleVolt >= 98 && !that.state.showTV ? true : that.state.showTV
			})
		});
		this.socket.emit('fetchComments');
	},
	createMPHTable: function () {
		return (
			<table>
				<tr>

					<td>RPM</td>
					<td style={{ textAlign: "center" }}><img src="1654014347028.jpg" width="30px" /></td>
					<td><div className="container" style={{ borderRight: this.state.showRPM ? `2px solid white` : "" }}>
						<div style={{ width: `${this.state.RPMPercent}%`, height: "100%", background: `${this.state.rpm > 7500 ? "red" : "#4dfa40"}`, borderRight: !this.state.showRPM ? `2px solid white` : "" }}></div>
					</div></td>
					<td>{this.state.rpm} rpm</td>
				</tr>
				<tr>
					<td>THROTTLE</td>
					<td style={{ textAlign: "center" }}><img src="1654014342705.jpg" width="30px" /></td>
					<td className="td"><div className="container" style={{ borderRight: this.state.showTV ? `2px solid white` : "" }}>
						<div style={{ width: `${this.state.throttleVolt}%`, height: "100%", background: "#4dfa40", borderRight: !this.state.showTV ? `2px solid white` : "" }}></div>
					</div></td>
					<td className="td2">{this.state.throttleVolt} %</td>
				</tr>
				<tr>
					<td>AIR FLOW</td>
					<td style={{ textAlign: "center" }}><img src="1654014323912.jpg" width="30px" /></td>
					<td><div className="container" style={{ borderRight: this.state.showAFV ? `2px solid white` : "" }}>
						<div style={{ width: `${this.state.airFlowVoltPercent}%`, height: "100%", background: "#4dfa40", borderRight: !this.state.showAFV ? `2px solid white` : "" }}></div>
					</div></td>
					<td>{this.state.airFlowVolt} volt</td>
				</tr>
				<tr>
					<td>BATTERY</td>
					<td style={{ textAlign: "center" }}><img src="1654014320355.jpg" width="30px" /></td>
					<td><div className="container" style={{ borderRight: this.state.showAFV ? `2px solid white` : "" }}>
						<div style={{ width: `${this.state.batteryVoltPercent}%`, height: "100%", background: "#4dfa40", borderRight: !this.state.showAFV ? `2px solid white` : "" }}></div>
					</div></td>
					<td>{this.state.batteryVolt} volt</td>
				</tr>
				<tr>
					<td>W-TEMP</td>
					<td style={{ textAlign: "center" }}><img src="1654014316323.jpg" width="30px" /></td>
					<td className="td"><div className="container" style={{ borderRight: this.state.showTV ? `2px solid white` : "" }}>
						<div style={{ width: `${this.state.wTempPercent}%`, height: "100%", background: "#4dfa40", borderRight: !this.state.showTV ? `2px solid white` : "" }}></div>
					</div></td>
					<td>{this.state.wTemp} &#176;C</td>
				</tr>
				<tr>
					<td>INT-TEMP</td>
					<td style={{ textAlign: "center" }}><img src="1654014330436.jpg" width="30px" /></td>
					<td><div className="container" style={{ borderRight: this.state.showAFV ? `2px solid white` : "" }}>
						<div style={{ width: `${this.state.intTempPercent}%`, height: "100%", background: "#4dfa40", borderRight: !this.state.showAFV ? `2px solid white` : "" }}></div>
					</div></td>
					<td>{this.state.intTemp} &#176;C</td>

				</tr>

				<tr>
					<td>SPEED</td>
					<td style={{ textAlign: "center" }}><img src="1654014335661.jpg" width="30px" /></td>
					<td><div className="container" style={{ borderRight: "2px solid white" }}>
						<div style={{ width: `${this.state.mphPercent}%`, height: "100%", background: "#4dfa40", }}></div>
					</div></td>
					<td>{this.state.mph} kph</td>
				</tr>
			</table>
		)
	},
	needlePosition: function (rpm) {
		percentRPM = rpm / 12000 * 360 + 90;
		needleStyle = {
			transform: 'rotate(' + percentRPM + 'deg)'
		};
		return needleStyle;
	},
	rpmMarker: function (num, background) {
		var rotatePercent = num / 100 * 360 + 180
		tickStyle = {
			transform: 'rotate(' + rotatePercent + 'deg)'
		}
		var divClass = !background ? "rpm__marker" : "rpm__marker--background"
		return (
			<div style={tickStyle} className={divClass}></div>
		);
	},
	backgroundMarkers: function () {
		var rpmMarkers = []
		for (var i = 0; i < 75; i++) {
			rpmMarkers.push(this.rpmMarker(i, true));
		}
		return rpmMarkers;
	},
	rpmMarkers: function () {
		var percentRPM = this.state.rpm / 120;
		var rpmMarkers = []
		var background = false
		for (var i = 0; i < 75; i++) {
			if (i > percentRPM) {
				background = true
			}
			rpmMarkers.push(this.rpmMarker(i, background));
		}
		return rpmMarkers;
	},
	renderMPH: function () {
		var mph = this.state.mph;
		var hundreds = "mph__number mph__number";
		var tens = "mph__number mph__number";
		var ones = "mph__number mph__number";
		if (mph > 100) {
			hundreds += "--" + (mph + "")[0]
			tens += "--" + (mph + "")[1]
			ones += "--" + (mph % 10)
		} else if (mph > 9) {
			tens += "--" + (mph + "")[0]
			ones += "--" + (mph % 10)
		} else {
			ones += "--" + (mph % 10)
		}
		return (
			<div className="mph__container">
				<div className="mph--background"><span className='mph__number--default'></span><span className='mph__number--default'></span><span className='mph__number--default'></span></div>
				<div className="mph"><span className={hundreds}></span><span className={tens}></span><span className={ones}></span></div>
				<p className="mph__label">MPH</p>
			</div>
		);
	},
	renderSmallNumbers: function (number) {
		var rpm = number;
		var thousands = "small-number small-number";
		var hundreds = "small-number small-number";
		var tens = "small-number small-number";
		var ones = "small-number small-number";
		var commaClass = rpm > 999 ? "small-number--comma" : "small-number--hidden-comma"
		if (rpm > 999) {
			thousands += "--" + (rpm + "")[0]
			hundreds += "--" + (rpm + "")[1]
			tens += "--" + (rpm + "")[2]
			ones += "--" + (rpm + "")[3]
		} else if (rpm > 99) {
			thousands += "--default"
			hundreds += "--" + (rpm + "")[0]
			tens += "--" + (rpm + "")[1]
			ones += "--" + (rpm % 10)
		} else if (rpm > 9) {
			thousands += "--default"
			hundreds += "--default"
			tens += "--" + (rpm + "")[0]
			ones += "--" + (rpm % 10)
		} else {
			thousands += "--default"
			hundreds += "--default"
			tens += "--default"
			ones += "--" + (rpm % 10)
		}
		return (
			<div className="rpm-num__container">
				<div className="rpm"><span className={thousands}></span><span className={commaClass}><img className='comma-image' src='./comma.svg' /></span><span className={hundreds}></span><span className={tens}></span><span className={ones}></span></div>
				<div className="rpm--background"><span className='small-number--default'></span><span className='small-number--default'></span><span className='small-number--default'></span><span className='small-number--default'></span></div>
			</div>
		);
	},
	tempMarker: function (num, background) {
		var divClass = !background ? "temp__marker" : "temp__marker--background"
		var colors = ["#7BE7EC", "#89E8DC", "#96E9CE", "#A0EAC1", "#ABEBB4", "#BAEDA4", "#C5ED96", "#D1EE88", "#DDF07B", "#ECF16A", "#F0E966", "#F0DD68", "#F1D069", "#F2C36B", "#F3C36B", "#F4AA6E", "#F49D6F", "#F58F71", "#F58372", "#F77674"]
		style = {}
		if (!background) {
			style = {
				backgroundColor: colors[num - 1]
			}
		}
		return (
			<div style={style} className={divClass}></div>
		);
	},
	tempMarkers: function (temp) {
		tempPercent = temp / 210 * 20
		var tempMarkers = []
		background = true;

		for (var i = 20; i > 0; i = i - 1) {
			if (tempPercent > i) {
				background = false;
			}
			tempMarkers.push(this.tempMarker(i, background));
		}
		return tempMarkers;
	},
	backgroundTempMarkers: function () {
		var tempMarkers = []
		for (var i = 0; i < 20; i++) {
			tempMarkers.push(this.tempMarker(i, true));
		}
		return tempMarkers;
	},
	defaultDash: function () {
		return (
			<div>

				{this.createMPHTable()}
			</div>
		);
	},
	numbersDash: function () {
		return (
			<span className='neon-dash-container'>
				<ul>
					<li className='rpm-column'>
						{this.renderSmallNumbers(this.state.rpm)}
						<p className="small-number__label">RPM</p>
					</li>
					<li className='mph-column'>
						{this.renderMPH()}
					</li>
					<li className='temp-column'>
						{this.renderSmallNumbers(this.state.coolantTemp)}
						<p className="small-number__label">Coolant Temp</p>
					</li>
				</ul>
			</span>
		);
	},
	chooseDash: function (dashChoice) {
		var dash = {}
		this.state.dash = dashChoice;
		switch (dashChoice) {
			case "defaultDash":
				dash = this.defaultDash();
				break;
			case "numbersDash":
				dash = this.numbersDash();
				break;
			default:
				dash = this.defaultDash();
		}
		return (
			dash
		);
	},
	chooseDashCloseDrawer: function (dashChoice) {
		this.state.drawer = !this.state.drawer;
		this.chooseDash(dashChoice);
	},
	toggleDrawer: function (dashChoice) {
		this.state.drawer = !this.state.drawer;
	},

	render: function () {
		drawerClass = 'dash-changer__container'
		if (this.state.drawer) drawerClass += ' open'

		return (
			<div className="content-container">

				{this.chooseDash(this.state.dash)}

			</div>
		);
	}
});

React.render(
	<Dash />,
	document.getElementById('content')
);

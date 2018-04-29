const React = require('react');
const Map = require('./map.js');
const api = require('./api.js');

class App extends React.Component {
	constructor(props, context) {
		super(props, context);

		this.state = {
			faces: [],
			languages: [],
		};

		this.handleUpdateLanguages();
	}

	handleUpdateLanguages = async () => {
		const languages = await api('GET', '/contests/4/languages');
		this.setState({languages});
		this.map && this.map.setFaceColors(languages.map((language) => language.team === undefined ? 0 : language.team + 1));
	}

	handleRefCanvas = (node) => {
		this.canvas = node;
		if (!this.mapInited) {
			this.mapInited = true;
			this.map = new Map(this.canvas, this.handleFacesUpdate, (index) => {
				console.log(index);
			});
		}
	};

	handleFacesUpdate = (faces) => {
		this.setState({faces});
	};

	render() {
		return (
			<div className="map" style={{position: 'relative'}}>
				<div ref={this.handleRefCanvas}/>
				<div className="labels" style={{pointerEvents: 'none'}}>
					{[...this.state.faces.entries()]
						.filter(([, face]) => face.z < 0.99915)
						.map(([index, face]) => (
							<div
								key={index}
								style={{
									position: 'absolute',
									width: '200px',
									height: '50px',
									lineHeight: '50px',
									color: 'white',
									fontSize: '30px',
									textAlign: 'center',
									top: '0',
									left: '0',
									transform: `translate(${face.x - 100}px, ${face.y - 25}px) scale(${(0.99915 - face.z) * 3000})`,
								}}
							>
								{(this.state.languages[index] && this.state.languages[index].name) || index}
							</div>
						))}
				</div>
			</div>
		);
	}
}

module.exports = App;

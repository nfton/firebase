import React from 'react';
import logo from './logo.svg';
import './App.css';
import useWindowDimensions from "./hooks/useWindowDimensions";

function App() {
	const {height, width} = useWindowDimensions();
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo"/>
				<p>
					Size: <code>{width}x{height}</code>
				</p>
				<p>
					{	/* @ts-ignore */}
					WebApp: {window.Telegram.WebApp.version}
				</p>
				<p>
					{	/* @ts-ignore */}
					Theme: {window.Telegram.WebApp.colorScheme}
				</p>
			</header>
		</div>
	);
}

export default App;

import { useEffect, useState } from "react";
import ProblemSession from "./components/problem-session";

function App() {
	const [sessionData, setSessionData] = useState(null);

	useEffect(() => {
		const handler = (event) => {
			const msg = event.detail || event.data;
			if (msg.command === "problemDetails") {
				// Include defaultLanguage in session data
				setSessionData({
					...msg.data,
					defaultLanguage: msg.defaultLanguage
				});
			}
		};
		window.addEventListener("vscode-message", handler);
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	if (sessionData) {
		return <ProblemSession data={sessionData} />;
	}

	return (
		<div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950/30 to-purple-950/30">
			<div className="text-center animate-fadeIn">
				<div className="text-7xl mb-4 animate-bounce">💡</div>
				<div className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
					Ready to Code?
				</div>
				<div className="text-gray-400">Select a problem from the sidebar to get started</div>
			</div>
		</div>
	);
}

export default App;

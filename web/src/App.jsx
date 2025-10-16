import { useEffect, useState } from "react";
import ProblemSession from "./components/problem-session";

function App() {
	const [sessionData, setSessionData] = useState(null);

	useEffect(() => {
		const handler = (event) => {
			const msg = event.detail || event.data;
			if (msg.command === "problemDetails") {
				setSessionData(msg.data);
			}
		};
		window.addEventListener("vscode-message", handler);
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	if (sessionData) {
		return <ProblemSession data={sessionData} />;
	}

	return (
		<div className="h-full w-full flex items-center justify-center text-gray-300">
			<div className="opacity-75">Select a problem from the sidebar to view it here.</div>
		</div>
	);
}

export default App;

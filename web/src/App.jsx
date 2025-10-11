import { useEffect, useState } from "react";

function App() {
	const [loggedIn, setLoggedIn] = useState(false);

	useEffect(() => {
		const handler = (event) => {
			const msg = event.detail || event.data;
			if (msg.command === "session" && msg.cookiesExist) {
				setLoggedIn(true);
			}
		};
		window.addEventListener("vscode-message", handler);
		// Ask extension for session info on mount
		if (window.vscode) {
			window.vscode.postMessage({ command: "checkSession" });
		}
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	return loggedIn ? <ProblemList /> : <LoginPage />;
}

export default App;

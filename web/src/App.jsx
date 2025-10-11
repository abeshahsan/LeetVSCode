import { useEffect, useState } from "react";
import { ProblemList } from "./components/problems-list";
import { LoginPage } from "./components/login";

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
		
		if (window.vscode) {
			window.vscode.postMessage({ command: "checkSession" });
		}
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	return loggedIn ? <ProblemList /> : <LoginPage />;
}

export default App;

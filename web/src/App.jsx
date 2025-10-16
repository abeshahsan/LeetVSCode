import { useEffect, useState } from "react";
import { ProblemList } from "./components/problems-list";
import { LoginPage } from "./components/login";
import ProblemSession from "./components/problem-session";

function App() {
	const [loggedIn, setLoggedIn] = useState(false);
	const [view, setView] = useState("list"); // 'list' | 'session'
	const [sessionData, setSessionData] = useState(null);

	useEffect(() => {
		const handler = (event) => {
			const msg = event.detail || event.data;

			if (msg.command === "session") {
				setLoggedIn(!!msg.cookiesExist);
			}

			if (msg.command === "problemDetails") {
				setSessionData(msg.data);
				setView("session");
			}
		};
		window.addEventListener("vscode-message", handler);

		if (window.vscode) {
			window.vscode.postMessage({ command: "checkSession" });
		}
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	if (!loggedIn) return <LoginPage />;

	if (view === "session" && sessionData) {
		return (
			<ProblemSession
				data={sessionData}
				onBack={() => {
					setView("list");
					setSessionData(null);
				}}
			/>
		);
	}

	return <ProblemList />;
}

export default App;

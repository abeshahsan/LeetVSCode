import path from "path";
import * as vscode from "vscode";
import fetch from "node-fetch";
import { runLoginProcess } from "./login-manager.js";
import { getAllProblems, getProblemDetails } from "./leetcode-utils.js";

let panel;
let allProblems = [];

function getWebviewContent(webview, extensionPath, initialState) {
	const scriptSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.js")));
	const cssSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.css")));

	const stateJson = JSON.stringify(initialState || {});

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="${cssSrc}">
</head>
<body>
	<div id="root"></div>

	<script>
		const vscode = acquireVsCodeApi();
		window.vscode = vscode;

		// Restore saved state
		const initialState = ${stateJson};
		window.__INITIAL_STATE__ = vscode.getState() || initialState;

		window.addEventListener('message', event => {
			window.dispatchEvent(new CustomEvent('vscode-message', { detail: event.data }));
		});
	</script>

	<script type="module" src="${scriptSrc}"></script>
</body>
</html>`;
}

async function fetchResponseToWebview(panel, { url, requestId }) {
	try {
		const response = await fetch(url);
		const data = await response.json();
		panel.webview.postMessage({ command: "fetchResponse", requestId, data });
	} catch (error) {
		panel.webview.postMessage({ command: "fetchError", requestId, error: error.message });
	}
}

export function createOrShowWebview(context) {
	const savedState = context.globalState.get("leetcode_state") || {};

	if (panel) {
		panel.reveal(vscode.ViewColumn.One);
		return;
	}

	panel = vscode.window.createWebviewPanel("webview", "LeetVSCode", vscode.ViewColumn.One, {
		enableScripts: true,
		retainContextWhenHidden: true,
	});

	panel.webview.html = getWebviewContent(panel.webview, context.extensionPath, savedState);

	panel.webview.onDidReceiveMessage(async (message) => {
		try {
			switch (message.command) {
				case "fetch":
					fetchResponseToWebview(panel, message);
					break;

				case "login":
					await runLoginProcess(panel, context);

					break;

				case "checkSession": {
					const sess = context.globalState.get("leetcode_cookies");
					panel?.webview.postMessage({
						command: "session",
						cookiesExist: !!sess,
					});
					break;
				}

				case "fetch-problems": {
					if (allProblems.length == 0) {
						const data = await getAllProblems();
						allProblems = data?.problemsetQuestionList?.questions || [];
					}
					// slice
					const slicedProblems = allProblems.slice(40, 90); // Example slice
					console.log(slicedProblems);

					panel?.webview.postMessage({ command: "problems", data: slicedProblems });
					break;
				}

				case "open-problem": {
					const { titleSlug } = message.problem;
					const cookies = context.globalState.get("leetcode_cookies");
					const res = await getProblemDetails(titleSlug, { cookies });

					// Reveal the problem webview in the first column and send details
					panel?.reveal(vscode.ViewColumn.One);
					panel?.webview.postMessage({ command: "problemDetails", data: res });
					break;
				}

				// Removed run-code handler

				case "logout":
					// Delegate logout to the extension command so the status bar and other UI stay in sync
					await vscode.commands.executeCommand("leet.logout", context);
					break;

				case "saveState":
					// from webview: vscode.postMessage({ command: "saveState", state })
					await context.globalState.update("leetcode_state", message.state);
					panel?.webview.postMessage({ command: "stateSaved" });
					break;
			}
		} catch (err) {
			console.error("Webview message handling error:", err);
			vscode.window.showErrorMessage(`Error: ${err.message}`);
		}
	});

	panel.onDidDispose(() => {
		if (panel) {
			panel.webview.postMessage({ command: "requestStateSave" });
		}

		panel = undefined;
	});

	return panel;
}

// Notify the webview about session state changes (cookiesExist boolean)
export function notifySession(cookiesExist) {
	panel?.webview.postMessage({
		command: "session",
		cookiesExist: !!cookiesExist,
	});
}

// Open a specific problem from the extension (e.g., sidebar) into the existing webview
export async function openProblemFromExtension(context, titleSlug) {
	try {
		// Ensure the webview exists and is visible
		createOrShowWebview(context);

		// Fetch problem details using stored cookies (requires login)
		const cookies = context.globalState.get("leetcode_cookies");
		const res = await getProblemDetails(titleSlug, { cookies });

		// Show the webview and send the problem details
		panel?.reveal(vscode.ViewColumn.One);
		panel?.webview.postMessage({ command: "problemDetails", data: res });
	} catch (err) {
		console.error("Failed to open problem from extension:", err);
		vscode.window.showErrorMessage(`Failed to open problem: ${err.message}`);
	}
}

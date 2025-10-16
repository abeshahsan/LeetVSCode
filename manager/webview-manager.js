import path from "path";
import * as vscode from "vscode";
import fetch from "node-fetch";
import { runLoginProcess } from "./login-manager.js";
import { getProblems as fetchProblems, getProblemDetails } from "./leetcode-utils.js";

let panel;

function mapLangSlugToVsCode(slug) {
	const s = (slug || "").toLowerCase();
	const map = {
		javascript: "javascript",
		typescript: "typescript",
		ts: "typescript",
		js: "javascript",
		python3: "python",
		python: "python",
		java: "java",
		cpp: "cpp",
		c: "c",
		csharp: "csharp",
		cs: "csharp",
		go: "go",
		golang: "go",
		kotlin: "kotlin",
		rust: "rust",
		ruby: "ruby",
		swift: "swift",
		php: "php",
		scala: "scala"
	};
	return map[s] || "plaintext";
}

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
					const data = await fetchProblems(1, 10);
					panel?.webview.postMessage({ command: "problems", data });
					break;
				}

				case "open-problem": {
					const { titleSlug } = message.problem;
					const cookies = context.globalState.get("leetcode_cookies");
					const res = await getProblemDetails(titleSlug, { cookies });

					// Always reveal the problem webview in the first column
					panel?.reveal(vscode.ViewColumn.One);
					panel?.webview.postMessage({ command: "problemDetails", data: res });

					// Open a solution editor in a separate (second) column
					try {
						const question = res?.question || res?.data?.question || {};
						const snippets = question.codeSnippets || [];

						// Prefer JavaScript/TypeScript, otherwise first snippet
						const preferredOrder = ["typescript", "javascript", "python3", "python", "java", "cpp"];
						const chosen =
							preferredOrder
								.map((ls) => snippets.find((s) => s.langSlug?.toLowerCase() === ls))
								.find(Boolean) || snippets[0];

						const langSlug = (chosen?.langSlug || "plaintext").toLowerCase();
						const languageId = mapLangSlugToVsCode(langSlug);

						const header = `// ${question?.questionFrontendId ? question.questionFrontendId + ". " : ""}${question?.title || titleSlug || "Problem"}`;
						const separator = `\n// ------------------------------\n`;
						const prompt = `// TODO: Implement your solution below.\n`;
						const content = [header, separator, prompt, chosen?.code || ""].join("\n");

						const doc = await vscode.workspace.openTextDocument({ language: languageId, content });
						await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Two, preview: false });
					} catch (e) {
						console.error("Failed to open solution editor:", e);
						vscode.window.showWarningMessage("Opened problem, but failed to open solution editor.");
					}
					break;
				}

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

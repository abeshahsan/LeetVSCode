import path from "path";
import * as vscode from "vscode";
import fetch from "node-fetch";
import { runLoginProcess } from "./login-manager.js";
import { getProblems as fetchProblems } from "./leetcode-utils.js";

let panel;

function getWebviewContent(webview, extensionPath) {
	const scriptSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.js")));
	const cssSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.css")));

	return `<!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="Content-Security-Policy" content="script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource};">
        <link rel="stylesheet" href="${cssSrc}">
    </head>
    <body>
        <div id="root"></div>
        <script>
            const vscode = acquireVsCodeApi();
            window.vscode = vscode;
            window.addEventListener('message', event => {
                window.dispatchEvent(new CustomEvent('vscode-message', { detail: event.data }));
            });
        </script>
        <script src="${scriptSrc}"></script>
    </body>
    </html>`;
}

async function fetchResponseToWebview(responseOptions) {
	let { url, requestId } = responseOptions;
	try {
		const response = await fetch(url);
		const data = await response.json();
		panel.webview.postMessage({
			command: "fetchResponse",
			requestId: requestId,
			data: data,
		});
	} catch (error) {
		panel.webview.postMessage({
			command: "fetchError",
			requestId: requestId,
			error: error.message,
		});
	}
}

export function createOrShowWebview(context) {
	if (panel) {
		panel.reveal(vscode.ViewColumn.One);
		return;
	}

	panel = vscode.window.createWebviewPanel("webview", "React App", vscode.ViewColumn.One, {
		enableScripts: true,
	});

	panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.command === "fetch") {
			fetchResponseToWebview(message);
		} else if (message.command === "login") {
			runLoginProcess(panel, context);
		} else if (message.command === "checkSession") {
			const sess = context.globalState.get("leetcode_cookies");
			panel?.webview.postMessage({
				command: "session",
				cookiesExist: !!sess,
			});
		} else if (message.command === "fetch-problems") {
			fetchProblems(1, 10)
				.then((data) => {
					// console.log(data);
					panel?.webview.postMessage({
						command: "problems",
						data: data,
					});
				})
				.catch((err) => {
					console.error(err);
				});
		} else if (message.command === "logout") {
			await context.globalState.update("leetcode_cookies", null);
			vscode.window.showInformationMessage("Logged out successfully.");
		}
	});

	panel.onDidDispose(() => {
		panel = undefined;
	});
}

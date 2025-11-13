import path from "path";
import * as vscode from "vscode";

export function getWebviewHtml(webview, extensionPath, initialState) {
	const scriptSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.js")));
	const cssSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.css")));

	const stateJson = JSON.stringify(initialState || {});

	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="${cssSrc}">
	</head>
	<body>
		<div id="root"></div>
		<script>
			const vscode = acquireVsCodeApi();
			window.vscode = vscode;
			const initialState = ${stateJson};
			window.__INITIAL_STATE__ = vscode.getState() || initialState;
			window.addEventListener('message', event => {
				window.dispatchEvent(new CustomEvent('vscode-message', { detail: event.data }));
			});
		</script>
		<script type="module" src="${scriptSrc}"></script>
	</body>
	</html>
	`;
}

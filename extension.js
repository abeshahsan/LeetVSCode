import path from "path";
import * as vscode from "vscode";
import fetch from "node-fetch";

let panel;

function createOrShowWebview(context) {
	if (panel) {
		panel.reveal(vscode.ViewColumn.One);
		return;
	}

	panel = vscode.window.createWebviewPanel("webview", "React App", vscode.ViewColumn.One, {
		enableScripts: true,
	});

	panel.webview.html = getWebviewContent(panel.webview, context.extensionPath);

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

	panel.webview.onDidReceiveMessage(async (message) => {
		console.log(message);
		
		if (message.command === "fetch") {
			try {
				const response = await fetch(message.url);
				const data = await response.json();
				panel.webview.postMessage({
					command: "fetchResponse",
					requestId: message.requestId,
					data: data,
				});
			} catch (error) {
				panel.webview.postMessage({
					command: "fetchError",
					requestId: message.requestId,
					error: error.message,
				});
			}
		}
	});

	panel.onDidDispose(() => {
		panel = undefined;
	});
}

function activate(context) {
	createOrShowWebview(context);
}

function deactivate() {}

export { activate, deactivate };

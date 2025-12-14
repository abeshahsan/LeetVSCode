import * as vscode from "vscode";
import { runLoginProcess } from "./login-manager.js";
import { getWebviewHtml } from "./services/webview-template.js";
import { openOrCreateSolutionFile } from "./services/solution-file.js";
import { runRemote, submitSolution } from "./services/leetcode-runner.js";
import { openProblemFromSlug } from "./services/problem-service.js";
import logger from "./logger.js";
import { setDefaultLanguage } from "./utils/storage-manager.js";
import { saveWebviewState, getWebviewState } from "./webview-serializer.js";

let panel;
let _provider; // Store provider reference for login refresh

export function setProvider(provider) {
	_provider = provider;
}

export function setPanel(panelInstance) {
	panel = panelInstance;
}

export function createOrShowWebview(context) {
	const savedState = context.globalState.get("leetcode_state") || {};

	if (_revealExistingPanel()) return panel;

	panel = _createPanel(context, savedState);
	_attachWebviewHandlers(panel, context);
	_attachDisposeHandler(panel);

	return panel;
}

function _revealExistingPanel() {
	if (!panel) return false;
	try {
		panel.reveal(vscode.ViewColumn.One);
		return true;
	} catch (error) {
		// Panel is disposed or cannot be revealed
		panel = null;
		return false;
	}
}

function _createPanel(context, savedState) {
	const newPanel = vscode.window.createWebviewPanel(
		"vs-leet-webview",
		"VS-Leet",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
		}
	);

	newPanel.webview.html = getWebviewHtml(newPanel.webview, context.extensionPath, savedState);
	
	// Override getState for proper serialization
	const originalGetState = newPanel.webview.getState;
	newPanel.webview.getState = () => {
		return getWebviewState(newPanel) || originalGetState?.call(newPanel.webview);
	};
	
	return newPanel;
}

export function _attachWebviewHandlers(panelInstance, context) {
	panelInstance.webview.onDidReceiveMessage(async (message) => {
		try {
			await _handleWebviewMessage(message, panelInstance, context);
		} catch (err) {
			logger.error(`Webview message handling error: ${err.message}`);
			vscode.window.showErrorMessage(`Error: ${err.message}`);
		}
	});
}

function _attachDisposeHandler(panelInstance) {
	panelInstance.onDidDispose(() => {
		panel = undefined;
	}, null, []);
}

async function _handleWebviewMessage(message, panelInstance, context) {
	switch (message.command) {
		case "login":
			await runLoginProcess(panelInstance, context, _provider);
			// Trigger refresh after login from webview
			if (_provider) {
				await vscode.commands.executeCommand("vs-leet.refreshStatus");
			}
			break;

		case "open-solution-file": {
			const { slug, langSlug, code } = message;
			await openOrCreateSolutionFile(context, { slug, langSlug, code });
			break;
		}

		case "run-remote": {
			logger.info(`Received run-remote request : ${JSON.stringify(message)}`);
			runRemote(panelInstance, context, message);
			break;
		}

		case "submit-code": {
			logger.debug(`Received submit-code request : ${JSON.stringify(message)}`);
			await submitSolution(panelInstance, context, message);
			break;
		}

		case "language-changed": {
			const { langSlug } = message;
			if (langSlug) {
				await setDefaultLanguage(context, langSlug);
				logger.debug(`Default language changed to: ${langSlug}`);
			}
			break;
		}
	}
}
export function closeWebview() {
	if (panel) {
		try {
			panel.dispose();
			panel = undefined;
		} catch (error) {
			// Panel might already be disposed
		}
	}
}

export async function openProblemFromExtension(context, titleSlug) {
	try {
		createOrShowWebview(context);
		await openProblemFromSlug(context, titleSlug, panel);
		// Save problem slug for serialization
		await saveWebviewState(panel, titleSlug, context);
	} catch (err) {
		logger.error(`Failed to open problem: ${err.message}`);
		vscode.window.showErrorMessage(`Failed to open problem: ${err.message}`);
	}
}

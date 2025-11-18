import * as vscode from "vscode";
import { runLoginProcess } from "./login-manager.js";
import { ProblemListQuery } from "./services/leetcode-queries.js";
import Problem from "../models/problem.js";
import { getWebviewHtml } from "./services/webview-template.js";
import { openOrCreateSolutionFile } from "./services/solution-file.js";
import { runRemote, submitSolution } from "./services/leetcode-runner.js";
import { openProblemFromSlug, getProblemDetailsJson } from "./services/problem-service.js";
import logger from "./logger.js";

let panel;
let _provider; // Store provider reference for login refresh

export function setProvider(provider) {
	_provider = provider;
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
	const newPanel = vscode.window.createWebviewPanel("webview", "VS-Leet", vscode.ViewColumn.One, {
		enableScripts: true,
		retainContextWhenHidden: true,
	});

	newPanel.webview.html = getWebviewHtml(newPanel.webview, context.extensionPath, savedState);
	return newPanel;
}

function _attachWebviewHandlers(panelInstance, context) {
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
		if (panel) {
			panel.webview.postMessage({ command: "requestStateSave" });
		}
		panel = undefined;
	});
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

		case "checkSession": {
			const sess = context.globalState.get("leetcode_cookies");
			panelInstance?.webview.postMessage({ command: "session", cookiesExist: !!sess });
			break;
		}

		case "open-problem": {
			const { titleSlug } = message.problem;
			await openProblemFromSlug(context, titleSlug, panelInstance);
			break;
		}

		case "open-solution-file": {
			const { slug, langSlug, code } = message;
			await openOrCreateSolutionFile(context, { slug, langSlug, code });
			break;
		}

		case "run-remote": {
			const { slug, langSlug, input } = message;
			await runRemote(panelInstance, context, { slug, langSlug, input });
			break;
		}

		case "getAllProblems": {
			try {
				logger.debug(`Fetching all problems`);
				let cookies = context.globalState.get("leetcode_cookies");
				const data = await new ProblemListQuery({ cookies }).run();
				const problems = data?.problemsetQuestionList?.questions || [];

				problems.forEach((element) => {
					new Problem(element).addToAll();
				});

				logger.debug(`Found ${problems.length} problems`);
				panelInstance?.webview.postMessage({ command: "allProblems", data: problems });
			} catch (err) {
				logger.error(`Failed to fetch problems: ${err.message}`);
				panelInstance?.webview.postMessage({ command: "allProblemsError", error: String(err) });
			}
			break;
		}

		case "getProblemDetails": {
			const { slug } = message;
			try {
				const details = await getProblemDetailsJson(context, slug);
				const defaultLanguage = vscode.workspace.getConfiguration("vs-leet").get("defaultLanguage");
				panelInstance?.webview.postMessage({
					command: "problemDetails",
					data: details,
					defaultLanguage: defaultLanguage,
				});
			} catch (err) {
				panelInstance?.webview.postMessage({ command: "problemDetailsError", error: String(err) });
			}
			break;
		}

		case "submit-code": {
			const { slug, langSlug } = message;
			await submitSolution(panelInstance, context, { slug, langSlug });
			break;
		}

		case "logout":
			await vscode.commands.executeCommand("vs-leet.signOut", context);
			break;

		case "saveState":
			await context.globalState.update("leetcode_state", message.state);
			panelInstance?.webview.postMessage({ command: "stateSaved" });
			break;
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

export function notifySession(loggedIn) {
	if (panel) {
		panel.webview.postMessage({
			command: "session",
			cookiesExist: loggedIn,
		});
	}
}

export async function openProblemFromExtension(context, titleSlug) {
	try {
		createOrShowWebview(context);
		await openProblemFromSlug(context, titleSlug, panel);
	} catch (err) {
		logger.error(`Failed to open problem: ${err.message}`);
		vscode.window.showErrorMessage(`Failed to open problem: ${err.message}`);
	}
}

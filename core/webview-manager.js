import * as vscode from "vscode";
import { runLoginProcess } from "./login-manager.js";
import { ProblemListQuery } from "./leetcode-utils.js";
import Problem from "../models/problem.js";
import { getWebviewHtml } from "./services/webview-template.js";
import { openOrCreateSolutionFile } from "./services/solution-file.js";
import { runRemote, submitSolution } from "./services/leetcode-runner.js";
import { openProblemFromSlug, getProblemDetailsJson } from "./services/problem-service.js";
import { leetcodeOutputChannel } from "../output-logger.js";

let panel;


export function createOrShowWebview(context) {
	const savedState = context.globalState.get("leetcode_state") || {};

	// Check if panel exists and is not disposed
	if (panel) {
		try {
			panel.reveal(vscode.ViewColumn.One);
			return panel;
		} catch (error) {
			// Panel is disposed, set to null and create a new one
			panel = null;
		}
	}

	// Create new panel if none exists or if the existing one is disposed
	panel = vscode.window.createWebviewPanel("webview", "LeetVSCode", vscode.ViewColumn.One, {
		enableScripts: true,
		retainContextWhenHidden: true,
	});

	panel.webview.html = getWebviewHtml(panel.webview, context.extensionPath, savedState);

	panel.webview.onDidReceiveMessage(async (message) => {
		try {
			switch (message.command) {
				case "login":
					await runLoginProcess(panel, context);
					break;

				case "checkSession": {
					const sess = context.globalState.get("leetcode_cookies");
					panel?.webview.postMessage({ command: "session", cookiesExist: !!sess });
					break;
				}

				case "open-problem": {
					const { titleSlug } = message.problem;
					await openProblemFromSlug(context, titleSlug, panel);
					break;
				}

				case "open-solution-file": {
					const { slug, langSlug, code } = message;
					await openOrCreateSolutionFile(context, { slug, langSlug, code });
					break;
				}

				case "run-remote": {
					const { slug, langSlug, input } = message;
					await runRemote(panel, context, { slug, langSlug, input });
					break;
				}

				case "getAllProblems": {
					try {
						leetcodeOutputChannel.appendLine(`[getAllProblems] Fetching all problems`);
						let cookies = context.globalState.get("leetcode_cookies");
						const data = await new ProblemListQuery({ cookies }).run();
						const problems = data?.problemsetQuestionList?.questions || [];

						problems.forEach((element) => {
							new Problem(element).addToAll();
						});

						leetcodeOutputChannel.appendLine(`[getAllProblems] Found ${problems.length} problems`);
						panel?.webview.postMessage({ command: "allProblems", data: problems });
					} catch (err) {
						leetcodeOutputChannel.appendLine(`[getAllProblems] Error: ${err.message}`);
						panel?.webview.postMessage({ command: "allProblemsError", error: String(err) });
					}
					break;
				}

				case "getProblemDetails": {
					const { slug } = message;
					try {
						const details = await getProblemDetailsJson(context, slug);
						panel?.webview.postMessage({ command: "problemDetails", data: details });
					} catch (err) {
						panel?.webview.postMessage({ command: "problemDetailsError", error: String(err) });
					}
					break;
				}

				case "submit-code": {
					const { slug, langSlug } = message;
					await submitSolution(panel, context, { slug, langSlug });
					break;
				}

				case "logout":
					await vscode.commands.executeCommand("leet.logout", context);
					break;

				case "saveState":
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

export function notifySession(cookiesExist) {
	panel?.webview.postMessage({ command: "session", cookiesExist: !!cookiesExist });
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
	} catch (err) {
		console.error("Failed to open problem from extension:", err);
		vscode.window.showErrorMessage(`Failed to open problem: ${err.message}`);
	}
}

import path from "path";
import * as vscode from "vscode";
import fetch from "node-fetch";
import { runLoginProcess } from "./login-manager.js";
import { ProblemDetailsQuery, ProblemListQuery, langToExtentionMap } from "./leetcode-utils.js";
import * as fs from "fs";

import { leetcodeOutputChannel } from "../output-logger.js";
import Problem from "../data/problem.js";

let panel;

async function readJsonOrText(res) {
	const text = await res.text().catch(() => "");
	try {
		const obj = text ? JSON.parse(text) : undefined;
		return { obj, text };
	} catch {
		return { obj: undefined, text };
	}
}

function getWebviewContent(webview, extensionPath, initialState) {
	const scriptSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.js")));
	const cssSrc = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "web", "dist", "main.css")));

	const stateJson = JSON.stringify(initialState || {});

	return `<!DOCTYPE html>
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
</html>`;
}

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

	panel.webview.html = getWebviewContent(panel.webview, context.extensionPath, savedState);

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
					const cookies = context.globalState.get("leetcode_cookies");
					const res = await new ProblemDetailsQuery({ cookies }).run(titleSlug);
					panel?.reveal(vscode.ViewColumn.One);
					panel?.webview.postMessage({ command: "problemDetails", data: res });
					break;
				}

				case "open-solution-file": {
					const { slug, langSlug, code } = message;
					try {
						const ext = langToExtentionMap[langSlug] || "txt";
						const solutionsDir = path.join(context.extensionPath, "Solutions");
						fs.mkdirSync(solutionsDir, { recursive: true });
						const filePath = path.join(solutionsDir, `${slug}.${ext}`);
						if (!fs.existsSync(filePath)) {
							const header = `// ${slug} (${langSlug})\n`;
							const initial = code ? `${code}\n` : header;
							fs.writeFileSync(filePath, initial, "utf8");
						}
						const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
						// Close all other visible text editors so the opened/created file becomes the only one
						// First, show the document in a new editor column (or reuse) to get its TextEditor reference
						const openedEditor = await vscode.window.showTextDocument(doc, {
							viewColumn: vscode.ViewColumn.Two,
							preview: false,
						});
						// Then, close all other visible text editors excluding the one we just opened
						for (const editor of vscode.window.visibleTextEditors) {
							if (editor.document.uri.toString() !== openedEditor.document.uri.toString()) {
								try {
									await vscode.window.showTextDocument(editor.document, { preview: false });
									await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
								} catch (e) {
									// ignore errors closing individual editors
								}
							}
						}
					} catch (e) {
						vscode.window.showErrorMessage(`Failed to open solution file: ${e?.message || e}`);
					}
					break;
				}

				case "run-remote": {
					const { slug, langSlug, input } = message;
					try {
						leetcodeOutputChannel.appendLine(`[run-remote] Starting with slug=${slug}, lang=${langSlug}`);

						const cookies = context.globalState.get("leetcode_cookies") || [];
						leetcodeOutputChannel.appendLine(`[run-remote] Found ${cookies.length} cookies`);

						const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
						const csrftoken = cookies.find((c) => c.name === "csrftoken")?.value || "";

						const langMap = {
							javascript: "javascript",
							typescript: "typescript",
							python: "python",
							python3: "python3",
							java: "java",
							cpp: "cpp",
							c: "c",
							csharp: "csharp",
							go: "golang",
						};
						const langToUse = langMap[langSlug] || langSlug || "javascript";

						let questionId = null;
						try {
							const details = await new ProblemDetailsQuery({ cookies }).run(slug);
							questionId = details?.question?.questionId || details?.questionId || null;
						} catch (e) {
							leetcodeOutputChannel.appendLine(
								`[run-remote] Failed to get question details: ${e.message}`
							);
						}

						let typed_code = "";
						try {
							const solutionsDir = path.join(context.extensionPath, "Solutions");
							const exts = ["cpp", "java", "py", "js", "ts", "c", "cs", "go"];
							const found = exts.map((e) => path.join(solutionsDir, `${slug}.${e}`)).find(fs.existsSync);
							if (found) {
								typed_code = fs.readFileSync(found, "utf8");
								leetcodeOutputChannel.appendLine(`[run-remote] Solution loaded from: ${found}`);
							}
						} catch (e) {
							leetcodeOutputChannel.appendLine(`[run-remote] Error reading code: ${e.message}`);
						}

						const payload = {
							lang: langToUse,
							question_id: questionId || "",
							typed_code,
							data_input: input,
						};

						const url = `https://leetcode.com/problems/${slug}/interpret_solution/`;
						leetcodeOutputChannel.appendLine(`[run-remote] POST ${url}`);
						leetcodeOutputChannel.appendLine(`[run-remote] Payload: ${JSON.stringify(payload, null, 2)}`);

						const res = await fetch(url, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Origin: "https://leetcode.com",
								Referer: `https://leetcode.com/problems/${slug}/`,
								Cookie: cookieStr,
								"x-csrftoken": csrftoken,
							},
							body: JSON.stringify(payload),
						});

						const { obj: postObj, text: postText } = await readJsonOrText(res);
						leetcodeOutputChannel.appendLine(`[run-remote] POST status: ${res.status}`);
						leetcodeOutputChannel.appendLine(`[run-remote] POST response: ${postText}`);

						const interpretId = postObj?.interpret_id || postObj?.interpretation_id;
						if (!interpretId) {
							panel?.webview.postMessage({ command: "runError", error: "No interpret_id returned" });
							return;
						}

						const checkUrl = `https://leetcode.com/submissions/detail/${interpretId}/check/`;
						leetcodeOutputChannel.appendLine(`[run-remote] Polling check URL: ${checkUrl}`);

						let final = null;
						for (let attempt = 1; attempt <= 60; attempt++) {
							await new Promise((r) => setTimeout(r, 1000));
							const checkRes = await fetch(checkUrl, {
								method: "GET",
								headers: {
									"Content-Type": "application/json",
									Origin: "https://leetcode.com",
									Referer: `https://leetcode.com/problems/${slug}/submissions/`,
									Cookie: cookieStr,
									"x-csrftoken": csrftoken,
								},
							});

							const { obj: checkObj, text: checkText } = await readJsonOrText(checkRes);
							leetcodeOutputChannel.appendLine(
								`[run-remote] CHECK #${attempt} status=${checkRes.status}`
							);
							leetcodeOutputChannel.appendLine(`[run-remote] CHECK response: ${checkText}`);

							const state = checkObj?.state || checkObj?.status_msg || "";
							if (/SUCCESS|FINISHED|Accepted|AC/i.test(state)) {
								final = checkObj;
								leetcodeOutputChannel.appendLine(`[run-remote] Final state reached: ${state}`);
								break;
							}
						}

						if (final) {
							leetcodeOutputChannel.appendLine(
								`[run-remote] Final response JSON: ${JSON.stringify(final, null, 2)}`
							);
						} else {
							leetcodeOutputChannel.appendLine(`[run-remote] No final response - timeout occurred`);
						}

						panel?.webview.postMessage({ command: "runResponse", data: final || { error: "Timeout" } });
					} catch (err) {
						leetcodeOutputChannel.appendLine(`[run-remote] Error: ${err.message}`);
						panel?.webview.postMessage({ command: "runError", error: String(err) });
					}
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
						leetcodeOutputChannel.appendLine(`[getProblemDetails] Fetching details for ${slug}`);
						const cookies = context.globalState.get("leetcode_cookies");
						const res = await new ProblemDetailsQuery({ cookies }).run(slug);
						leetcodeOutputChannel.appendLine(
							`[getProblemDetails] Successfully fetched details for ${slug}`
						);
						panel?.webview.postMessage({ command: "problemDetails", data: res });
					} catch (err) {
						leetcodeOutputChannel.appendLine(`[getProblemDetails] Error: ${err.message}`);
						panel?.webview.postMessage({ command: "problemDetailsError", error: String(err) });
					}
					break;
				}

				case "submit-code": {
					const { slug, langSlug } = message;
					try {
						leetcodeOutputChannel.appendLine(`[submit-code] Starting with slug=${slug}, lang=${langSlug}`);

						const cookies = context.globalState.get("leetcode_cookies") || [];
						leetcodeOutputChannel.appendLine(`[submit-code] Found ${cookies.length} cookies`);

						const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
						const csrftoken = cookies.find((c) => c.name === "csrftoken")?.value || "";

						// Get problem details to get questionId
						const problemDetails = await new ProblemDetailsQuery({ cookies }).run(slug);
						const questionId = problemDetails?.question?.questionId;

						if (!questionId) {
							throw new Error("Could not get question ID");
						}

						leetcodeOutputChannel.appendLine(`[submit-code] Question ID: ${questionId}`);

						// Read the code from the solution file
						let typed_code = "";
						try {
							const solutionsDir = path.join(context.extensionPath, "Solutions");
							const exts = ["cpp", "java", "py", "js", "ts", "c", "cs", "go"];
							const found = exts.map((e) => path.join(solutionsDir, `${slug}.${e}`)).find(fs.existsSync);
							if (found) {
								typed_code = fs.readFileSync(found, "utf8");
								leetcodeOutputChannel.appendLine(`[submit-code] Solution loaded from: ${found}`);
							} else {
								throw new Error("No solution file found");
							}
						} catch (e) {
							leetcodeOutputChannel.appendLine(`[submit-code] Error reading code: ${e.message}`);
							throw new Error(`Error reading solution file: ${e.message}`);
						}

						// Map language slug to what LeetCode expects
						const langToUse =
							langSlug === "cpp" ? "cpp" : langSlug === "javascript" ? "javascript" : langSlug;

						const payload = {
							lang: langToUse,
							question_id: questionId,
							typed_code,
						};

						const url = `https://leetcode.com/problems/${slug}/submit/`;
						leetcodeOutputChannel.appendLine(`[submit-code] POST ${url}`);
						leetcodeOutputChannel.appendLine(`[submit-code] Payload: ${JSON.stringify(payload, null, 2)}`);

						const res = await fetch(url, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Origin: "https://leetcode.com",
								Referer: `https://leetcode.com/problems/${slug}/`,
								Cookie: cookieStr,
								"x-csrftoken": csrftoken,
							},
							body: JSON.stringify(payload),
						});

						const { obj: postObj, text: postText } = await readJsonOrText(res);
						leetcodeOutputChannel.appendLine(`[submit-code] POST status: ${res.status}`);
						leetcodeOutputChannel.appendLine(`[submit-code] POST response: ${postText}`);

						const submissionId = postObj?.submission_id;
						if (!submissionId) {
							leetcodeOutputChannel.appendLine(`[submit-code] No submission_id returned`);
							panel?.webview.postMessage({ command: "submitError", error: "No submission_id returned" });
							return;
						}

						leetcodeOutputChannel.appendLine(`[submit-code] Submission ID: ${submissionId}`);

						// Poll for submission results
						const checkUrl = `https://leetcode.com/submissions/detail/${submissionId}/check/`;
						leetcodeOutputChannel.appendLine(`[submit-code] Polling check URL: ${checkUrl}`);

						let final = null;
						for (let attempt = 1; attempt <= 60; attempt++) {
							await new Promise((r) => setTimeout(r, 1000));
							const checkRes = await fetch(checkUrl, {
								method: "GET",
								headers: {
									"Content-Type": "application/json",
									Origin: "https://leetcode.com",
									Referer: `https://leetcode.com/problems/${slug}/`,
									Cookie: cookieStr,
									"x-csrftoken": csrftoken,
								},
							});

							const { obj: checkObj, text: checkText } = await readJsonOrText(checkRes);
							leetcodeOutputChannel.appendLine(
								`[submit-code] Attempt ${attempt} status: ${checkRes.status}`
							);
							leetcodeOutputChannel.appendLine(`[submit-code] Attempt ${attempt} response: ${checkText}`);

							if (checkObj?.state === "SUCCESS") {
								final = checkObj;
								break;
							}
							if (checkObj?.state === "FAILURE" || checkObj?.state === "ERROR") {
								final = checkObj;
								break;
							}
						}

						leetcodeOutputChannel.appendLine(
							`[submit-code] Final result: ${JSON.stringify(final, null, 2)}`
						);
						panel?.webview.postMessage({ command: "submitResponse", data: final || { error: "Timeout" } });
					} catch (err) {
						leetcodeOutputChannel.appendLine(`[submit-code] Error: ${err.message}`);
						panel?.webview.postMessage({ command: "submitError", error: String(err) });
					}
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

export async function openProblemFromExtension(context, titleSlug) {
	try {
		createOrShowWebview(context);
		const cookies = context.globalState.get("leetcode_cookies");
		const res = await new ProblemDetailsQuery({ cookies }).run(titleSlug);
		panel?.reveal(vscode.ViewColumn.One);
		panel?.webview.postMessage({ command: "problemDetails", data: res });
	} catch (err) {
		console.error("Failed to open problem from extension:", err);
		vscode.window.showErrorMessage(`Failed to open problem: ${err.message}`);
	}
}

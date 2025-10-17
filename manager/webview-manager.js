import path from "path";
import * as vscode from "vscode";
import fetch from "node-fetch";
import { runLoginProcess } from "./login-manager.js";
import { getProblemDetails } from "./leetcode-utils.js";
import * as fs from "fs";

let panel;

const output = vscode.window.createOutputChannel("LeetCode Runner");

// Read response body once as text, try JSON.parse, return both
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
					const res = await getProblemDetails(titleSlug, { cookies });
					panel?.reveal(vscode.ViewColumn.One);
					panel?.webview.postMessage({ command: "problemDetails", data: res });
					break;
				}

				case "open-solution-file": {
					const { slug, langSlug, code } = message;
					try {
						const langMap = {
							javascript: "js",
							typescript: "ts",
							python: "py",
							python3: "py",
							java: "java",
							cpp: "cpp",
							c: "c",
							csharp: "cs",
							go: "go",
							rust: "rs",
							kotlin: "kt",
							swift: "swift",
							ruby: "rb",
							scala: "scala",
							php: "php",
							dart: "dart",
							typescriptreact: "tsx",
							javascriptreact: "jsx",
						};
						const ext = langMap[langSlug] || langSlug || "txt";
						const solutionsDir = path.join(context.extensionPath, "Solutions");
						fs.mkdirSync(solutionsDir, { recursive: true });
						const filePath = path.join(solutionsDir, `${slug}.${ext}`);
						if (!fs.existsSync(filePath)) {
							const header = `// ${slug} (${langSlug})\n`;
							const initial = code ? `${code}\n` : header;
							fs.writeFileSync(filePath, initial, "utf8");
						}
						const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
						await vscode.window.showTextDocument(doc, {
							viewColumn: vscode.ViewColumn.Two,
							preview: false,
						});
					} catch (e) {
						vscode.window.showErrorMessage(`Failed to open solution file: ${e?.message || e}`);
					}
					break;
				}

				case "run-remote": {
					const { slug, langSlug, input } = message;
					try {
						output.appendLine(`[run-remote] Starting with slug=${slug}, lang=${langSlug}`);
						
						const cookies = context.globalState.get("leetcode_cookies") || [];
						output.appendLine(`[run-remote] Found ${cookies.length} cookies`);
						
						const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
						const csrftoken = cookies.find((c) => c.name === "csrftoken")?.value || "";

						const langMap = {
							javascript: "javascript",
							typescript: "typescript", 
							python: "python3",
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
							const details = await getProblemDetails(slug, { cookies });
							questionId = details?.question?.questionId || details?.questionId || null;
						} catch (e) {
							output.appendLine(`[run-remote] Failed to get question details: ${e.message}`);
						}

						let typed_code = "";
						try {
							const solutionsDir = path.join(context.extensionPath, "Solutions");
							const exts = ["cpp", "java", "py", "js", "ts", "c", "cs", "go"];
							const found = exts.map((e) => path.join(solutionsDir, `${slug}.${e}`)).find(fs.existsSync);
							if (found) {
								typed_code = fs.readFileSync(found, "utf8");
								output.appendLine(`[run-remote] Solution loaded from: ${found}`);
							}
						} catch (e) {
							output.appendLine(`[run-remote] Error reading code: ${e.message}`);
						}

						const payload = {
							lang: langToUse,
							question_id: questionId || "",
							typed_code,
							data_input: input,
						};

						const url = `https://leetcode.com/problems/${slug}/interpret_solution/`;
						output.appendLine(`[run-remote] POST ${url}`);
						output.appendLine(`[run-remote] Payload: ${JSON.stringify(payload, null, 2)}`);

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
						output.appendLine(`[run-remote] POST status: ${res.status}`);
						output.appendLine(`[run-remote] POST response: ${postText}`);

						const interpretId = postObj?.interpret_id || postObj?.interpretation_id;
						if (!interpretId) {
							panel?.webview.postMessage({ command: "runError", error: "No interpret_id returned" });
							return;
						}

						const checkUrl = `https://leetcode.com/submissions/detail/${interpretId}/check/`;
						output.appendLine(`[run-remote] Polling check URL: ${checkUrl}`);

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
							output.appendLine(`[run-remote] CHECK #${attempt} status=${checkRes.status}`);
							output.appendLine(`[run-remote] CHECK response: ${checkText}`);

							const state = checkObj?.state || checkObj?.status_msg || "";
							if (/SUCCESS|FINISHED|Accepted|AC/i.test(state)) {
								final = checkObj;
								output.appendLine(`[run-remote] Final state reached: ${state}`);
								break;
							}
						}

						if (final) {
							output.appendLine(`[run-remote] Final response JSON: ${JSON.stringify(final, null, 2)}`);
						} else {
							output.appendLine(`[run-remote] No final response - timeout occurred`);
						}

						panel?.webview.postMessage({ command: "runResponse", data: final || { error: "Timeout" } });
					} catch (err) {
						output.appendLine(`[run-remote] Error: ${err.message}`);
						panel?.webview.postMessage({ command: "runError", error: String(err) });
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
		const res = await getProblemDetails(titleSlug, { cookies });
		panel?.reveal(vscode.ViewColumn.One);
		panel?.webview.postMessage({ command: "problemDetails", data: res });
	} catch (err) {
		console.error("Failed to open problem from extension:", err);
		vscode.window.showErrorMessage(`Failed to open problem: ${err.message}`);
	}
}

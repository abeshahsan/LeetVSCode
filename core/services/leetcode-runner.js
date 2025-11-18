import path from "path";
import * as fs from "fs";
import fetch from "node-fetch";
import { ProblemDetailsQuery } from "./leetcode-queries.js";
import ProblemDetails from "../../models/problem-details.js";
import { logError, logDebug } from "../../output-logger.js";
import { readJsonOrText } from "../utils/http.js";
import { stripEditorSupport } from "../utils/editor-support.js";

function getCookieContext(context) {
	const cookies = context.globalState.get("leetcode_cookies") || [];
	const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
	const csrftoken = cookies.find((c) => c.name === "csrftoken")?.value || "";
	return { cookies, cookieStr, csrftoken };
}

function mapLang(langSlug) {
	const m = {
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
	return m[langSlug] || langSlug || "javascript";
}

async function loadTypedCode(context, slug) {
	if (!slug) return "";
	
	const workspaceRoot = context.extensionPath;
	const solutionsDir = path.join(workspaceRoot, "Solutions");
	
	if (!fs.existsSync(solutionsDir)) {
		return "";
	}
	
	const exts = ["cpp", "java", "py", "js", "ts", "c", "cs", "go"];
	const found = exts.map((e) => path.join(solutionsDir, `${slug}.${e}`)).find(fs.existsSync);
	if (!found) return "";
	
	try {
		const raw = fs.readFileSync(found, "utf8");
		return stripEditorSupport(raw);
	} catch (err) {
		logError(`Failed to read solution file: ${err.message}`);
		return "";
	}
}

export async function runRemote(panel, context, { slug, langSlug, input }) {
	if (!slug || !langSlug) {
		throw new Error("Missing required parameters: slug and langSlug");
	}
	
	try {
		logDebug(`[run-remote] Starting with slug=${slug}, lang=${langSlug}`);
		const { cookies, cookieStr, csrftoken } = getCookieContext(context);
		
		if (!cookies || cookies.length === 0) {
			throw new Error("Not logged in. Please sign in first.");
		}
		
		logDebug(`[run-remote] Found ${cookies.length} cookies`);

		const questionId = await _getQuestionIdSafe(cookies, slug);
		const typed_code = await loadTypedCode(context, slug).catch(() => "");

		const payload = {
			lang: mapLang(langSlug),
			question_id: questionId || "",
			typed_code,
			data_input: input,
		};

		const url = `https://leetcode.com/problems/${slug}/interpret_solution/`;
		logDebug(`[run-remote] POST ${url}`);
		logDebug(`[run-remote] Payload: ${JSON.stringify(payload, null, 2)}`);

		const {
			obj: postObj,
			text: postText,
			status: postStatus,
		} = await _postJson(url, payload, cookieStr, csrftoken, `https://leetcode.com/problems/${slug}/`);
		logDebug(`[run-remote] POST status: ${postStatus}`);
		logDebug(`[run-remote] POST response: ${postText}`);

		const interpretId = postObj?.interpret_id || postObj?.interpretation_id;
		if (!interpretId) {
			panel?.webview.postMessage({ command: "runError", error: "No interpret_id returned" });
			return;
		}

		const checkUrl = `https://leetcode.com/submissions/detail/${interpretId}/check/`;
		logDebug(`[run-remote] Polling check URL: ${checkUrl}`);

		const final = await _pollCheck(
			checkUrl,
			cookieStr,
			csrftoken,
			`run-remote`,
			`https://leetcode.com/problems/${slug}/submissions/`,
			(checkObj) => {
				const state = checkObj?.state || checkObj?.status_msg || "";
				return /SUCCESS|FINISHED|Accepted|AC/i.test(state);
			}
		);

		if (final) {
			logDebug(`[run-remote] Final response JSON: ${JSON.stringify(final, null, 2)}`);
		} else {
			logDebug(`[run-remote] No final response - timeout occurred`);
		}

		panel?.webview.postMessage({ command: "runResponse", data: final || { error: "Timeout" } });
	} catch (err) {
		logDebug(`[run-remote] Error: ${err.message}`);
		panel?.webview.postMessage({ command: "runError", error: String(err) });
	}
}

export async function submitSolution(panel, context, { slug, langSlug }) {
	try {
		logDebug(`[submit-code] Starting with slug=${slug}, lang=${langSlug}`);
		const { cookies, cookieStr, csrftoken } = getCookieContext(context);
		logDebug(`[submit-code] Found ${cookies.length} cookies`);

		const questionId = await _getQuestionIdSafe(cookies, slug);
		if (!questionId) throw new Error("Could not get question ID");

		logDebug(`[submit-code] Question ID: ${questionId}`);

		const typed_code = await loadTypedCode(context, slug);
		if (!typed_code) throw new Error("No solution file found");

		const langToUse = langSlug === "cpp" ? "cpp" : langSlug === "javascript" ? "javascript" : langSlug;
		const payload = { lang: langToUse, question_id: questionId, typed_code };

		const url = `https://leetcode.com/problems/${slug}/submit/`;
		logDebug(`[submit-code] POST ${url}`);
		logDebug(`[submit-code] Payload: ${JSON.stringify(payload, null, 2)}`);

		const {
			obj: postObj,
			text: postText,
			status: postStatus,
		} = await _postJson(url, payload, cookieStr, csrftoken, `https://leetcode.com/problems/${slug}/`);
		logDebug(`[submit-code] POST status: ${postStatus}`);
		logDebug(`[submit-code] POST response: ${postText}`);

		const submissionId = postObj?.submission_id;
		if (!submissionId) {
			logDebug(`[submit-code] No submission_id returned`);
			panel?.webview.postMessage({ command: "submitError", error: "No submission_id returned" });
			return;
		}

		logDebug(`[submit-code] Submission ID: ${submissionId}`);
		const checkUrl = `https://leetcode.com/submissions/detail/${submissionId}/check/`;
		logDebug(`[submit-code] Polling check URL: ${checkUrl}`);

		const final = await _pollCheck(
			checkUrl,
			cookieStr,
			csrftoken,
			`submit-code`,
			`https://leetcode.com/problems/${slug}/`,
			(checkObj) => {
				return checkObj?.state === "SUCCESS" || checkObj?.state === "FAILURE" || checkObj?.state === "ERROR";
			}
		);

		logDebug(`[submit-code] Final result: ${JSON.stringify(final, null, 2)}`);
		panel?.webview.postMessage({ command: "submitResponse", data: final || { error: "Timeout" } });
	} catch (err) {
		logDebug(`[submit-code] Error: ${err.message}`);
		panel?.webview.postMessage({ command: "submitError", error: String(err) });
	}
}

async function _getQuestionIdSafe(cookies, slug) {
	try {
		const raw = await new ProblemDetailsQuery({ cookies }).run(slug);
		const details = ProblemDetails.fromGraphQL(raw);
		return details?.questionId || null;
	} catch (e) {
		logError(`[helper] Failed to get question details: ${e.message}`);
		return null;
	}
}

async function _postJson(url, payload, cookieStr, csrftoken, referer) {
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: "https://leetcode.com",
			Referer: referer,
			Cookie: cookieStr,
			"x-csrftoken": csrftoken,
		},
		body: JSON.stringify(payload),
	});

	const { obj, text } = await readJsonOrText(res);
	return { obj, text, status: res.status };
}

async function _pollCheck(checkUrl, cookieStr, csrftoken, prefix, referer, isFinal) {
	for (let attempt = 1; attempt <= 60; attempt++) {
		await new Promise((r) => setTimeout(r, 1000));
		const checkRes = await fetch(checkUrl, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Origin: "https://leetcode.com",
				Referer: referer,
				Cookie: cookieStr,
				"x-csrftoken": csrftoken,
			},
		});

		const { obj: checkObj, text: checkText } = await readJsonOrText(checkRes);
		logDebug(`[${prefix}] Attempt ${attempt} status: ${checkRes.status}`);
		logDebug(`[${prefix}] Attempt ${attempt} response: ${checkText}`);

		if (isFinal(checkObj)) {
			return checkObj;
		}
	}
	return null;
}

import path from "path";
import * as fs from "fs";
import fetch from "node-fetch";
import { ProblemDetailsQuery } from "./leetcode-queries.js";
import ProblemDetails from "../../models/problem-details.js";
import logger from "../logger.js";
import { readJsonOrText } from "../utils/http.js";
import { stripEditorSupport } from "../utils/editor-support.js";
import { leetcodeOutputChannel } from "../../output-logger.js";
import { getSolutionDirectory } from "../utils/directory-manager.js";
import { getCookies, getCsrfToken } from "../utils/storage-manager.js";

function getCookieContext(context) {
	const cookieStr = getCookies(context) || "";
	const csrftoken = getCsrfToken(context) || "";
	return { cookieStr, csrftoken };
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

async function loadTypedCode(context, filename) {
	return new Promise((resolve, reject) => {
		const solutionsDir = getSolutionDirectory(context);

		if (!solutionsDir) {
			logger.error("Solutions directory not configured");
			return reject(new Error("Solutions directory not configured. Please restart VS Code."));
		}

		if (!fs.existsSync(solutionsDir)) {
			logger.error(`Solutions directory does not exist: ${solutionsDir}`);
			return reject(new Error("Solutions directory does not exist"));
		}

		const filepath = path.join(solutionsDir, filename);
		logger.debug(`[run-remote] Loading solution file: ${filename}`);
		logger.debug(`[run-remote] Loading solution file: ${filepath}`);

		if (!fs.existsSync(filepath)) return reject(new Error("Solution file does not exist"));

		try {
			const raw = fs.readFileSync(filepath, "utf8");
			if (!raw) return reject(new Error("Solution file is empty"));
			return resolve(stripEditorSupport(raw));
		} catch (err) {
			logger.error(`Failed to read solution file: ${err.message}`);
			return reject(err);
		}
	});
}

export async function runRemote(panel, context, { slug, id, langSlug, input }) {
	if (!slug || !langSlug) {
		throw new Error("Missing required parameters: slug and langSlug");
	}

	try {
		logger.debug(`[run-remote] Starting with slug=${slug}, lang=${langSlug}`);
		const { cookieStr, csrftoken } = getCookieContext(context);

		if (!cookieStr) {
			throw new Error("Not logged in. Please sign in first.");
		}

		const questionId = id;
		const filename = path.join(`${slug}.${slugToExtMap[langSlug]}`);

		const typed_code = await loadTypedCode(context, filename).catch((error) => {
			throw new Error(`${error.message}`);
		});

		const payload = {
			lang: mapLang(langSlug),
			question_id: questionId || "",
			typed_code,
			data_input: input,
		};

		const url = `https://leetcode.com/problems/${slug}/interpret_solution/`;
		logger.debug(`[run-remote] POST ${url}`);
		logger.debug(`[run-remote] Payload: ${JSON.stringify(payload, null, 2)}`);

		let interpretId;

		try {
			const {
				obj: postObj,
				text: postText,
				status: postStatus,
			} = await _postJson(url, payload, cookieStr, csrftoken, `https://leetcode.com/problems/${slug}/`);
			interpretId = postObj?.interpret_id || postObj?.interpretation_id;
			logger.debug(`[run-remote] POST status: ${postStatus}`);
			// logger.debug(`[run-remote] POST response: ${postText}`);
		} catch (postErr) {
			logger.debug(`[run-remote] POST error: ${postErr.message}`);
			throw new Error(`Failed to submit code for remote run: ${postErr.message}`);
		}

		if (!interpretId) {
			panel?.webview.postMessage({ command: "runError", error: "No interpret_id returned" });
			return;
		}

		const checkUrl = `https://leetcode.com/submissions/detail/${interpretId}/check/`;
		logger.debug(`[run-remote] Polling check URL: ${checkUrl}`);

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
			logger.debug(`[run-remote] Final response JSON: ${JSON.stringify(final, null, 2)}`);
		} else {
			logger.debug(`[run-remote] No final response - timeout occurred`);
		}

		panel?.webview.postMessage({ command: "runResponse", data: final || { error: "Timeout" } });
	} catch (err) {
		logger.debug(`[run-remote] Error: ${err.message}`);
		panel?.webview.postMessage({ command: "runError", error: String(err) });
	}
}

export async function submitSolution(panel, context, { slug, id, langSlug }) {
	try {
		logger.debug(`[submit-code] Starting with slug=${slug}, lang=${langSlug}`);
		const { cookieStr, csrftoken } = getCookieContext(context);

		const questionId = id;
		if (!questionId) throw new Error("Could not get question ID");

		logger.debug(`[submit-code] Question ID: ${questionId}`);

		const filename = `${slug}.${slugToExtMap[langSlug]}`;

		const typed_code = await loadTypedCode(context, filename);

		const langToUse = langSlug === "cpp" ? "cpp" : langSlug === "javascript" ? "javascript" : langSlug;
		const payload = { lang: langToUse, question_id: questionId, typed_code };

		const url = `https://leetcode.com/problems/${slug}/submit/`;
		logger.debug(`[submit-code] POST ${url}`);
		logger.debug(`[submit-code] Payload: ${JSON.stringify(payload, null, 2)}`);

		const {
			obj: postObj,
			text: postText,
			status: postStatus,
		} = await _postJson(url, payload, cookieStr, csrftoken, `https://leetcode.com/problems/${slug}/`);
		logger.debug(`[submit-code] POST status: ${postStatus}`);
		logger.debug(`[submit-code] POST response: ${postText}`);

		const submissionId = postObj?.submission_id;
		if (!submissionId) {
			logger.debug(`[submit-code] No submission_id returned`);
			panel?.webview.postMessage({ command: "submitError", error: "No submission_id returned" });
			return;
		}

		logger.debug(`[submit-code] Submission ID: ${submissionId}`);
		const checkUrl = `https://leetcode.com/submissions/detail/${submissionId}/check/`;
		logger.debug(`[submit-code] Polling check URL: ${checkUrl}`);

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

		logger.debug(`[submit-code] Final result: ${JSON.stringify(final, null, 2)}`);
		panel?.webview.postMessage({ command: "submitResponse", data: final || { error: "Timeout" } });
	} catch (err) {
		logger.debug(`[submit-code] Error: ${err.message}`);
		panel?.webview.postMessage({ command: "submitError", error: String(err) });
	}
}

async function _getQuestionIdSafe(cookieStr, slug) {
	try {
		const raw = await new ProblemDetailsQuery({ cookies: cookieStr }).run(slug);
		const details = ProblemDetails.fromGraphQL(raw);
		return details?.questionId || null;
	} catch (e) {
		logger.error(`[helper] Failed to get question details: ${e.message}`);
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

	logger.info(res.statusText);

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
		logger.debug(`[${prefix}] Attempt ${attempt} status: ${checkRes.status}`);
		logger.debug(`[${prefix}] Attempt ${attempt} response: ${checkText}`);

		if (isFinal(checkObj)) {
			return checkObj;
		}
	}
	return null;
}

const slugToExtMap = {
	cpp: "cpp",
	java: "java",
	python: "py",
	python3: "py",
	javascript: "js",
	typescript: "ts",
	c: "c",
	csharp: "cs",
	golang: "go",
};

import path from "path";
import * as fs from "fs";
import fetch from "node-fetch";
import { ProblemDetailsQuery } from "../leetcode-utils.js";
import ProblemDetails from "../../models/problem-details.js";
import { leetcodeOutputChannel } from "../../output-logger.js";
import { readJsonOrText } from "../utils/http.js";

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
  const solutionsDir = path.join(context.extensionPath, "Solutions");
  const exts = ["cpp", "java", "py", "js", "ts", "c", "cs", "go"];
  const found = exts.map((e) => path.join(solutionsDir, `${slug}.${e}`)).find(fs.existsSync);
  if (!found) return "";
  return fs.readFileSync(found, "utf8");
}

export async function runRemote(panel, context, { slug, langSlug, input }) {
  try {
    leetcodeOutputChannel.appendLine(`[run-remote] Starting with slug=${slug}, lang=${langSlug}`);
    const { cookies, cookieStr, csrftoken } = getCookieContext(context);
    leetcodeOutputChannel.appendLine(`[run-remote] Found ${cookies.length} cookies`);

    let questionId = null;
    try {
      const raw = await new ProblemDetailsQuery({ cookies }).run(slug);
      const details = ProblemDetails.fromGraphQL(raw);
      questionId = details?.questionId || null;
    } catch (e) {
      leetcodeOutputChannel.appendLine(`[run-remote] Failed to get question details: ${e.message}`);
    }

    const typed_code = await loadTypedCode(context, slug).catch(() => "");

    const payload = {
      lang: mapLang(langSlug),
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
      leetcodeOutputChannel.appendLine(`[run-remote] CHECK #${attempt} status=${checkRes.status}`);
      leetcodeOutputChannel.appendLine(`[run-remote] CHECK response: ${checkText}`);

      const state = checkObj?.state || checkObj?.status_msg || "";
      if (/SUCCESS|FINISHED|Accepted|AC/i.test(state)) {
        final = checkObj;
        leetcodeOutputChannel.appendLine(`[run-remote] Final state reached: ${state}`);
        break;
      }
    }

    if (final) {
      leetcodeOutputChannel.appendLine(`[run-remote] Final response JSON: ${JSON.stringify(final, null, 2)}`);
    } else {
      leetcodeOutputChannel.appendLine(`[run-remote] No final response - timeout occurred`);
    }

    panel?.webview.postMessage({ command: "runResponse", data: final || { error: "Timeout" } });
  } catch (err) {
    leetcodeOutputChannel.appendLine(`[run-remote] Error: ${err.message}`);
    panel?.webview.postMessage({ command: "runError", error: String(err) });
  }
}

export async function submitSolution(panel, context, { slug, langSlug }) {
  try {
    leetcodeOutputChannel.appendLine(`[submit-code] Starting with slug=${slug}, lang=${langSlug}`);
    const { cookies, cookieStr, csrftoken } = getCookieContext(context);
    leetcodeOutputChannel.appendLine(`[submit-code] Found ${cookies.length} cookies`);

    const rawDetails = await new ProblemDetailsQuery({ cookies }).run(slug);
    const details = ProblemDetails.fromGraphQL(rawDetails);
    const questionId = details?.questionId;
    if (!questionId) throw new Error("Could not get question ID");

    leetcodeOutputChannel.appendLine(`[submit-code] Question ID: ${questionId}`);

    const typed_code = await loadTypedCode(context, slug);
    if (!typed_code) throw new Error("No solution file found");

    const langToUse = langSlug === "cpp" ? "cpp" : langSlug === "javascript" ? "javascript" : langSlug;
    const payload = { lang: langToUse, question_id: questionId, typed_code };

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
      leetcodeOutputChannel.appendLine(`[submit-code] Attempt ${attempt} status: ${checkRes.status}`);
      leetcodeOutputChannel.appendLine(`[submit-code] Attempt ${attempt} response: ${checkText}`);

      if (checkObj?.state === "SUCCESS" || checkObj?.state === "FAILURE" || checkObj?.state === "ERROR") {
        final = checkObj;
        break;
      }
    }

    leetcodeOutputChannel.appendLine(`[submit-code] Final result: ${JSON.stringify(final, null, 2)}`);
    panel?.webview.postMessage({ command: "submitResponse", data: final || { error: "Timeout" } });
  } catch (err) {
    leetcodeOutputChannel.appendLine(`[submit-code] Error: ${err.message}`);
    panel?.webview.postMessage({ command: "submitError", error: String(err) });
  }
}

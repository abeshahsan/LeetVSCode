import * as vscode from "vscode";
import ProblemDetails from "../../models/problem-details.js";
import { ProblemDetailsQuery } from "./leetcode-queries.js";

export async function getProblemDetailsJson(context, slug) {
	const cookies = context.globalState.get("leetcode_cookies");
	const res = await new ProblemDetailsQuery({ cookies }).run(slug);
	return ProblemDetails.fromGraphQL(res).toJSON();
}

export async function openProblemFromSlug(context, slug, panel) {
	try {
		const details = await getProblemDetailsJson(context, slug);
		panel?.reveal(vscode.ViewColumn.One);
		panel?.webview.postMessage({ command: "problemDetails", data: details });
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to fetch problem: ${err.message || err}`);
		throw err;
	}
}

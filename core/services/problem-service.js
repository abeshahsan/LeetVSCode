import * as vscode from "vscode";
import ProblemDetails from "../../models/problem-details.js";
import { ProblemDetailsQuery } from "./leetcode-queries.js";
import { getDefaultLanguage, getCookies } from "../utils/storage-manager.js";

export async function getProblemDetailsJson(context, slug) {
	const cookies = getCookies(context);
	const res = await new ProblemDetailsQuery({ cookies }).run(slug);
	return ProblemDetails.fromGraphQL(res).toJSON();
}

export async function openProblemFromSlug(context, slug, panel) {
	try {
		const details = await getProblemDetailsJson(context, slug);
		const defaultLanguage = getDefaultLanguage(context);
		panel?.webview.postMessage({ command: "problemDetails", data: details, defaultLanguage });
		panel?.reveal(vscode.ViewColumn.One);
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to fetch problem: ${err.message || err}`);
		throw err;
	}
}

import * as vscode from "vscode";
import { closeWebview } from "./webview-manager.js";
import { runLoginProcess } from "./login-manager.js";
import logger from "./logger.js";
import { getCookies, setCookies, setCsrfToken } from "./utils/storage-manager.js";

export async function refreshSidebar(context, provider) {
	const stored_cookies = getCookies(context);
	let loggedIn = false;

	if (stored_cookies) {
		logger.info("Sotered cookies found. Validating...");
		const isValid = await validateCookie(stored_cookies);
		logger.info(`Stored Cookie validation result: ${isValid}`);
		if (!isValid) {
			await setCookies(context, null);
			await setCsrfToken(context, null);
		} else {
			loggedIn = true;
		}
	}

	if (loggedIn) {
		logger.info("User is logged in. Refreshing sidebar...");
		await provider.cleanup();
	} else {
		provider._problems = [];
		provider.refresh();
	}
}

export async function signIn(context, provider) {
	await runLoginProcess(undefined, context, provider);
}

export async function signOut(context, provider) {
	await setCookies(context, null);
	await setCsrfToken(context, null);
	vscode.window.showInformationMessage("Logged out successfully.");
	closeWebview();
	await refreshSidebar(context, provider);
}

export async function validateCookie(cookies) {
	try {
		const res = await fetch("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: cookies,
			},
			body: JSON.stringify({
				query: `query { userStatus { isSignedIn } }`,
			}),
		});

		if (!res.ok) return false;

		const data = await res.json();
		return data?.data?.userStatus?.isSignedIn === true;
	} catch (e) {
		return false;
	}
}

import * as vscode from "vscode";
import { notifySession, closeWebview } from "./webview-manager.js";
import { runLoginProcess } from "./login-manager.js";
import logger from "./logger.js";

export async function refreshAuthUI(context, provider) {
	const cookies = context.globalState.get("leetcode_cookies");
	let loggedIn = false;

	if (cookies) {
		// Validate cookie by checking user status
		const isValid = await validateCookie(cookies);
		console.log("Cookie valid:", isValid);
		if (!isValid) {
			await context.globalState.update("leetcode_cookies", null);
			await context.globalState.update("leetcode_user", null);
		} else {
			loggedIn = true;
		}
	}

	if (loggedIn) {
		logger.info("User is logged in. Notifying webview and refreshing problems.");
		notifySession(true);
		// Force refresh problems after login
		await provider.forceRefresh();
	} else {
		notifySession(false);
		provider._problems = [];
		provider.refresh();
	}
}

export async function signIn(context, provider) {
	await runLoginProcess(undefined, context, provider);
}

export async function signOut(context, provider) {
	await context.globalState.update("leetcode_cookies", null);
	await context.globalState.update("leetcode_user", null);
	vscode.window.showInformationMessage("Logged out successfully.");
	closeWebview();
	await refreshAuthUI(context, provider);
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

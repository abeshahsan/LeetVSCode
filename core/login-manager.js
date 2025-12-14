import path from "path";
import * as vscode from "vscode";
import { chromium } from "playwright";
import { leetcodeOutputChannel, logError } from "../output-logger.js";
import logger from "./logger.js";
import { setCookies, setCsrfToken } from "./utils/storage-manager.js";

export async function runLoginProcess(panel, context, provider) {
	try {
		const result = await runPlaywrightLogin(context);
		// Persist cookie header string and csrf token separately
		await setCookies(context, result.cookie);
		await setCsrfToken(context, result.csrftoken || "");
		
		// Refresh UI after successful login
		if (provider) {
			try {
				await vscode.commands.executeCommand("vs-leet.refreshStatus");
			} catch (e) {
				leetcodeOutputChannel.appendLine(`Error refreshing auth UI: ${e.message}`);
			}
		}
	} catch (err) {
		panel?.webview.postMessage({
			command: "loginResult",
			success: false,
			error: String(err),
		});
	}
}

export async function runPlaywrightLogin(context) {
	const userDataDir = path.join(context.globalStorageUri.fsPath, "chrome-profile");

	logger.info("userDataDir: " + userDataDir);

	let browserContext;
	let page;

	try {
		browserContext = await chromium.launchPersistentContext(userDataDir, {
			headless: false,
			args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
		});

		await browserContext.clearCookies();

		logger.info("Cleared old cookies. Starting login flow...");
		logger.debug("Navigating to LeetCode login page...");

		page = await browserContext.newPage();
		await page.goto("https://leetcode.com/accounts/login/", { waitUntil: "domcontentloaded" });

		const login = await waitForLogin(browserContext);
		logger.debug("Cookies: " + JSON.stringify(!!login));

		if (!login) {
			throw new Error("Login not detected (timeout). Please keep the browser open and complete the login.");
		}

		// Fetch user info using cookie header string
		const cookieHeader = login.cookie;
		const csrftoken = login.csrftoken;
		let user = await fetchLoggedInUser(cookieHeader);

		if (!user || !user.username) {
			logger.error("Failed to fetch logged-in user info.");
			user = undefined;
		} else {
			logger.info(`User info: ${JSON.stringify(user)}`);
		}

		vscode.window.showInformationMessage(user ? `✅ Logged in as ${user.username}` : `✅ Logged in`);

		return { user, cookie: cookieHeader, csrftoken };
	} finally {
		await closeResources(page, browserContext);
	}
}

async function waitForLogin(browserContext, { timeoutMs = 180000 } = {}) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const leetCodeCookie = await browserContext.cookies("https://leetcode.com");
		const hasLeetCodeSession = leetCodeCookie.some((c) => c.name === "LEETCODE_SESSION" && c.value);

		// Only return if we have a valid session cookie
		if (hasLeetCodeSession) {
			const cookieHeader = leetCodeCookie.map((c) => `${c.name}=${c.value}`).join("; ");
			const csrftoken = leetCodeCookie.find((c) => c.name === "csrftoken")?.value;
			return {cookie: cookieHeader, csrftoken  };
		}
	}
	return null;
}

async function fetchLoggedInUser(cookieHeader) {
	const query = `
		query globalData {
		  userStatus {
			username
			realName
			avatar
			isPremium
		  }
		}
	  `;

	const response = await fetch("https://leetcode.com/graphql", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: cookieHeader,
		},
		body: JSON.stringify({ query }),
	});
	const data = await response.json();

	logger.debug(data);

	return data.data.userStatus;
}

async function closeResources(page, browserContext) {
	try {
		await page?.close();
	} catch (e) {
		// ignore close errors
	}
	try {
		await browserContext?.close();
	} catch (e) {
		// ignore close errors
	}
}

import path from "path";
import * as vscode from "vscode";
import { chromium } from "playwright";

export async function runLoginProcess(panel, context) {
	try {
		const result = await runPlaywrightLogin(context);
		context.globalState.update("leetcode_cookies", result.cookies);
		context.globalState.update("leetcode_user", result.user);
		panel?.webview.postMessage({
			command: "session",
			cookiesExist: !!result.cookies,
		});
		// Notify the extension to refresh UI (status bar) after login
		try {
			await vscode.commands.executeCommand("leet.refreshStatus");
		} catch (e) {
			// ignore if command not registered
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

	let browserContext;
	let page;
	let user = null;

	try {
		browserContext = await chromium.launchPersistentContext(userDataDir, {
			headless: false,
			args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
		});

		page = await browserContext.newPage();
		await page.goto("https://leetcode.com/accounts/login/", { waitUntil: "domcontentloaded" });

		let loginDetected = false;
		page.on("response", async (response) => {
			try {
				const url = response.url();
				if (url.includes("/graphql/") && response.status() === 200) {
					const json = await response.json().catch(() => null);
					if (json?.data?.currentUser?.username) {
						user = json.data.currentUser;
						loginDetected = true;
					}
				}
			} catch (err) {
				console.error(err);
			}
		});

		const cookies = await waitForLogin(browserContext, page);
		const sessionCookie = cookies?.find((c) => c.name === "LEETCODE_SESSION" && c.value);
		if (!loginDetected && !sessionCookie) {
			throw new Error("Login not detected (timeout). Please keep the browser open and complete the login.");
		}

		const finalCookies = cookies || (await browserContext.cookies());
		vscode.window.showInformationMessage(`✅ Logged in`);

		return { user, cookies: finalCookies };
	} finally {
		await closeResources(page, browserContext);
	}
}

async function waitForLogin(ctx, page, { timeoutMs = 180000, pollMs = 1000 } = {}) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const all = await ctx.cookies();
		const sess = all.find((c) => c.name === "LEETCODE_SESSION" && c.value);
		const csrf = all.find((c) => c.name === "csrftoken" && c.value);
		const url = page.url();
		if (sess || csrf || !url.includes("/accounts/login")) {
			return all;
		}
		await new Promise((r) => setTimeout(r, pollMs));
	}
	return null;
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

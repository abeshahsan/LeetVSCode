import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
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

	const browserContext = await chromium.launchPersistentContext(userDataDir, {
		headless: false,
		args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
	});

	const page = await browserContext.newPage();
	await page.goto("https://leetcode.com/accounts/login/", { waitUntil: "domcontentloaded" });

	vscode.window.showInformationMessage("🟡 Please complete login manually...");

	let loginDetected = false;
	let user = null;

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
		} catch {
			// ignore parsing errors
		}
	});

	// Get cookies after waiting
	const cookies = await browserContext.cookies();
	// Check for LEETCODE_SESSION cookie
	const sessionCookie = cookies.find((c) => c.name === "LEETCODE_SESSION" && c.value);

	if (!loginDetected && !sessionCookie) {
		vscode.window.showErrorMessage("❌ Login not detected (timeout).");
		await browserContext.close();
		return;
	}

	// If session cookie exists but user is not detected, set user to minimal info
	if (!user && sessionCookie) {
		user = { username: "(session detected)" };
	}

	// Store in globalState
	await context.globalState.update("leetcode_cookies", cookies);
	await context.globalState.update("leetcode_user", user);

	// Write to file for debugging
	const debugFile = path.join(context.globalStorageUri.fsPath, "leetcode_cookies.json");
	fs.writeFileSync(debugFile, JSON.stringify(cookies, null, 2));

	// Log info to Output panel
	const output = vscode.window.createOutputChannel("LeetCode");
	output.appendLine(`✅ Login successful as ${user?.username || "unknown"}`);
	output.appendLine("Cookies:");
	cookies.forEach((c) => output.appendLine(` - ${c.name} = ${c.value}`));
	output.show(true);

	// ✅ Inform user and close
	vscode.window.showInformationMessage(`✅ Logged in as ${user?.username || "unknown"}`);
	await page.close();
	await browserContext.close();

	return { user, cookies };
}

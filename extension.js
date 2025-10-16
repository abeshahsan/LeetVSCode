import { createOrShowWebview, notifySession } from "./manager/webview-manager.js";
import * as vscode from "vscode";

export function activate(context) {
	createOrShowWebview(context);

	// Create a status bar item for logout (hidden when not logged in)
	const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusItem.command = "leet.logout";
	context.subscriptions.push(statusItem);

	// Helper to refresh status bar based on global state
	async function refreshStatus() {
		const cookies = context.globalState.get("leetcode_cookies");
		if (cookies && cookies.length) {
			statusItem.text = "$(sign-out) Leet: Logout";
			statusItem.tooltip = "Logout from LeetCode";
			statusItem.show();
			notifySession(true);
		} else {
			statusItem.hide();
			notifySession(false);
		}
	}

	// Expose a command other parts of the extension can call to refresh the status
	const refreshCommand = vscode.commands.registerCommand("leet.refreshStatus", async () => {
		await refreshStatus();
	});
	context.subscriptions.push(refreshCommand);

	// Register logout command
	const logoutCommand = vscode.commands.registerCommand("leet.logout", async (passedContext) => {
		// Allow being called with either the extension context or nothing
		const ctx = passedContext || context;
		await ctx.globalState.update("leetcode_cookies", null);
		await ctx.globalState.update("leetcode_user", null);
		vscode.window.showInformationMessage("Logged out successfully.");
		refreshStatus();
	});
	context.subscriptions.push(logoutCommand);

	// Refresh status on activation
	refreshStatus();
}

export function deactivate() {}

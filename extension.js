import { createOrShowWebview, notifySession, openProblemFromExtension } from "./manager/webview-manager.js";
import * as vscode from "vscode";
import { getAllProblems } from "./manager/leetcode-utils.js";

class LeetViewProvider {
	constructor(context) {
		this.context = context;
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this._problems = [];
		this._loading = false;
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element) {
		return element;
	}

	// VS Code will call this for each collapsible element to get its children
	async getChildren(element) {
		const cookies = this.context.globalState.get("leetcode_cookies");
		const loggedIn = Array.isArray(cookies) && cookies.length > 0;

		if (!element) {
			// Top level items handled in getChildren()
			const top = [];
			if (!loggedIn) {
				const signin = new vscode.TreeItem("Sign In", vscode.TreeItemCollapsibleState.None);
				signin.command = { command: "leet.signIn", title: "Sign In" };
				signin.iconPath = new vscode.ThemeIcon("account");
				signin.description = "Login with browser";
				top.push(signin);
				return top;
			}

			const problemsRoot = new vscode.TreeItem("Problems", vscode.TreeItemCollapsibleState.Expanded);
			problemsRoot.iconPath = new vscode.ThemeIcon("list-selection");
			return [problemsRoot];
		}

		// Children for Problems root
		if (element.label === "Problems") {
			// Lazy-load problems list
			if (!this._problems.length && !this._loading) {
				this._loading = true;
				try {
					const data = await getAllProblems();
					this._problems = data?.problemsetQuestionList?.questions || [];
				} catch (e) {
					vscode.window.showErrorMessage(`Failed to load problems: ${e?.message || e}`);
				} finally {
					this._loading = false;
				}
			}

			if (!this._problems.length) {
				const loading = new vscode.TreeItem("Loading problems...", vscode.TreeItemCollapsibleState.None);
				loading.iconPath = new vscode.ThemeIcon("sync~spin");
				return [loading];
			}

			// Build list items (limit to first 100 to keep sidebar snappy)
			const list = this._problems.slice(0, 100).map((q) => {
				const label = `${q.frontendQuestionId}. ${q.title}`;
				const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
				item.tooltip = `${q.difficulty} • ${q.titleSlug}`;
				item.iconPath = new vscode.ThemeIcon(
					q.difficulty === "Hard" ? "flame" : q.difficulty === "Medium" ? "beaker" : "circle-outline"
				);
				item.command = {
					command: "leet.openProblem",
					title: "Open Problem",
					arguments: [q.titleSlug],
				};
				return item;
			});
			return list;
		}

		return [];
	}
}

export function activate(context) {
	// Ensure we have a command to open the main webview
	const openCmd = vscode.commands.registerCommand("webview.openWebview", () => {
		createOrShowWebview(context);
	});
	context.subscriptions.push(openCmd);

	const signInCmd = vscode.commands.registerCommand("leet.signIn", async () => {
		try {
			const { runLoginProcess } = await import("./manager/login-manager.js");
			// Use the existing panel if available, or just pass undefined
			await runLoginProcess(undefined, context);
		} catch (e) {
			vscode.window.showErrorMessage(`Login failed: ${e?.message || e}`);
		}
	});
	context.subscriptions.push(signInCmd);

	// Register Activity Bar view provider
	const provider = new LeetViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider("leetView", provider)
	);

	// Command to open a problem from the sidebar by slug
	const openProblemCmd = vscode.commands.registerCommand("leet.openProblem", async (slug) => {
		if (!slug) return;
		await openProblemFromExtension(context, slug);
	});
	context.subscriptions.push(openProblemCmd);

	// Do not auto-open the webview; it will open when a problem is selected or user clicks the command

	// Create a status bar item for logout (hidden when not logged in)
	const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusItem.command = "leet.logout";
	context.subscriptions.push(statusItem);

	// Helper to refresh status bar and sidebar based on global state
	async function refreshStatus() {
		const cookies = context.globalState.get("leetcode_cookies");
		if (cookies && cookies.length) {
			statusItem.text = "$(sign-out) Leet: Logout";
			statusItem.tooltip = "Logout from LeetCode";
			statusItem.show();
			notifySession(true);
			await vscode.commands.executeCommand('setContext', 'leet.loggedIn', true);
		} else {
			statusItem.hide();
			notifySession(false);
			await vscode.commands.executeCommand('setContext', 'leet.loggedIn', false);
			// Clear cached problems on logout
			provider._problems = [];
		}
		// refresh sidebar view items visibility
		provider.refresh();
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

import { createOrShowWebview, notifySession, openProblemFromExtension } from "./manager/webview-manager.js";
import * as vscode from "vscode";
import { ProblemListQuery } from "./manager/leetcode-utils.js";

class LeetViewProvider {
	constructor(context) {
		this.context = context;
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;

		this._problems = [];
		this._loading = false;
		this._filters = [];
		this._searchTerm = null;
		this._tagFilters = [];
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	async forceRefresh() {
		this._problems = [];
		this._loading = false;
		this.refresh();
	}

	toggleFilter(level) {
		if (this._filters.includes(level)) {
			this._filters = this._filters.filter((f) => f !== level);
		} else {
			this._filters.push(level);
		}
		this.refresh();
	}

	clearFilters() {
		this._filters = [];
		this._searchTerm = null;
		this._tagFilters = [];
		this.refresh();
	}

	setSearch(term) {
		this._searchTerm = term;
		this.refresh();
	}

	toggleTagFilter(tag) {
		if (this._tagFilters.includes(tag)) {
			this._tagFilters = this._tagFilters.filter((t) => t !== tag);
		} else {
			this._tagFilters.push(tag);
		}
		this.refresh();
	}

	getTreeItem(element) {
		return element;
	}

	async getChildren(element) {
		const cookies = this.context.globalState.get("leetcode_cookies");
		const loggedIn = Array.isArray(cookies) && cookies.length > 0;

		// === ROOT LEVEL ===
		if (!element) {
			if (!loggedIn) {
				const signIn = new vscode.TreeItem("Sign in to LeetCode", vscode.TreeItemCollapsibleState.None);
				signIn.command = { command: "leet.signIn", title: "Sign In" };
				signIn.iconPath = new vscode.ThemeIcon("account");
				signIn.description = "Click to authenticate";
				return [signIn];
			}

			const filtersRoot = new vscode.TreeItem("Filters", vscode.TreeItemCollapsibleState.Collapsed);
			filtersRoot.iconPath = new vscode.ThemeIcon("filter");
			// mark filters root so view/title menu items can target it
			filtersRoot.contextValue = "filtersRoot";

			const problemsLabel = this._buildProblemsLabel();
			const problemsRoot = new vscode.TreeItem(problemsLabel, vscode.TreeItemCollapsibleState.Expanded);
			problemsRoot.iconPath = new vscode.ThemeIcon("list-tree");

			return [filtersRoot, problemsRoot];
		}

		// === FILTERS SECTION ===
		if (element.label === "Filters") {
			const items = [];

			// Search
			const searchItem = new vscode.TreeItem(
				this._searchTerm ? `Search: "${this._searchTerm}"` : "Search Problems",
				vscode.TreeItemCollapsibleState.None
			);
			searchItem.command = { command: "leet.search", title: "Search" };
			searchItem.iconPath = new vscode.ThemeIcon("search");
			searchItem.description = this._searchTerm ? "Click to modify" : "";
			items.push(searchItem);

			// Difficulty filters
			const levels = ["Easy", "Medium", "Hard"];
			for (const level of levels) {
				const active = this._filters.includes(level);
				const item = new vscode.TreeItem(level, vscode.TreeItemCollapsibleState.None);
				item.iconPath = new vscode.ThemeIcon(
					active ? "check" : "circle-outline",
					new vscode.ThemeColor(
						level === "Easy" ? "charts.green" : level === "Medium" ? "charts.yellow" : "charts.red"
					)
				);
				item.command = {
					command: `leet.toggle${level}`,
					title: `Toggle ${level}`,
				};
				item.description = active ? "✓" : "";
				items.push(item);
			}

			// Tag filters section
			if (this._tagFilters.length > 0) {
				// Show active tags
				for (const tag of this._tagFilters) {
					const tagItem = new vscode.TreeItem(`#${tag}`, vscode.TreeItemCollapsibleState.None);
					tagItem.iconPath = new vscode.ThemeIcon("tag", new vscode.ThemeColor("charts.blue"));
					tagItem.command = { command: "leet.removeTag", title: "Remove Tag", arguments: [tag] };
					tagItem.description = "✓ Click to remove";
					items.push(tagItem);
				}
			}

			// Add new tag option
			const addTagItem = new vscode.TreeItem("+ Add Tag Filter", vscode.TreeItemCollapsibleState.None);
			addTagItem.iconPath = new vscode.ThemeIcon("add");
			addTagItem.command = { command: "leet.addTag", title: "Add Tag Filter" };
			addTagItem.description = "Select tags";
			items.push(addTagItem);

			return items;
		}

		// === PROBLEMS SECTION ===
		if (element.label && element.label.startsWith("Problems")) {
			if (!this._problems.length && !this._loading) {
				const cookies = this.context.globalState.get("leetcode_cookies");
				this._loading = true;
				try {
					const client = new ProblemListQuery({ cookies });
					const data = await client.run();
					this._problems = data?.problemsetQuestionList?.questions || [];
				} catch (e) {
					vscode.window.showErrorMessage(`Failed to load problems: ${e.message || e}`);
				} finally {
					this._loading = false;
				}
			}

			if (this._loading) {
				const loading = new vscode.TreeItem("Loading problems...", vscode.TreeItemCollapsibleState.None);
				loading.iconPath = new vscode.ThemeIcon("sync~spin");
				return [loading];
			}

			if (!this._problems.length) {
				const empty = new vscode.TreeItem("No problems found.", vscode.TreeItemCollapsibleState.None);
				empty.iconPath = new vscode.ThemeIcon("warning");
				return [empty];
			}

			let filtered = this._applyFilters(this._problems);

			// Cap for performance
			const limited = filtered;

			const items = limited.map((q) => {
				const label = `${q.frontendId}. ${q.title}`;
				const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);

				const tags = q.topicTags
					?.slice(0, 3)
					.map((t) => t.name)
					.join(", ");
				const tagText = tags ? ` • ${tags}` : "";

				item.tooltip = `${q.difficulty} • ${Math.round(q.acRate)}%${tagText}`;

				item.iconPath = new vscode.ThemeIcon(
					"circle-filled",
					new vscode.ThemeColor(
						q.difficulty === "Easy"
							? "charts.green"
							: q.difficulty === "Medium"
							? "charts.yellow"
							: "charts.red"
					)
				);

				// Compute a safe, short status label for the tree description
				item.description = `   ${
					q?.status === "ac" ? "✅ Solved" : q?.status === "notac" ? "⚠️ Attempted" : ""
				}`;
				item.command = {
					command: "leet.openProblem",
					title: "Open Problem",
					arguments: [q.titleSlug],
				};

				return item;
			});

			return items;
		}
	}

	_applyFilters(problems) {
		let result = [...problems];

		// Apply difficulty filters (OR logic - if any difficulty is selected)
		if (this._filters.length > 0) {
			result = result.filter((q) => this._filters.includes(q.difficulty));
		}

		// Apply search filter
		if (this._searchTerm) {
			const s = this._searchTerm.toLowerCase();
			result = result.filter((q) => {
				const id = q.frontendQuestionId?.toString() ?? "";
				const title = q.title?.toLowerCase() ?? "";
				const slug = q.titleSlug?.toLowerCase() ?? "";
				return id.includes(s) || title.includes(s) || slug.includes(s);
			});
		}

		// Apply tag filters (AND logic - problem must have ALL selected tags)
		if (this._tagFilters.length > 0) {
			result = result.filter((q) => {
				if (!q.topicTags) return false;
				const problemTags = q.topicTags.map((t) => t.name.toLowerCase());
				return this._tagFilters.every((tag) => problemTags.includes(tag.toLowerCase()));
			});
		}

		return result;
	}

	_buildProblemsLabel() {
		const parts = [];
		if (this._filters.length > 0) parts.push(this._filters.join("+"));
		if (this._searchTerm) parts.push(`"${this._searchTerm}"`);
		if (this._tagFilters.length > 0) parts.push(this._tagFilters.map((t) => `#${t}`).join("+"));
		return parts.length ? `Problems (${parts.join(" | ")})` : "Problems";
	}
}

// ==========================
// Activation Function
// ==========================
export function activate(context) {
	const provider = new LeetViewProvider(context);
	context.subscriptions.push(vscode.window.registerTreeDataProvider("leetView", provider));

	// Core commands
	context.subscriptions.push(
		vscode.commands.registerCommand("leet.openProblem", async (slug) => {
			if (slug) await openProblemFromExtension(context, slug);
		}),
		vscode.commands.registerCommand("leet.refresh", async () => {
			vscode.window.showInformationMessage("🔄 Refreshing problems...");
			await provider.forceRefresh();
			// vscode.window.showInformationMessage("✅ Problems refreshed");
		}),
		vscode.commands.registerCommand("leet.clearFilter", () => {
			provider.clearFilters();
			vscode.window.showInformationMessage("🧹 Filters cleared");
		}),
		vscode.commands.registerCommand("leet.search", async () => {
			const term = await vscode.window.showInputBox({
				prompt: "Search problems by ID or title",
				placeHolder: "e.g. 1, Two Sum",
				value: provider._searchTerm || "",
			});
			if (term !== undefined) {
				provider.setSearch(term.trim() || null);
			}
		}),
		vscode.commands.registerCommand("leet.toggleEasy", () => {
			provider.toggleFilter("Easy");
		}),
		vscode.commands.registerCommand("leet.toggleMedium", () => {
			provider.toggleFilter("Medium");
		}),
		vscode.commands.registerCommand("leet.toggleHard", () => {
			provider.toggleFilter("Hard");
		}),
		vscode.commands.registerCommand("leet.addTag", async () => {
			const allTags = new Set();
			provider._problems.forEach((p) => p.topicTags?.forEach((t) => allTags.add(t.name)));

			const allTagsList = Array.from(allTags).sort();

			if (!allTagsList.length) {
				vscode.window.showWarningMessage("No tags available or all problems need to be loaded first.");
				return;
			}

			// Create persistent tag selection loop
			while (true) {
				// Add "Done" option at the top
				const tagItems = [
					{
						label: "✅ Done",
						description: "Finish selecting tags",
						tag: null,
					},
					...allTagsList.map((tag) => {
						const isSelected = provider._tagFilters.includes(tag);
						return {
							label: `${isSelected ? "☑️" : "☐"} ${tag}`,
							description: isSelected ? "Selected" : "",
							tag: tag,
						};
					}),
				];

				const selected = await vscode.window.showQuickPick(tagItems, {
					placeHolder: `Select tags to toggle (${provider._tagFilters.length} selected) | Click "Done" to finish`,
				});

				// If user cancels or clicks Done, exit the loop
				if (!selected || selected.tag === null) {
					break;
				}

				// Toggle the selected tag
				provider.toggleTagFilter(selected.tag);
				// Refresh the tree view immediately to show changes
				provider.refresh();
			}
		}),
		vscode.commands.registerCommand("leet.removeTag", (tag) => {
			provider.toggleTagFilter(tag);
		})
	);

	// Login and logout commands
	context.subscriptions.push(
		vscode.commands.registerCommand("leet.signIn", async () => {
			try {
				const { runLoginProcess } = await import("./manager/login-manager.js");
				await runLoginProcess(undefined, context);
			} catch (e) {
				vscode.window.showErrorMessage(`Login failed: ${e.message}`);
			}
		}),
		vscode.commands.registerCommand("leet.logout", async () => {
			await context.globalState.update("leetcode_cookies", null);
			await context.globalState.update("leetcode_user", null);
			vscode.window.showInformationMessage("Logged out successfully.");
			await refreshStatus();
		})
	);

	// Status bar
	const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	status.command = "leet.logout";
	context.subscriptions.push(status);

	async function refreshStatus() {
		const cookies = context.globalState.get("leetcode_cookies");
		if (cookies?.length) {
			status.text = "$(sign-out) Logout";
			status.tooltip = "Logout from LeetCode";
			status.show();
			notifySession(true);
		} else {
			status.hide();
			notifySession(false);
			provider._problems = [];
		}
		provider.refresh();
	}

	context.subscriptions.push(vscode.commands.registerCommand("leet.refreshStatus", refreshStatus));
	refreshStatus();
}

export function deactivate() {}

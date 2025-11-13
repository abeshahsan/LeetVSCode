import * as vscode from "vscode";
import { ProblemListQuery } from "./services/leetcode-queries.js";
import { logDebug } from "../output-logger.js";

export class LeetViewProvider {
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

		if (!element) return this._getRootItems(loggedIn);
		if (element.label === "Filters") return this._getFilterItems();
		if (element.label && element.label.startsWith("Problems")) return this._getProblemItems(cookies);

		return [];
	}

	_getRootItems(loggedIn) {
		const items = [];
		if (loggedIn) {
			items.push(this._createFiltersRoot(), this._createProblemsRoot());
		} else {
			items.push(this._createWelcomeItem());
		}
		return items;
	}

	_createFiltersRoot() {
		const filtersRoot = new vscode.TreeItem("Filters", vscode.TreeItemCollapsibleState.Collapsed);
		filtersRoot.iconPath = new vscode.ThemeIcon("filter");
		filtersRoot.contextValue = "filtersRoot";
		return filtersRoot;
	}

	_createProblemsRoot() {
		const problemsLabel = this._buildProblemsLabel();
		const problemsRoot = new vscode.TreeItem(problemsLabel, vscode.TreeItemCollapsibleState.Expanded);
		problemsRoot.iconPath = new vscode.ThemeIcon("list-tree");
		return problemsRoot;
	}

	_createWelcomeItem() {
		const welcome = new vscode.TreeItem(
			"Please sign in using the button above",
			vscode.TreeItemCollapsibleState.None
		);
		welcome.iconPath = new vscode.ThemeIcon("info");
		welcome.description = "";
		return welcome;
	}

	_getFilterItems() {
		const items = [];
		items.push(this._buildSearchItem());
		items.push(...this._buildDifficultyItems());

		if (this._tagFilters.length > 0) items.push(...this._buildTagFilterItems());
		items.push(this._buildAddTagItem());

		return items;
	}

	_buildSearchItem() {
		const searchItem = new vscode.TreeItem(
			this._searchTerm ? `Search: "${this._searchTerm}"` : "Search Problems",
			vscode.TreeItemCollapsibleState.None
		);
		searchItem.command = { command: "leet.search", title: "Search" };
		searchItem.iconPath = new vscode.ThemeIcon("search");
		searchItem.description = this._searchTerm ? "Click to modify" : "";
		return searchItem;
	}

	_buildDifficultyItems() {
		const items = [];
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
			item.command = { command: `leet.toggle${level}`, title: `Toggle ${level}` };
			item.description = active ? "✓" : "";
			items.push(item);
		}
		return items;
	}

	_buildTagFilterItems() {
		const items = [];
		for (const tag of this._tagFilters) {
			const tagItem = new vscode.TreeItem(`#${tag}`, vscode.TreeItemCollapsibleState.None);
			tagItem.iconPath = new vscode.ThemeIcon("tag", new vscode.ThemeColor("charts.blue"));
			tagItem.command = { command: "leet.removeTag", title: "Remove Tag", arguments: [tag] };
			tagItem.description = "✓ Click to remove";
			items.push(tagItem);
		}
		return items;
	}

	_buildAddTagItem() {
		const addTagItem = new vscode.TreeItem("+ Add Tag Filter", vscode.TreeItemCollapsibleState.None);
		addTagItem.iconPath = new vscode.ThemeIcon("add");
		addTagItem.command = { command: "leet.addTag", title: "Add Tag Filter" };
		addTagItem.description = "Select tags";
		return addTagItem;
	}

	async _getProblemItems(cookies) {
		if (!this._problems.length && !this._loading) {
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

		const filtered = this._applyFilters(this._problems);
		return filtered.map((q) => this._createProblemItem(q));
	}

	_createProblemItem(q) {
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
				q.difficulty === "Easy" ? "charts.green" : q.difficulty === "Medium" ? "charts.yellow" : "charts.red"
			)
		);

		item.description = `   ${q?.status === "ac" ? "✅ Solved" : q?.status === "notac" ? "⚠️ Attempted" : ""}`;
		item.command = { command: "leet.openProblem", title: "Open Problem", arguments: [q.titleSlug] };
		return item;
	}

	_applyFilters(problems) {
		let result = [...problems];

		// Difficulty
		if (this._filters.length > 0) {
			result = result.filter((q) => this._filters.includes(q.difficulty));
		}

		// Search
		if (this._searchTerm) {
			const s = this._searchTerm.toLowerCase();
			result = result.filter((q) => {
				const id = q.frontendId?.toString() ?? "";
				const title = q.title?.toLowerCase() ?? "";
				const slug = q.titleSlug?.toLowerCase() ?? "";
				const concat = `${id} ${title} ${slug}`;
				// leetcodeOutputChannel.appendLine(`[LeetViewProvider] Searching for "${s}" in "${concat}"`);
				return concat.includes(s);
			});
		}

		// Tags (AND)
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

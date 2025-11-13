import * as vscode from "vscode";
import { openProblemFromExtension } from "./webview-manager.js";
import { refreshAuthUI, signIn, signOut } from "./auth-context.js";

export function registerCommands(context, provider) {
	// Problem open + refresh + filters
	context.subscriptions.push(
		vscode.commands.registerCommand("leet.openProblem", async (slug) => {
			if (slug) await openProblemFromExtension(context, slug);
		}),
		vscode.commands.registerCommand("leet.refresh", async () => {
			vscode.window.showInformationMessage("🔄 Refreshing problems...");
			await provider.forceRefresh();
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
			if (term !== undefined) provider.setSearch(term.trim() || null);
		}),
		vscode.commands.registerCommand("leet.toggleEasy", () => provider.toggleFilter("Easy")),
		vscode.commands.registerCommand("leet.toggleMedium", () => provider.toggleFilter("Medium")),
		vscode.commands.registerCommand("leet.toggleHard", () => provider.toggleFilter("Hard")),
		vscode.commands.registerCommand("leet.addTag", async () => addTagLoop(provider)),
		vscode.commands.registerCommand("leet.removeTag", (tag) => provider.toggleTagFilter(tag))
	);

	// Auth
	context.subscriptions.push(
		vscode.commands.registerCommand("leet.signIn", async () => {
			try {
				await signIn(context);
			} catch (e) {
				vscode.window.showErrorMessage(`Login failed: ${e.message}`);
			}
		}),
		vscode.commands.registerCommand("leet.signOut", async () => {
			await signOut(context, provider);
		}),
		vscode.commands.registerCommand("leet.refreshStatus", async () => {
			await refreshAuthUI(context, provider);
		})
	);
}

async function addTagLoop(provider) {
	const allTags = new Set();
	provider._problems.forEach((p) => p.topicTags?.forEach((t) => allTags.add(t.name)));
	const allTagsList = Array.from(allTags).sort();
	if (!allTagsList.length) {
		vscode.window.showWarningMessage("No tags available or all problems need to be loaded first.");
		return;
	}

	while (true) {
		const tagItems = [
			{ label: "✅ Done", description: "Finish selecting tags", tag: null },
			...allTagsList.map((tag) => ({
				label: `${provider._tagFilters.includes(tag) ? "☑️" : "☐"} ${tag}`,
				description: provider._tagFilters.includes(tag) ? "Selected" : "",
				tag,
			})),
		];

		const selected = await vscode.window.showQuickPick(tagItems, {
			placeHolder: `Select tags to toggle (${provider._tagFilters.length} selected) | Click "Done" to finish`,
		});

		if (!selected || selected.tag === null) break;
		provider.toggleTagFilter(selected.tag);
		provider.refresh();
	}
}

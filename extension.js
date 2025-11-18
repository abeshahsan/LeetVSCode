import * as vscode from "vscode";
import { LeetViewProvider } from "./core/leet-view-provider.js";
import { registerCommands } from "./core/commands.js";
import { refreshAuthUI } from "./core/auth-context.js";
import { setProvider } from "./core/webview-manager.js";

export async function activate(context) {
	try {
		const provider = new LeetViewProvider(context);
		context.subscriptions.push(vscode.window.registerTreeDataProvider("vs-leet.problemsView", provider));

		// Store provider reference for webview login
		setProvider(provider);

		registerCommands(context, provider);

		await refreshAuthUI(context, provider);
	} catch (error) {
		// logError(`Activation failed: ${error.message}`);
		vscode.window.showErrorMessage(`Failed to activate VS-Leet: ${error.message}`);
		throw error;
	}
}

export function deactivate() {
	// leetcodeOutputChannel.dispose();
}

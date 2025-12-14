import * as vscode from "vscode";
import { LeetViewProvider } from "./core/leet-view-provider.js";
import { registerCommands } from "./core/commands.js";
import { refreshSidebar } from "./core/auth-context.js";
import { setProvider, setPanel, _attachWebviewHandlers } from "./core/webview-manager.js";
import { initializeSolutionDirectory } from "./core/utils/directory-manager.js";
import { WebviewSerializer } from "./core/webview-serializer.js";

export async function activate(context) {
	try {
		// Initialize solution directory with weekly re-prompts
		await initializeSolutionDirectory(context);

		const provider = new LeetViewProvider(context);
		context.subscriptions.push(vscode.window.registerTreeDataProvider("vs-leet.problemsView", provider));

		// Store provider reference for webview login
		setProvider(provider);

		// Register webview serializer for state restoration
		const serializer = new WebviewSerializer(context, _attachWebviewHandlers, setPanel);
		context.subscriptions.push(
			vscode.window.registerWebviewPanelSerializer("vs-leet-webview", serializer)
		);

		registerCommands(context, provider);

		refreshSidebar(context, provider);
	} catch (error) {
		// logError(`Activation failed: ${error.message}`);
		vscode.window.showErrorMessage(`Failed to activate VS-Leet: ${error.message}`);
	}
}

export function deactivate() {}

import * as vscode from "vscode";
import { LeetViewProvider } from "./core/leet-view-provider.js";
import { registerCommands } from "./core/commands.js";
import { refreshSidebar } from "./core/auth-context.js";
import { setProvider, setPanel, _attachWebviewHandlers } from "./core/webview-manager.js";
import { initializeSolutionDirectory } from "./core/utils/directory-manager.js";
import { WebviewSerializer } from "./core/webview-serializer.js";
import { leetcodeOutputChannel } from "./output-logger.js";


export async function activate(context) {
	try {
		leetcodeOutputChannel.appendLine("Activating VS-Leet extension...");
		// CRITICAL: Register the tree data provider FIRST before any async operations
		// This ensures the sidebar view is available immediately when the extension activates
		const provider = new LeetViewProvider(context);
		context.subscriptions.push(vscode.window.registerTreeDataProvider("vs-leet.problemsView", provider));

		// Store provider reference for webview login
		setProvider(provider);

		// Register webview serializer for state restoration
		const serializer = new WebviewSerializer(context, _attachWebviewHandlers, setPanel);
		context.subscriptions.push(
			vscode.window.registerWebviewPanelSerializer("vs-leet-webview", serializer)
		);

		// Register commands before any async initialization
		registerCommands(context, provider);

		// Refresh sidebar authentication status
		refreshSidebar(context, provider);

		// Initialize solution directory with weekly re-prompts (non-blocking)
		initializeSolutionDirectory(context).catch((error) => {
			vscode.window.showWarningMessage(`Failed to initialize solution directory: ${error.message}`);
		});
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to activate VS-Leet: ${error.message}`);
	}
}

export function deactivate() {}

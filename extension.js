import * as vscode from "vscode";
import { LeetViewProvider } from "./core/leet-view-provider.js";
import { registerCommands } from "./core/commands.js";
import { refreshSidebar } from "./core/auth-context.js";
import { setProvider, setPanel, _attachWebviewHandlers } from "./core/webview-manager.js";
import { initializeSolutionDirectory } from "./core/utils/directory-manager.js";
import { WebviewSerializer } from "./core/webview-serializer.js";
import { leetcodeOutputChannel } from "./output-logger.js";
import { getCookies } from "./core/utils/storage-manager.js";


export async function activate(context) {
	try {
		leetcodeOutputChannel.appendLine("Activating VS-Leet extension...");

		// 1. Initialize Context Keys (Crucial for UI 'when' clauses)
		// Set a default state so buttons don't flicker or stay hidden
		const cookies = getCookies(context);
		vscode.commands.executeCommand('setContext', 'vs-leet.loggedIn', !!cookies);

		// 2. Register Tree Data Provider
		// CRITICAL: Register the tree data provider FIRST before any async operations
		// This ensures the sidebar view is available immediately when the extension activates
		const provider = new LeetViewProvider(context);
		context.subscriptions.push(vscode.window.registerTreeDataProvider("vs-leet.problemsView", provider));

		// 3. Store reference & Register Serializer
		// Store provider reference for webview login
		setProvider(provider);

		// Register webview serializer for state restoration
		const serializer = new WebviewSerializer(context, _attachWebviewHandlers, setPanel);
		context.subscriptions.push(
			vscode.window.registerWebviewPanelSerializer("vs-leet-webview", serializer)
		);

		// 4. Register Commands
		// Register commands before any async initialization
		registerCommands(context, provider);

		// 5. Logic Triggers
		// Refresh sidebar authentication status
		refreshSidebar(context, provider);

		// Initialize solution directory with weekly re-prompts (non-blocking)
		initializeSolutionDirectory(context).catch((error) => {
			leetcodeOutputChannel.appendLine(`Dir Init Error: ${error.message}`);
		});
	} catch (error) {
		leetcodeOutputChannel.appendLine(`Critical Activation Error: ${error.stack}`);
		vscode.window.showErrorMessage(`Failed to activate VS-Leet. Check Output channel.`);
	}
}

export function deactivate() {}

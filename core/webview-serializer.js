import * as vscode from "vscode";
import { getWebviewHtml } from "./services/webview-template.js";
import { openProblemFromSlug } from "./services/problem-service.js";
import { setLastProblemSlug, getLastProblemSlug } from "./utils/storage-manager.js";
import logger from "./logger.js";

/**
 * Webview serializer to restore the last opened problem when VS Code restarts
 */
export class WebviewSerializer {
	constructor(context, attachHandlers, setPanelCallback) {
		this._context = context;
		this._attachHandlers = attachHandlers;
		this._setPanelCallback = setPanelCallback;
	}

	async deserializeWebviewPanel(webviewPanel, state) {
		try {
			logger.info(`Deserializing webview panel with state: ${JSON.stringify(state)}`);

			// Set the global panel reference
			if (this._setPanelCallback) {
				this._setPanelCallback(webviewPanel);
			}

			// Restore webview HTML first
			webviewPanel.webview.html = getWebviewHtml(
				webviewPanel.webview,
				this._context.extensionPath,
				{} // Empty initial state - we'll refetch
			);

			// Attach message handlers
			this._attachHandlers(webviewPanel, this._context);

			// Attach dispose handler to save state
			webviewPanel.onDidDispose(() => {
				if (this._setPanelCallback) {
					this._setPanelCallback(null);
				}
			});

			// Get last problem from centralized storage (prefer state, fallback to storage)
			const lastProblemSlug = state?.lastProblemSlug || getLastProblemSlug(this._context);

			// Refetch and restore last opened problem if available
			if (lastProblemSlug) {
				logger.info(`Refetching last problem: ${lastProblemSlug}`);
				// Wait for webview to be ready before fetching
				setTimeout(async () => {
					try {
						await openProblemFromSlug(this._context, lastProblemSlug, webviewPanel);
						await saveWebviewState(webviewPanel, lastProblemSlug, this._context);
						logger.info(`Successfully restored problem: ${lastProblemSlug}`);
					} catch (err) {
						logger.error(`Failed to restore problem: ${err.message}`);
					}
				}, 800);
			}

			return webviewPanel;
		} catch (err) {
			logger.error(`Failed to deserialize webview: ${err.message}`);
			throw err;
		}
	}
}

/**
 * Save current problem to webview state for serialization
 */
export async function saveWebviewState(panel, problemSlug, context) {
	if (!panel || !problemSlug) return;
	
	try {
		// Store state in a way that VS Code can serialize
		const state = {
			lastProblemSlug: problemSlug,
			timestamp: Date.now(),
		};
		
		// Store on panel for internal use
		panel._vsleetState = state;
		
		// Also save to centralized storage as fallback
		if (context) {
			await setLastProblemSlug(context, problemSlug);
		}
		
		logger.debug(`Saved webview state: ${problemSlug}`);
	} catch (err) {
		logger.error(`Failed to save webview state: ${err.message}`);
	}
}

/**
 * Get webview state for serialization
 * This is called by VS Code during serialization
 */
export function getWebviewState(panel) {
	return panel?._vsleetState || null;
}

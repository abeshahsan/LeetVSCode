import * as vscode from "vscode";

export const leetcodeOutputChannel = vscode.window.createOutputChannel("VS-Leet");

// Helper to log only in debug mode or for errors/important events
export function logDebug(message) {
	// Only log debug info if in development/debug mode
	// In production, this does nothing
	if (process.env.VSCODE_DEBUG_MODE) {
		leetcodeOutputChannel.appendLine(`[DEBUG] ${message}`);
	}
}

export function logInfo(message) {
	// Deprecated: Prefer using specific logger or levels; leaving no-op to avoid noise
}

export function logError(message) {
	// Always log errors
	leetcodeOutputChannel.appendLine(`[ERROR] ${message}`);
}

leetcodeOutputChannel.show(true);

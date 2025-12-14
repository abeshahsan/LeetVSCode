import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import logger from "../logger.js";
import {
	getSolutionDirectory,
	setSolutionDirectory,
	getLastDirectoryPrompt,
	setLastDirectoryPrompt,
	hasStorageKey,
} from "./storage-manager.js";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Checks if we should prompt for directory setup
 * Returns true if:
 * - Directory is not set, OR
 * - More than a week has passed since last prompt
 */
export function shouldPromptForDirectory(context) {
	const savedPath = getSolutionDirectory(context);
	const lastPrompt = getLastDirectoryPrompt(context);

	// First time setup
	if (!savedPath) {
		return true;
	}

	// Check if a week has passed
	if (lastPrompt) {
		const timeSinceLastPrompt = Date.now() - lastPrompt;
		if (timeSinceLastPrompt >= ONE_WEEK_MS) {
			return true;
		}
	}

	return false;
}

/**
 * Get the current solution directory path from storage
 */
export { getSolutionDirectory } from "./storage-manager.js";

/**
 * Save solution directory path and update last prompt timestamp
 */
async function saveSolutionDirectory(context, directoryPath) {
	await setSolutionDirectory(context, directoryPath);
	await setLastDirectoryPrompt(context, Date.now());
	logger.info(`Solution directory saved: ${directoryPath}`);
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(directoryPath) {
	if (!fs.existsSync(directoryPath)) {
		fs.mkdirSync(directoryPath, { recursive: true });
		logger.info(`Created solution directory: ${directoryPath}`);
	}
}

/**
 * Show directory picker dialog
 */
async function showDirectoryPicker() {
	const options = {
		canSelectFiles: false,
		canSelectFolders: true,
		canSelectMany: false,
		openLabel: "Select Solution Directory",
		title: "Choose where to save your LeetCode solutions",
	};

	const result = await vscode.window.showOpenDialog(options);
	if (result && result[0]) {
		return result[0].fsPath;
	}
	return null;
}

/**
 * Get default solution directory (workspace root or first workspace folder)
 */
function getDefaultDirectory() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		return path.join(workspaceFolders[0].uri.fsPath, "Solutions");
	}
	// Fallback to user's home directory
	const homeDir = process.env.HOME || process.env.USERPROFILE;
	return path.join(homeDir, "LeetCode-Solutions");
}

/**
 * Prompt user to set up solution directory
 * Shows notification with current/default location and Change button
 */
export async function promptForDirectorySetup(context, isFirstTime = false) {
	const currentPath = getSolutionDirectory(context);
	const defaultPath = getDefaultDirectory();
	const displayPath = currentPath || defaultPath;

	const message = isFirstTime
		? `📁 VS-Leet: Choose where to save your solutions\n\nCurrent: ${displayPath}`
		: `📁 VS-Leet: Weekly directory check\n\nCurrent: ${displayPath}`;

	const action = await vscode.window.showInformationMessage(
		message,
		{ modal: false },
		"Use Current",
		"Change",
		"Remind Later"
	);

	if (action === "Use Current") {
		const pathToUse = currentPath || defaultPath;
		ensureDirectoryExists(pathToUse);
		await saveSolutionDirectory(context, pathToUse);
		vscode.window.showInformationMessage(`✅ Solutions will be saved to: ${pathToUse}`);
		return pathToUse;
	} else if (action === "Change") {
		const selectedPath = await showDirectoryPicker();
		if (selectedPath) {
			ensureDirectoryExists(selectedPath);
			await saveSolutionDirectory(context, selectedPath);
			vscode.window.showInformationMessage(`✅ Solutions directory set to: ${selectedPath}`);
			return selectedPath;
		}
	} else if (action === "Remind Later") {
		// Don't update last prompt time, so it will ask again on next activation
		logger.info("User chose to be reminded later about directory setup");
		return currentPath || defaultPath;
	}

	// No action taken
	return currentPath || defaultPath;
}

/**
 * Initialize and check solution directory on activation
 * Returns the active solution directory path
 */
export async function initializeSolutionDirectory(context) {
	const isFirstTime = !hasStorageKey(context);

	if (shouldPromptForDirectory(context)) {
		return await promptForDirectorySetup(context, isFirstTime);
	}

	// Already set and not time to re-prompt
	const savedPath = getSolutionDirectory(context);
	ensureDirectoryExists(savedPath);
	return savedPath;
}

/**
 * Manually trigger directory change (for settings or commands)
 */
export async function changeSolutionDirectory(context) {
	return await promptForDirectorySetup(context, false);
}

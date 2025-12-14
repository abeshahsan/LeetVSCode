import * as vscode from "vscode";
import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import os from "os";

/**
 * Check if Chromium is installed by attempting to launch it
 */
export async function isChromiumInstalled() {
	try {
		const browser = await chromium.launch({ headless: true });
		await browser.close();
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Install Chromium using Playwright CLI with progress notification
 */
export async function installChromium() {
	try {
		// Check if already installed
		if (await isChromiumInstalled()) {
			vscode.window.showInformationMessage("✅ Chromium is already installed");
			return true;
		}

		// Get the path to Playwright CLI
		const playwrightCliPath = path.join(
			path.dirname(new URL(import.meta.url).pathname).substring(os.platform() === "win32" ? 1 : 0),
			"..", "..", "node_modules", "playwright", "cli.js"
		);

		return await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "VS-Leet: Installing Chromium Browser",
				cancellable: false,
			},
			async (progress) => {
				progress.report({ 
					message: "Chromium is required for secure LeetCode authentication. Starting download..." 
				});

				return new Promise((resolve, reject) => {
					// Spawn the Playwright install command
					const installProcess = spawn("node", [playwrightCliPath, "install", "chromium"], {
						shell: true,
					});

					let stderrData = "";
					let lastPercent = 0;

					// Capture stdout and show progress
					installProcess.stdout.on("data", (data) => {
						const output = data.toString();
						
						// Extract percentage from output
						const percentMatch = output.match(/(\d+)%/);
						if (percentMatch) {
							const currentPercent = parseInt(percentMatch[1], 10);
							if (currentPercent !== lastPercent) {
								lastPercent = currentPercent;
								progress.report({ 
									message: `${currentPercent}%`,
									increment: 1
								});
							}
						}
					});

					// Capture stderr
					installProcess.stderr.on("data", (data) => {
						stderrData += data.toString();
					});

					// Handle process completion
					installProcess.on("close", async (code) => {
						if (code === 0) {
							progress.report({ message: "Verifying installation..." });
							
							// Verify installation
							const isInstalled = await isChromiumInstalled();
							if (isInstalled) {
								vscode.window.showInformationMessage("✅ Chromium installed successfully!");
								resolve(true);
							} else {
								reject(new Error("Installation completed but Chromium verification failed"));
							}
						} else {
							const errorMsg = `Installation failed with exit code ${code}`;
							
							// Show fallback command
							const fallbackCmd = `node "${playwrightCliPath}" install chromium`;
							vscode.window.showErrorMessage(
								`❌ ${errorMsg}. Run this command manually:`,
								"Copy Command"
							).then(selection => {
								if (selection === "Copy Command") {
									vscode.env.clipboard.writeText(fallbackCmd);
									vscode.window.showInformationMessage("Command copied to clipboard!");
								}
							});
							
							reject(new Error(`${errorMsg}\n${stderrData || "No error details available"}`));
						}
					});

					// Handle process errors
					installProcess.on("error", (error) => {
						const errorMsg = `Failed to start installation: ${error.message}`;
						
						// Show fallback command
						const fallbackCmd = `node "${playwrightCliPath}" install chromium`;
						vscode.window.showErrorMessage(
							`❌ ${errorMsg}. Run this command manually:`,
							"Copy Command"
						).then(selection => {
							if (selection === "Copy Command") {
								vscode.env.clipboard.writeText(fallbackCmd);
								vscode.window.showInformationMessage("Command copied to clipboard!");
							}
						});
						
						reject(error);
					});
				});
			}
		);
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to install Chromium: ${error.message}`);
		throw error;
	}
}

/**
 * Ensure Chromium is available (install if needed)
 * @returns {Promise<string|null>} Executable path (null for Playwright-managed)
 */
export async function ensureChromium() {
	if (await isChromiumInstalled()) {
		return null; // Playwright manages the path internally
	}

	// First-time installation - explain why
	const message = await vscode.window.showInformationMessage(
		"🔐 VS-Leet needs Chromium to securely authenticate with LeetCode. This is a one-time download (~140MB).",
		"Install Now",
		"Cancel"
	);

	if (message === "Install Now") {
		await installChromium();
		return null; // Playwright manages the path internally
	} else {
		throw new Error("Chromium installation cancelled by user");
	}
}

/**
 * Uninstall Chromium (for cleanup)
 */
export async function uninstallChromium() {
	vscode.window.showWarningMessage(
		"To uninstall Chromium, run 'npx playwright uninstall chromium' in your terminal",
		"Copy Command"
	).then(selection => {
		if (selection === "Copy Command") {
			vscode.env.clipboard.writeText("npx playwright uninstall chromium");
			vscode.window.showInformationMessage("Command copied to clipboard!");
		}
	});
}

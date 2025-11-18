import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { langToExtentionMap } from "./leetcode-queries.js";
import { injectEditorSupport } from "../utils/editor-support.js";

export async function openOrCreateSolutionFile(context, { slug, langSlug, code }) {
	if (!slug || !langSlug) {
		throw new Error("Invalid parameters: slug and langSlug are required");
	}
	
	const ext = langToExtentionMap[langSlug] || "txt";
	
	// Get settings
	const config = vscode.workspace.getConfiguration("vs-leet");
	const customWorkspace = config.get("workspaceFolder");
	const solutionFolder = config.get("solutionFolder") || "Solutions";
	
	// Use custom workspace if set, otherwise use workspace root
	let workspaceRoot;
	if (customWorkspace && customWorkspace.trim()) {
		workspaceRoot = customWorkspace;
	} else {
		workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || context.extensionPath;
	}
	
	const solutionsDir = path.join(workspaceRoot, solutionFolder);
	
	try {
		fs.mkdirSync(solutionsDir, { recursive: true });
	} catch (err) {
		throw new Error(`Failed to create Solutions directory: ${err.message}`);
	}
	
	const filePath = path.join(solutionsDir, `${slug}.${ext}`);

	if (!fs.existsSync(filePath)) {
		const header = `// ${slug} (${langSlug})\n`;
		const base = code ? `${code}\n` : header;
		const withSupport = injectEditorSupport(base, langSlug);
		fs.writeFileSync(filePath, withSupport, "utf8");
	}

	const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
	const openedEditor = await vscode.window.showTextDocument(doc, {
		viewColumn: vscode.ViewColumn.Two,
		preview: false,
	});

	// Close other visible editors to keep the solution focused
	for (const editor of vscode.window.visibleTextEditors) {
		if (editor.document.uri.toString() !== openedEditor.document.uri.toString()) {
			try {
				await vscode.window.showTextDocument(editor.document, { preview: false });
				await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
			} catch {
				// ignore
			}
		}
	}
}

import path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { langToExtentionMap } from "../leetcode-utils.js";

export async function openOrCreateSolutionFile(context, { slug, langSlug, code }) {
  const ext = langToExtentionMap[langSlug] || "txt";
  const solutionsDir = path.join(context.extensionPath, "Solutions");
  fs.mkdirSync(solutionsDir, { recursive: true });
  const filePath = path.join(solutionsDir, `${slug}.${ext}`);

  if (!fs.existsSync(filePath)) {
    const header = `// ${slug} (${langSlug})\n`;
    const initial = code ? `${code}\n` : header;
    fs.writeFileSync(filePath, initial, "utf8");
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

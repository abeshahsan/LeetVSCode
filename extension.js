import * as vscode from "vscode";
import { LeetViewProvider } from "./core/leet-view-provider.js";
import { registerCommands } from "./core/commands.js";
import { refreshAuthUI } from "./core/auth-context.js";

export async function activate(context) {
  const provider = new LeetViewProvider(context);
  context.subscriptions.push(vscode.window.registerTreeDataProvider("leetView", provider));

  registerCommands(context, provider);

  await refreshAuthUI(context, provider);
}

export function deactivate() {}

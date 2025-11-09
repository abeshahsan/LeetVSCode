import * as vscode from "vscode";
import { notifySession, closeWebview } from "./webview-manager.js";
import { runLoginProcess } from "./login-manager.js";

export async function refreshAuthUI(context, provider) {
  const cookies = context.globalState.get("leetcode_cookies");
  const loggedIn = Array.isArray(cookies) && cookies.length > 0;

  // Set a context key so menus can react
  await vscode.commands.executeCommand("setContext", "leetcode.loggedIn", loggedIn);

  if (loggedIn) {
    notifySession(true);
  } else {
    notifySession(false);
    provider._problems = [];
  }
  provider.refresh();
}

export async function signIn(context) {
  await runLoginProcess(undefined, context);
}

export async function signOut(context, provider) {
  await context.globalState.update("leetcode_cookies", null);
  await context.globalState.update("leetcode_user", null);
  vscode.window.showInformationMessage("Logged out successfully.");
  closeWebview();
  await refreshAuthUI(context, provider);
}

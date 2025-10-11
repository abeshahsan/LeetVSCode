import { createOrShowWebview } from "./manager/webview-manager.js";

export function activate(context) {
	createOrShowWebview(context);
}

export function deactivate() {}

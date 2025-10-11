import { createOrShowWebview } from "./manager/webview-manager.js";

// Add at the top
import fetch from "node-fetch";

import * as vscode from "vscode";
import { chromium } from "playwright"; // import only chromium
import * as path from "path";
import * as fs from "fs";
import { runPlaywrightLogin } from "./manager/login-manager.js";

export function activate(context) {
	createOrShowWebview(context);
}

export function deactivate() {}

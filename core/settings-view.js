import * as vscode from "vscode";

let settingsPanel;

export function openSettingsView(context) {
	if (settingsPanel) {
		settingsPanel.reveal(vscode.ViewColumn.One);
		return;
	}

	settingsPanel = vscode.window.createWebviewPanel(
		"vs-leet.settings",
		"VS-Leet Settings",
		vscode.ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
		}
	);

	settingsPanel.webview.html = getSettingsHtml(settingsPanel.webview, context);

	// Handle messages from webview
	settingsPanel.webview.onDidReceiveMessage(
		async (message) => {
			switch (message.command) {
				case "getSetting":
					const value = vscode.workspace.getConfiguration("vs-leet").get(message.key);
					settingsPanel.webview.postMessage({
						command: "settingValue",
						key: message.key,
						value: value,
					});
					break;

				case "updateSetting":
					await vscode.workspace
						.getConfiguration("vs-leet")
						.update(message.key, message.value, vscode.ConfigurationTarget.Global);
					vscode.window.showInformationMessage(`Updated ${message.key}`);
					break;

				case "openFolder":
					const folders = await vscode.window.showOpenDialog({
						canSelectFiles: false,
						canSelectFolders: true,
						canSelectMany: false,
						title: "Select Solutions Folder",
					});
					if (folders && folders[0]) {
						settingsPanel.webview.postMessage({
							command: "folderSelected",
							path: folders[0].fsPath,
						});
					}
					break;
			}
		},
		undefined,
		context.subscriptions
	);

	settingsPanel.onDidDispose(() => {
		settingsPanel = undefined;
	});
}

function getSettingsHtml(webview, context) {
	const config = vscode.workspace.getConfiguration("vs-leet");

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VS-Leet Settings</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
        }
        
        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 32px;
            font-size: 13px;
        }
        
        .setting-section {
            margin-bottom: 32px;
        }
        
        .setting-group {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 16px;
        }
        
        .setting-label {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 6px;
            display: block;
            color: var(--vscode-settings-headerForeground);
        }
        
        .setting-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            line-height: 1.5;
        }
        
        select, input[type="text"] {
            width: 100%;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
            outline: none;
        }
        
        select:focus, input[type="text"]:focus {
            border-color: var(--vscode-focusBorder);
        }
        
        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
        }
        
        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--vscode-button-background);
        }
        
        .folder-input-group {
            display: flex;
            gap: 8px;
        }
        
        .folder-input-group input {
            flex: 1;
        }
        
        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
            transition: background 0.2s;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        button:active {
            opacity: 0.8;
        }
        
        .info-badge {
            display: inline-block;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
        }
        
        .divider {
            height: 1px;
            background: var(--vscode-panel-border);
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>VS-Leet Settings</h1>
        <p class="subtitle">Configure your VS-Leet extension preferences</p>
        
        <div class="setting-section">
            <div class="setting-group">
                <label class="setting-label">
                    Default Programming Language
                    <span class="info-badge">Immediate Effect</span>
                </label>
                <p class="setting-description">
                    Choose your preferred language for solving problems. This will be used when creating new solution files.
                </p>
                <select id="defaultLanguage">
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="python3">Python 3</option>
                    <option value="c">C</option>
                    <option value="csharp">C#</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="php">PHP</option>
                    <option value="swift">Swift</option>
                    <option value="kotlin">Kotlin</option>
                    <option value="dart">Dart</option>
                    <option value="golang">Go</option>
                    <option value="ruby">Ruby</option>
                    <option value="scala">Scala</option>
                    <option value="rust">Rust</option>
                    <option value="racket">Racket</option>
                    <option value="erlang">Erlang</option>
                    <option value="elixir">Elixir</option>
                </select>
            </div>
            
            <div class="setting-group">
                <label class="setting-label">Solution Files Folder</label>
                <p class="setting-description">
                    Specify the folder name where all your solution files will be stored. Relative to workspace root.
                </p>
                <input type="text" id="solutionFolder" placeholder="e.g., Solutions, LeetCode, MyCode" />
            </div>
            
            <div class="setting-group">
                <label class="setting-label">Workspace Folder (Optional)</label>
                <p class="setting-description">
                    Set a custom workspace folder path. Leave empty to use the current workspace root.
                </p>
                <div class="folder-input-group">
                    <input type="text" id="workspaceFolder" placeholder="Leave empty for workspace root" readonly />
                    <button id="browseFolderBtn">Browse</button>
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="setting-group">
                <label class="setting-label">Problem Display</label>
                <p class="setting-description">
                    Control how problem information is displayed in the editor.
                </p>
                <label class="checkbox-container">
                    <input type="checkbox" id="showTopicTags" />
                    <span>Show topic tags in problem descriptions</span>
                </label>
            </div>
            
            <div class="setting-group">
                <label class="setting-label">Auto-Open Problems Browser</label>
                <p class="setting-description">
                    Automatically open the problems browser when VS Code starts.
                </p>
                <label class="checkbox-container">
                    <input type="checkbox" id="autoShow" />
                    <span>Open problems browser on startup</span>
                </label>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // Load current settings
        const settings = {
            defaultLanguage: ${JSON.stringify(config.get("defaultLanguage"))},
            solutionFolder: ${JSON.stringify(config.get("solutionFolder"))},
            showTopicTags: ${JSON.stringify(config.get("showTopicTags"))},
            autoShow: ${JSON.stringify(config.get("autoShow"))},
            workspaceFolder: ${JSON.stringify(config.get("workspaceFolder"))}
        };
        
        // Initialize UI with current values
        document.getElementById('defaultLanguage').value = settings.defaultLanguage;
        document.getElementById('solutionFolder').value = settings.solutionFolder;
        document.getElementById('showTopicTags').checked = settings.showTopicTags;
        document.getElementById('autoShow').checked = settings.autoShow;
        document.getElementById('workspaceFolder').value = settings.workspaceFolder;
        
        // Language change handler
        document.getElementById('defaultLanguage').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'updateSetting',
                key: 'defaultLanguage',
                value: e.target.value
            });
        });
        
        // Solution folder change handler
        document.getElementById('solutionFolder').addEventListener('blur', (e) => {
            const value = e.target.value.trim();
            if (value && value !== settings.solutionFolder) {
                vscode.postMessage({
                    command: 'updateSetting',
                    key: 'solutionFolder',
                    value: value
                });
                settings.solutionFolder = value;
            }
        });
        
        // Topic tags checkbox handler
        document.getElementById('showTopicTags').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'updateSetting',
                key: 'showTopicTags',
                value: e.target.checked
            });
        });
        
        // Auto-show checkbox handler
        document.getElementById('autoShow').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'updateSetting',
                key: 'autoShow',
                value: e.target.checked
            });
        });
        
        // Browse folder button handler
        document.getElementById('browseFolderBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'openFolder' });
        });
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'folderSelected':
                    document.getElementById('workspaceFolder').value = message.path;
                    vscode.postMessage({
                        command: 'updateSetting',
                        key: 'workspaceFolder',
                        value: message.path
                    });
                    break;
            }
        });
    </script>
</body>
</html>`;
}

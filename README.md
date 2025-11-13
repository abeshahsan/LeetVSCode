# VS-Leet — LeetCode Integration for Visual Studio Code

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/abeshahsan/VS-Leet)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.104.0+-007ACC.svg)](https://code.visualstudio.com/)

> A complete LeetCode integration for VS Code — Browse, solve, test, and submit coding problems directly in your editor with a beautiful, modern interface.

---

## 🎯 About

**VS-Leet** brings the complete LeetCode experience into Visual Studio Code. Practice algorithmic problems, run test cases, and submit solutions without ever leaving your development environment. Perfect for developers preparing for technical interviews or improving their coding skills.

**What makes it special:**
- 🎨 **Modern, Beautiful UI** — Vibrant gradients, smooth animations, and theme-aware design
- 🔐 **Secure Authentication** — Browser-based login with persistent sessions
- ⚡ **Real-time Testing** — Run code with custom inputs and see instant results
- 📊 **Detailed Feedback** — Performance metrics, test results, and error analysis
- 🔍 **Advanced Filtering** — By difficulty, tags, solved status, and search
- 💾 **Smart File Management** — Automatic solution saving in your workspace

---

## ✨ Features

### 🗂️ Problem Browser
- **Sidebar Integration** — Full problem list with status indicators
- **Smart Filtering** — Filter by Easy/Medium/Hard, tags, or search terms
- **Problem Statistics** — Acceptance rate, likes, submissions
- **Status Tracking** — See which problems you've solved or attempted

### 💻 In-Editor Problem Solving
- **Dedicated Webview** — Clean, distraction-free problem interface
- **Syntax Highlighting** — Beautifully formatted problem descriptions
- **Multi-Language Support** — C++, Java, Python, JavaScript, TypeScript
- **Auto-Save Solutions** — Files saved to workspace Solutions folder

### 🧪 Interactive Testing
- **Custom Test Cases** — Add unlimited test cases
- **Example Cases** — Pre-loaded from problem description
- **Visual Results** — Color-coded pass/fail with detailed output
- **Performance Metrics** — Runtime and memory usage displayed

### ✅ LeetCode Integration
- **Direct Submission** — Submit directly to LeetCode
- **Instant Feedback** — Detailed results with percentile rankings
- **Error Handling** — Compile errors, runtime errors with full details
- **Session Management** — Persistent login, no repeated authentication

---
- Clean, responsive interface
- Modular codebase for easy maintenance and testing---

## 🧰 Tech Stack

**Core Technologies:**
- 🔧 **VS Code Extension API** — Native integration with VS Code
- ⚛️ **React + TailwindCSS** — Modern webview UI with responsive design
- 🎭 **Playwright** — Automated browser login flow
- 📦 **Parcel** — Fast bundling for the webview
- ⚡ **Node.js** — Extension backend with ES modules

**Development Tools:**
- 🔍 **ESLint** — Code quality and consistency
- 🎨 **VS Code Theme Variables** — Seamless UI integration
- 🌐 **LeetCode API** — Problem data and submission handling

---

## 📁 Project structure (high level)

- `extension.js` — Activation entry (wires provider & commands)
- `core/` — Backend extension logic
   - `leet-view-provider.js` — Sidebar tree provider
   - `webview-manager.js` — Webview creation / messaging
   - `login-manager.js` — Playwright login flow
   - `commands.js` — Command registration and wiring
   - `auth-context.js` — Auth/session helpers
- `web/` — Webview client (React) and build tooling
   - `src/` — React components (test runner, problem session, login) and styles
- `models/`, `utils/`, `services/` — domain logic and helpers

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- VS Code
- Git

### Getting Started

1. **Clone the repository**
```powershell
git clone https://github.com/abeshahsan/LeetVSCode.git
cd LeetVSCode
```

2. **Install dependencies**
```powershell
# Install extension dependencies
npm install

# Install webview UI dependencies
cd web
npm install
cd ..
```

3. **Development workflow**

For **extension development**:
- Open this folder in VS Code
- Press `F5` to launch Extension Development Host
- The extension will be loaded in a new VS Code window

For **webview UI development** (with hot reload):
```powershell
cd web
npm start
# Runs Parcel dev server at http://localhost:1234
```

4. **Build for production**
```powershell
# Build the webview assets
cd web
npm run build

# Package the extension (optional)
# Install vsce: npm install -g vsce
# vsce package
```

### First Time Setup
1. Launch the extension development host (F5)
2. Open the LeetCode sidebar (activity bar icon)
3. Click "Sign In" and complete authentication in the browser
4. Start solving problems!

---

## ✅ Quick Test Drive

1. **Open the LeetCode sidebar** — Look for the activity bar icon
2. **Sign in** — Click the user icon, complete login in browser  
3. **Browse problems** — Use filters, search, or scroll through the list
4. **Open a problem** — Click any problem to open the webview session
5. **Test your solution** — Add test cases, run code, see results
6. **Submit** — When ready, submit directly to LeetCode

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run lint` to ensure code quality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please keep changes focused and include clear descriptions of what you've built.

---

## 🏗️ Architecture Overview

```
├── extension.js              # Entry point & activation
├── core/                     # Extension backend
│   ├── leet-view-provider.js # Sidebar tree provider  
│   ├── webview-manager.js    # Webview lifecycle
│   ├── login-manager.js      # Authentication flow
│   ├── commands.js           # Command registration
│   └── auth-context.js       # Session management
├── web/                      # React webview UI
│   ├── src/components/       # UI components
│   ├── src/utils/           # Client-side helpers
│   └── dist/                # Built assets
└── models/ & services/       # Domain logic
```

## 📄 License

MIT Licensed — see `LICENSE` for details.

---

⭐ **Found this useful?** Give it a star and share with fellow developers!

# LeetVSCode

A Visual Studio Code extension that provides a React-based webview interface for interacting with LeetCode problems, enabling seamless authentication and problem browsing directly within the editor.

## Table of Contents
---

## 📦 Installation

### From Marketplace (Coming Soon)
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "VS-Leet"
4. Click Install

### From Source

#### Prerequisites
- Node.js 16+ and npm
- VS Code 1.104.0+
- Git

#### Setup Steps

```powershell
# 1. Clone the repository
git clone https://github.com/abeshahsan/VS-Leet.git
cd VS-Leet

# 2. Install extension dependencies
npm install

# 3. Install webview dependencies
cd web
npm install
cd ..

# 4. Open in VS Code and press F5 to launch
code .
```

---

## 🚀 Getting Started

### First Use
1. **Open LeetCode Sidebar** — Click the LeetCode icon in the activity bar
2. **Sign In** — Click the account icon and complete login in browser
3. **Browse Problems** — Filter by difficulty, tags, or search
4. **Open a Problem** — Click any problem to start solving
5. **Write Solution** — Code opens in editor, problem details in webview
6. **Test & Submit** — Add test cases, run code, and submit

### Tips
- Solutions are saved in `Solutions/` folder in your workspace
- Use `Ctrl+Shift+P` → "LeetCode" to see all commands
- Enable auto-show in settings to open on startup
- Use tag filters to focus on specific topics

---

## ⚙️ Configuration

Access settings via `File → Preferences → Settings` and search for "VS-Leet":

| Setting | Default | Description |
|---------|---------|-------------|
| `vs-leet.autoShow` | `false` | Auto-open problem browser on VS Code startup |
| `vs-leet.solutionFolder` | `Solutions` | Folder name for solution files |
| `vs-leet.defaultLanguage` | `cpp` | Default programming language |

---

## 🎯 Commands

Access via Command Palette (`Ctrl+Shift+P`):

- `LeetCode: Open Problem Browser` — Open the main interface
- `LeetCode: Sign In` — Authenticate with LeetCode
- `LeetCode: Sign Out` — Logout and clear session
- `LeetCode: Filter Easy/Medium/Hard` — Quick difficulty filters
- `LeetCode: Search Problems` — Search by keyword or ID
- `LeetCode: Filter by Tag` — Browse by algorithm/data structure
- `LeetCode: Refresh Problems` — Update problem list
- `LeetCode: Clear Filters` — Reset all filters

---

## 🏗️ Architecture

```
vs-leet/
├── extension.js              # Extension entry point
├── core/                     # Extension backend
│   ├── leet-view-provider.js # Sidebar tree view
│   ├── webview-manager.js    # Webview lifecycle
│   ├── login-manager.js      # Playwright authentication
│   ├── commands.js           # Command registration
│   ├── services/             # LeetCode API integration
│   └── utils/                # Helper functions
├── models/                   # Data models
├── web/                      # Webview frontend (React)
│   ├── src/
│   │   ├── App.jsx           # Main React app
│   │   ├── components/       # UI components
│   │   └── utils/            # Frontend utilities
│   └── static/               # Built assets
└── resources/                # Icons and assets
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- LeetCode for the platform and API
- VS Code Extension API documentation
- The open-source community

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/abeshahsan/VS-Leet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/abeshahsan/VS-Leet/discussions)

---

**Enjoy coding! 🚀**


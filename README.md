# LeetVSCode — LeetCode integration for Visual Studio Code

> A polished VS Code extension that brings LeetCode into the editor — browse problems, run and submit solutions, and manage sessions directly from a sidebar and a webview problem session.

---

## 🎯 About

LeetVSCode is a VS Code extension that brings LeetCode directly into your editor. Practice coding problems, run test cases, and submit solutions without leaving VS Code. It's perfect for developers who want to improve their algorithmic skills while staying in their familiar development environment.

**What it does:**
- Browse and filter LeetCode problems in the sidebar
- Open problems in a dedicated webview with syntax highlighting
- Edit and test your solutions with custom test cases
- Run code remotely and see results instantly
- Submit solutions directly to LeetCode
- Maintain persistent login sessions

**Key technical highlights:**
- Clean modular architecture with separation of concerns
- Theme-aware webview that adapts to your VS Code appearance
- Secure authentication flow using Playwright browser automation
- Real-time code execution and submission to LeetCode's API
- Comprehensive filtering system (difficulty, tags, search)

---

## 🚀 Features

✅ **Problem Browser**
- Sidebar integration with problem list and filtering
- Filter by difficulty (Easy, Medium, Hard)
- Search by problem ID, title, or keywords
- Tag-based filtering with multiple tag selection

✅ **In-Editor Problem Solving**
- Dedicated webview for each problem with clean UI
- Syntax-highlighted problem descriptions
- Interactive test case editor
- Real-time code execution with custom inputs

✅ **LeetCode Integration**
- Seamless login using browser automation
- Submit solutions directly to LeetCode
- View submission results with detailed feedback
- Persistent session management

✅ **Developer Experience**
- Theme-aware UI that matches your VS Code setup
- Quick commands and keyboard shortcuts
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

- [Getting Started](#getting-started)
- [Features](#features)
- [Technologies Used](#technologies-used)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm
- Visual Studio Code (version 1.104.0 or higher)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abeshahsan/LeetVSCode.git
   cd LeetVSCode
   ```

2. **Install extension dependencies:**
   ```bash
   npm install
   ```

3. **Install webview dependencies:**
   ```bash
   cd web
   npm install
   cd ..
   ```

4. **Build the webview:**
   ```bash
   cd web
   npm run build
   cd ..
   ```

### Usage

1. Open the project in Visual Studio Code
2. Press `F5` to launch the Extension Development Host
3. The extension will automatically show the webview on startup (configurable in settings)

## Features

- **LeetCode Authentication**: Secure login through browser-based authentication
- **Problem Browsing**: View and browse LeetCode problems directly in VS Code
- **Problem Details**: Open and view detailed problem information
- **Session Management**: Persistent login sessions with logout functionality
- **React Webview**: Modern, responsive interface built with React and Tailwind CSS

## Technologies Used

- **Extension Framework**: Visual Studio Code Extension API
- **Frontend**: React 19, Tailwind CSS
- **Build Tools**: Parcel, Vite
- **Backend**: Node.js
- **Linting**: ESLint
- **Styling**: PostCSS, Autoprefixer




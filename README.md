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




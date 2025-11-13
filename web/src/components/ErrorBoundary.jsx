import { Component } from "react";

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		// Error caught by boundary
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-950">
					<div className="text-center max-w-md p-8">
						<div className="text-6xl mb-4">⚠️</div>
						<h1 className="text-2xl font-bold text-red-400 mb-3">Something Went Wrong</h1>
						<p className="text-gray-400 mb-6">
							The application encountered an unexpected error. Please try refreshing the webview.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/30"
						>
							Reload
						</button>
						{this.state.error && (
							<details className="mt-6 text-left">
								<summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
									Error Details
								</summary>
								<pre className="mt-2 text-xs bg-slate-900/50 p-3 rounded border border-red-500/30 text-red-300 overflow-auto max-h-40">
									{this.state.error.toString()}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;

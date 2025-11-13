// Shared UI and parsing helpers for webview React components

// Safely parse LeetCode metaData JSON, returning params and function name
export function parseMetaData(problem) {
	try {
		const metaStr = problem?.question?.metaData || problem?.metaData;
		if (!metaStr) return { params: [], functionName: "solution" };
		const meta = typeof metaStr === "string" ? JSON.parse(metaStr) : metaStr;
		return {
			params: Array.isArray(meta?.params) ? meta.params : [],
			functionName: meta?.name || "solution",
		};
	} catch {
		return { params: [], functionName: "solution" };
	}
}

// Group example testcases based on parameter count
export function parseExampleTestcases(exampleStr, paramCount) {
	if (!exampleStr || paramCount <= 0) return [];
	const lines = exampleStr
		.split(/\r?\n/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const testCases = [];
	for (let i = 0; i < lines.length; i += paramCount) {
		const params = lines.slice(i, i + paramCount);
		if (params.length === paramCount) testCases.push(params);
	}
	return testCases;
}

// Parse a failed test input string into individual parameters
export function parseFailedTestInput(inputStr, paramCount) {
	if (!inputStr || paramCount <= 0) return [];
	const lines = inputStr
		.split(/\r?\n/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	return lines.slice(0, paramCount);
}

// Difficulty badge classes
export function getDifficultyStyles(difficulty) {
	switch ((difficulty || "").toLowerCase()) {
		case "easy":
			return "text-green-400 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 shadow-lg shadow-green-500/20";
		case "medium":
			return "text-yellow-400 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/20";
		case "hard":
			return "text-red-400 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 shadow-lg shadow-red-500/20";
		default:
			return "text-gray-400 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/50";
	}
}

// Problem status chip classes
export function getStatusClass(status) {
	switch (status) {
		case "Solved":
			return "text-green-500 bg-green-500/10 border-green-500/20";
		case "Attempted":
			return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
		default:
			return "text-gray-400 bg-gray-500/10 border-gray-500/20";
	}
}

// Compute like percentage
export function getLikePercentage(likes = 0, dislikes = 0) {
	const total = (likes || 0) + (dislikes || 0);
	return total > 0 ? Math.round(((likes || 0) / total) * 100) : 0;
}

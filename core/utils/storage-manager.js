/**
 * Centralized storage manager for VS-Leet extension
 * All global storage is managed through a single JSON structure
 */

const STORAGE_KEY = "vsleet_data";

/**
 * Default storage structure with nested groups
 */
const DEFAULT_STORAGE = {
	auth: {
		cookies: null,
		csrfToken: null,
	},
	preferences: {
		defaultLanguage: "cpp",
		solutionDirectory: null,
		lastDirectoryPrompt: null,
	},
	ui: {
		lastProblemSlug: null,
	},
};

/**
 * Get the entire storage object
 */
function getStorage(context) {
	const stored = context.globalState.get(STORAGE_KEY);
	if (!stored) {
		return JSON.parse(JSON.stringify(DEFAULT_STORAGE)); // Deep clone
	}
	// Merge with defaults to ensure all keys exist
	return mergeWithDefaults(stored, DEFAULT_STORAGE);
}

/**
 * Save the entire storage object
 */
async function saveStorage(context, data) {
	await context.globalState.update(STORAGE_KEY, data);
}

/**
 * Merge stored data with defaults (handles nested objects)
 */
function mergeWithDefaults(stored, defaults) {
	const result = { ...defaults };
	for (const key in stored) {
		if (typeof stored[key] === "object" && stored[key] !== null && !Array.isArray(stored[key])) {
			result[key] = { ...defaults[key], ...stored[key] };
		} else {
			result[key] = stored[key];
		}
	}
	return result;
}

/**
 * Get a nested value from storage
 * @param {string} path - Dot notation path (e.g., "auth.cookies")
 */
export function getStorageValue(context, path) {
	const storage = getStorage(context);
	const keys = path.split(".");
	let value = storage;
	for (const key of keys) {
		value = value?.[key];
		if (value === undefined) break;
	}
	return value;
}

/**
 * Set a nested value in storage
 * @param {string} path - Dot notation path (e.g., "auth.cookies")
 */
export async function setStorageValue(context, path, value) {
	const storage = getStorage(context);
	const keys = path.split(".");
	const lastKey = keys.pop();
	let target = storage;

	// Navigate to the parent object
	for (const key of keys) {
		if (!target[key] || typeof target[key] !== "object") {
			target[key] = {};
		}
		target = target[key];
	}

	target[lastKey] = value;
	await saveStorage(context, storage);
	// Lazy load logger to avoid circular dependencies
	try {
		const { default: logger } = await import("../logger.js");
		logger.debug(`Storage updated: ${path} = ${JSON.stringify(value)}`);
	} catch (e) {
		// Logger not available
	}
}

/**
 * Clear all storage
 */
export async function clearStorage(context) {
	await saveStorage(context, JSON.parse(JSON.stringify(DEFAULT_STORAGE)));
	try {
		const { default: logger } = await import("../logger.js");
		logger.info("Storage cleared");
	} catch (e) {
		// Logger not available
	}
}

/**
 * check if storage key exists
 */
export function hasStorageKey(context) {
	const storage = getStorage(context);
	return !!storage;
}

// ===== Convenience methods for common operations =====

// Auth
export function getCookies(context) {
	return getStorageValue(context, "auth.cookies");
}

export async function setCookies(context, cookies) {
	await setStorageValue(context, "auth.cookies", cookies);
}

export function getCsrfToken(context) {
	return getStorageValue(context, "auth.csrfToken");
}

export async function setCsrfToken(context, token) {
	await setStorageValue(context, "auth.csrfToken", token);
}

// Preferences
export function getDefaultLanguage(context) {
	return getStorageValue(context, "preferences.defaultLanguage") || "cpp";
}

export async function setDefaultLanguage(context, langSlug) {
	await setStorageValue(context, "preferences.defaultLanguage", langSlug);
}

export function getSolutionDirectory(context) {
	return getStorageValue(context, "preferences.solutionDirectory");
}

export async function setSolutionDirectory(context, path) {
	await setStorageValue(context, "preferences.solutionDirectory", path);
}

export function getLastDirectoryPrompt(context) {
	return getStorageValue(context, "preferences.lastDirectoryPrompt");
}

export async function setLastDirectoryPrompt(context, timestamp) {
	await setStorageValue(context, "preferences.lastDirectoryPrompt", timestamp);
}

// UI State
export function getLastProblemSlug(context) {
	return getStorageValue(context, "ui.lastProblemSlug");
}

export async function setLastProblemSlug(context, slug) {
	await setStorageValue(context, "ui.lastProblemSlug", slug);
}

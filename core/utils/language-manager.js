import logger from "../logger.js";

const DEFAULT_LANGUAGE_KEY = "defaultLanguage";

/**
 * Get the default language from global storage
 * Falls back to "cpp" if not set
 */
export function getDefaultLanguage(context) {
	const saved = context.globalState.get(DEFAULT_LANGUAGE_KEY);
	return saved || "cpp";
}

/**
 * Save the default language to global storage
 */
export async function saveDefaultLanguage(context, langSlug) {
	await context.globalState.update(DEFAULT_LANGUAGE_KEY, langSlug);
	logger.info(`Default language saved: ${langSlug}`);
}

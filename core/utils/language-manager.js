import { getDefaultLanguage, setDefaultLanguage } from "./storage-manager.js";

// Export with both old and new names for compatibility
export { getDefaultLanguage, setDefaultLanguage };
export const saveDefaultLanguage = setDefaultLanguage; // Alias for backward compatibility

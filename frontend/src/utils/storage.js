// Local storage utilities for managing app data

const STORAGE_KEYS = {
  TOKEN: 'task_manager_token',
  USER: 'task_manager_user',
  THEME: 'task_manager_theme',
  PREFERENCES: 'task_manager_preferences',
  FILTERS: 'task_manager_filters',
  RECENT_SEARCHES: 'task_manager_recent_searches',
};

// Token manager
export const getStoredToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token from storage:', error);
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error setting token in storage:', error);
  }
};

export const removeStoredToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error removing token from storage:', error);
  }
};

// User data manager
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user in storage:', error);
  }
};

export const removeStoredUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error removing user from storage:', error);
  }
};

// Theme manager
export const getStoredTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  } catch (error) {
    console.error('Error getting theme from storage:', error);
    return 'light';
  }
};

export const setStoredTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Error setting theme in storage:', error);
  }
};

// User preferences manager
export const getStoredPreferences = () => {
  try {
    const preferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return preferences ? JSON.parse(preferences) : {};
  } catch (error) {
    console.error('Error getting preferences from storage:', error);
    return {};
  }
};

export const setStoredPreferences = (preferences) => {
  try {
    const existing = getStoredPreferences();
    const updated = { ...existing, ...preferences };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error setting preferences in storage:', error);
  }
};

export const removeStoredPreferences = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
  } catch (error) {
    console.error('Error removing preferences from storage:', error);
  }
};

// Filters manager (for tasks, projects, etc.)
export const getStoredFilters = (key) => {
  try {
    const filters = localStorage.getItem(`${STORAGE_KEYS.FILTERS}_${key}`);
    return filters ? JSON.parse(filters) : {};
  } catch (error) {
    console.error('Error getting filters from storage:', error);
    return {};
  }
};

export const setStoredFilters = (key, filters) => {
  try {
    localStorage.setItem(`${STORAGE_KEYS.FILTERS}_${key}`, JSON.stringify(filters));
  } catch (error) {
    console.error('Error setting filters in storage:', error);
  }
};

export const removeStoredFilters = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.FILTERS}_${key}`);
  } catch (error) {
    console.error('Error removing filters from storage:', error);
  }
};

// Recent searches manager
export const getRecentSearches = (key, maxItems = 10) => {
  try {
    const searches = localStorage.getItem(`${STORAGE_KEYS.RECENT_SEARCHES}_${key}`);
    return searches ? JSON.parse(searches).slice(0, maxItems) : [];
  } catch (error) {
    console.error('Error getting recent searches from storage:', error);
    return [];
  }
};

export const addRecentSearch = (key, searchTerm, maxItems = 10) => {
  try {
    if (!searchTerm || searchTerm.trim() === '') return;
    
    const existing = getRecentSearches(key, maxItems);
    const filtered = existing.filter(item => item !== searchTerm.trim());
    const updated = [searchTerm.trim(), ...filtered].slice(0, maxItems);
    
    localStorage.setItem(`${STORAGE_KEYS.RECENT_SEARCHES}_${key}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding recent search to storage:', error);
  }
};

export const removeRecentSearch = (key, searchTerm) => {
  try {
    const existing = getRecentSearches(key);
    const updated = existing.filter(item => item !== searchTerm);
    localStorage.setItem(`${STORAGE_KEYS.RECENT_SEARCHES}_${key}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error removing recent search from storage:', error);
  }
};

export const clearRecentSearches = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.RECENT_SEARCHES}_${key}`);
  } catch (error) {
    console.error('Error clearing recent searches from storage:', error);
  }
};

// Generic storage utilities
export const setStorageItem = (key, value) => {
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error setting item in storage:', error);
  }
};

export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error('Error getting item from storage:', error);
    return defaultValue;
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item from storage:', error);
  }
};

// Clear all app data
export const clearAllStoredData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any dynamic keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('task_manager_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all stored data:', error);
  }
};

// Storage size utilities
export const getStorageSize = () => {
  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
};

export const getStorageSizeFormatted = () => {
  const size = getStorageSize();
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

// Check if storage is available
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  // Token
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  
  // User
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  
  // Theme
  getStoredTheme,
  setStoredTheme,
  
  // Preferences
  getStoredPreferences,
  setStoredPreferences,
  removeStoredPreferences,
  
  // Filters
  getStoredFilters,
  setStoredFilters,
  removeStoredFilters,
  
  // Recent searches
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  
  // Generic
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  clearAllStoredData,
  
  // Utilities
  getStorageSize,
  getStorageSizeFormatted,
  isStorageAvailable,
};
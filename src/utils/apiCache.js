// API Response Cache Utility
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// Cached fetch wrapper
export const cachedFetch = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📦 Cache hit:', url);
    return cached;
  }
  
  // Fetch from API
  console.log('🌐 API call:', url);
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Cache the response
  setCachedData(cacheKey, data);
  
  return data;
};

export default {
  getCachedData,
  setCachedData,
  clearCache,
  cachedFetch
};

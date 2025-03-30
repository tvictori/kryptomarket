// API Configuration
const API_BASE_URL = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// Rate limiting setup
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fetch with retry logic
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Cached API calls
async function getCachedData(key, fetchFunction) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    const data = await fetchFunction();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
}

// Main API functions
export const api = {
    async getCryptoMarkets(currency = 'USD') {
        const cacheKey = `markets_${currency.toLowerCase()}`;
        return getCachedData(cacheKey, () => 
            fetchWithRetry(`${API_BASE_URL}/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`)
        );
    },

    async getCoinDetails(coinId) {
        const cacheKey = `coin_${coinId}`;
        return getCachedData(cacheKey, () =>
            fetchWithRetry(`${API_BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`)
        );
    }
};

export const debouncedGetCryptoMarkets = debounce(api.getCryptoMarkets, 1000); 
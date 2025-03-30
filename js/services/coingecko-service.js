class CoinGeckoService {
    constructor() {
        this.baseUrl = 'https://api.coingecko.com/api/v3';
        this.subscribers = {
            price: [],
            marketData: []
        };
        this.currentSymbol = 'bitcoin'; // CoinGecko uses IDs instead of symbols
        this.updateInterval = null;
        this.lastPrice = null;
        this.mockEnabled = true; // Enable mock data due to CORS restrictions
        this.basePrice = 65084.55;
    }

    async initialize() {
        try {
            if (this.mockEnabled) {
                this.startMockUpdates();
            } else {
                // Get initial data
                await this.fetchInitialData();
                
                // Set up periodic updates (every 10 seconds)
                this.updateInterval = setInterval(() => {
                    this.fetchLatestData();
                }, 10000);
            }
        } catch (error) {
            console.error('Error initializing CoinGecko service:', error);
            // Fallback to mock data if API fails
            this.mockEnabled = true;
            this.startMockUpdates();
        }
    }

    startMockUpdates() {
        console.log('Using mock data updates');
        // Update every second with mock data
        this.updateInterval = setInterval(() => {
            this.generateMockUpdate();
        }, 1000);
    }

    generateMockUpdate() {
        // Generate price movement
        const priceChange = this.basePrice * 0.002 * (Math.random() - 0.5);
        this.basePrice += priceChange;

        // Create mock price data
        const mockPriceData = {
            current: this.basePrice,
            change24h: (Math.random() - 0.5) * 4, // Keep as number, don't call toFixed() here
            trade: {
                price: this.basePrice,
                amount: (Math.random() * 0.5 + 0.1).toFixed(4),
                time: new Date(),
                isBuyerMaker: priceChange < 0
            }
        };

        // Create mock market data
        const mockMarketData = {
            prices: Array.from({ length: 60 }, (_, i) => ({
                time: new Date(Date.now() - (59 - i) * 60000),
                price: this.basePrice + (Math.random() - 0.5) * 100
            })),
            volumes: Array.from({ length: 60 }, () => ({
                time: new Date(),
                volume: Math.random() * 1000 + 500
            }))
        };

        // Notify subscribers
        this.notifySubscribers('price', mockPriceData);
        this.notifySubscribers('marketData', mockMarketData);
    }

    async fetchInitialData() {
        if (this.mockEnabled) return;
        
        try {
            const [priceData, marketData] = await Promise.all([
                this.fetchPrice(),
                this.fetchMarketData()
            ]);

            this.notifySubscribers('price', priceData);
            this.notifySubscribers('marketData', marketData);

        } catch (error) {
            console.error('Error fetching initial data:', error);
            throw error;
        }
    }

    async fetchPrice() {
        if (this.mockEnabled) return null;

        try {
            const response = await fetch(`${this.baseUrl}/simple/price?ids=${this.currentSymbol}&vs_currencies=usd&include_24hr_change=true`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data[this.currentSymbol]) {
                const price = {
                    current: data[this.currentSymbol].usd,
                    change24h: data[this.currentSymbol].usd_24h_change
                };
                this.lastPrice = price.current;
                return price;
            }
        } catch (error) {
            console.error('Error fetching price:', error);
            throw error;
        }
        return null;
    }

    async fetchMarketData() {
        if (this.mockEnabled) return null;

        try {
            const response = await fetch(`${this.baseUrl}/coins/${this.currentSymbol}/market_chart?vs_currency=usd&days=1&interval=minute`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.prices && data.prices.length > 0) {
                return {
                    prices: data.prices.map(([timestamp, price]) => ({
                        time: new Date(timestamp),
                        price: price
                    })),
                    volumes: data.total_volumes.map(([timestamp, volume]) => ({
                        time: new Date(timestamp),
                        volume: volume
                    }))
                };
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
            throw error;
        }
        return null;
    }

    async fetchLatestData() {
        try {
            const priceData = await this.fetchPrice();
            if (priceData) {
                // Create a trade event if price changed
                if (this.lastPrice !== priceData.current) {
                    const trade = {
                        price: priceData.current,
                        amount: (Math.random() * 0.5 + 0.1).toFixed(4), // Simulate trade amount
                        time: new Date(),
                        isBuyerMaker: priceData.current < this.lastPrice
                    };
                    this.notifySubscribers('price', { ...priceData, trade });
                }
            }
        } catch (error) {
            console.error('Error fetching latest data:', error);
        }
    }

    onPriceUpdate(callback) {
        this.subscribers.price.push(callback);
    }

    onMarketDataUpdate(callback) {
        this.subscribers.marketData.push(callback);
    }

    notifySubscribers(type, data) {
        if (this.subscribers[type]) {
            this.subscribers[type].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${type} subscriber callback:`, error);
                }
            });
        }
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const coinGeckoService = new CoinGeckoService(); 
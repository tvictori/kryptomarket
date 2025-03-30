class MarketDataService {
    constructor() {
        this.subscribers = {
            trade: [],
            orderbook: [],
            kline: []
        };
        this.symbol = 'btcusdt';
        this.mockDataInterval = null;
        this.basePrice = 65084.55;
        this.lastPrice = this.basePrice;
        this.volatility = 0.002; // 0.2% price movement
        this.startMockDataInterval();
    }

    startMockDataInterval() {
        if (this.mockDataInterval) {
            clearInterval(this.mockDataInterval);
        }

        // Generate mock trade data every second
        this.mockDataInterval = setInterval(() => {
            // Calculate new price with random walk
            const priceChange = this.lastPrice * this.volatility * (Math.random() - 0.5);
            this.lastPrice = this.lastPrice + priceChange;

            // Generate mock trade
            const mockTrade = {
                price: this.lastPrice,
                amount: 0.01 + Math.random() * 0.5, // Random amount between 0.01 and 0.51 BTC
                time: new Date(),
                isBuyerMaker: Math.random() > 0.5
            };
            this.notifySubscribers('trade', mockTrade);

            // Generate mock order book
            const spread = this.lastPrice * 0.0002; // 0.02% spread
            const mockOrderbook = {
                bids: Array.from({length: 10}, (_, i) => ({
                    price: this.lastPrice - spread - (i * this.lastPrice * 0.0001),
                    amount: 0.1 + Math.random() * 2
                })),
                asks: Array.from({length: 10}, (_, i) => ({
                    price: this.lastPrice + spread + (i * this.lastPrice * 0.0001),
                    amount: 0.1 + Math.random() * 2
                }))
            };
            this.notifySubscribers('orderbook', mockOrderbook);

            // Generate mock kline data
            const mockKline = {
                time: Date.now(),
                open: this.lastPrice - priceChange,
                high: Math.max(this.lastPrice, this.lastPrice - priceChange),
                low: Math.min(this.lastPrice, this.lastPrice - priceChange),
                close: this.lastPrice,
                volume: 100 + Math.random() * 900,
                isClosed: false
            };
            this.notifySubscribers('kline', mockKline);
        }, 1000);

        console.log('Mock data generation started');
    }

    stopMockDataInterval() {
        if (this.mockDataInterval) {
            clearInterval(this.mockDataInterval);
            this.mockDataInterval = null;
        }
    }

    disconnect() {
        this.stopMockDataInterval();
    }

    onMessage(type, callback) {
        if (this.subscribers[type]) {
            this.subscribers[type].push(callback);
            
            // Send initial data immediately
            if (type === 'trade') {
                callback({
                    price: this.lastPrice,
                    amount: 0.1,
                    time: new Date(),
                    isBuyerMaker: false
                });
            } else if (type === 'orderbook') {
                callback({
                    bids: Array.from({length: 10}, (_, i) => ({
                        price: this.lastPrice - (i * this.lastPrice * 0.0001),
                        amount: 1.0
                    })),
                    asks: Array.from({length: 10}, (_, i) => ({
                        price: this.lastPrice + (i * this.lastPrice * 0.0001),
                        amount: 1.0
                    }))
                });
            }
        }
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
}

// Create and export a singleton instance
export const marketData = new MarketDataService(); 
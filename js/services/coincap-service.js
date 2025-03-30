class CoinCapService {
    constructor() {
        this.baseUrl = 'https://api.coincap.io/v2';
        this.wsUrl = 'wss://ws.coincap.io/prices?assets=bitcoin';
        this.ws = null;
        this.subscribers = {
            price: [],
            trades: []
        };
        this.updateInterval = null;
        this.lastPrice = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async initialize() {
        try {
            // Get initial data
            await this.fetchInitialData();
            
            // Connect to WebSocket for real-time price updates
            this.connectWebSocket();

            // Set up periodic updates for market data every 10 seconds
            this.updateInterval = setInterval(() => {
                this.fetchMarketData();
            }, 10000);

        } catch (error) {
            console.error('Error initializing CoinCap service:', error);
        }
    }

    async fetchInitialData() {
        try {
            const response = await fetch(`${this.baseUrl}/assets/bitcoin`);
            const data = await response.json();
            
            if (data.data) {
                const price = {
                    current: parseFloat(data.data.priceUsd),
                    change24h: parseFloat(data.data.changePercent24Hr)
                };
                this.lastPrice = price.current;
                this.notifySubscribers('price', price);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    }

    async fetchMarketData() {
        try {
            const response = await fetch(`${this.baseUrl}/assets/bitcoin/history?interval=m1`);
            const data = await response.json();
            
            if (data.data) {
                const marketData = {
                    prices: data.data.map(item => ({
                        time: new Date(item.time),
                        price: parseFloat(item.priceUsd),
                        volume: parseFloat(item.volumeUsd)
                    }))
                };
                this.notifySubscribers('trades', marketData);
            }
        } catch (error) {
            console.error('Error fetching market data:', error);
        }
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.bitcoin) {
                        const price = parseFloat(data.bitcoin);
                        const trade = {
                            price: price,
                            amount: ((Math.random() * 0.5 + 0.1) * 1000) / price, // Simulate trade amount
                            time: new Date(),
                            isBuyerMaker: price < this.lastPrice
                        };
                        this.lastPrice = price;
                        this.notifySubscribers('price', {
                            current: price,
                            trade: trade
                        });
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.handleDisconnect();
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.handleDisconnect();
        }
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connectWebSocket(), delay);
        }
    }

    onPriceUpdate(callback) {
        this.subscribers.price.push(callback);
    }

    onTradesUpdate(callback) {
        this.subscribers.trades.push(callback);
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
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const coincapService = new CoinCapService(); 
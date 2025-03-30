class BinanceService {
    constructor() {
        this.ws = null;
        this.subscribers = {
            trade: [],
            kline: [],
            orderbook: []
        };
        this.symbol = 'btcusdt';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.lastPrice = null;
    }

    async initialize() {
        try {
            // Get initial price from REST API
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
            const data = await response.json();
            this.lastPrice = parseFloat(data.lastPrice);
            
            // Connect to WebSocket
            this.connect();
        } catch (error) {
            console.error('Error initializing Binance service:', error);
        }
    }

    connect() {
        try {
            // Using public WebSocket endpoint
            this.ws = new WebSocket('wss://stream.binance.com:9443/ws');

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                
                // Subscribe to multiple streams
                const subscribeMsg = {
                    method: 'SUBSCRIBE',
                    params: [
                        `${this.symbol}@trade`,
                        `${this.symbol}@depth20@100ms`,
                        `${this.symbol}@kline_1m`
                    ],
                    id: Date.now()
                };
                
                this.ws.send(JSON.stringify(subscribeMsg));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
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

    handleMessage(data) {
        // Handle trade updates
        if (data.e === 'trade') {
            const trade = {
                price: parseFloat(data.p),
                amount: parseFloat(data.q),
                time: new Date(data.T),
                isBuyerMaker: data.m
            };
            this.lastPrice = trade.price;
            this.notifySubscribers('trade', trade);
        }
        // Handle order book updates
        else if (data.e === 'depthUpdate') {
            const orderbook = {
                bids: data.b.map(([price, amount]) => ({
                    price: parseFloat(price),
                    amount: parseFloat(amount)
                })),
                asks: data.a.map(([price, amount]) => ({
                    price: parseFloat(price),
                    amount: parseFloat(amount)
                }))
            };
            this.notifySubscribers('orderbook', orderbook);
        }
        // Handle kline/candlestick updates
        else if (data.e === 'kline') {
            const kline = {
                time: data.k.t,
                open: parseFloat(data.k.o),
                high: parseFloat(data.k.h),
                low: parseFloat(data.k.l),
                close: parseFloat(data.k.c),
                volume: parseFloat(data.k.v),
                isClosed: data.k.x
            };
            this.notifySubscribers('kline', kline);
        }
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
        }
    }

    onMessage(type, callback) {
        if (this.subscribers[type]) {
            this.subscribers[type].push(callback);
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

    cleanup() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const binanceService = new BinanceService(); 
import { marketData } from './services/market-data.js';

// TradingView Chart Widget
function initTradingViewWidget() {
    try {
        new TradingView.widget({
            "width": "100%",
            "height": "100%",
            "symbol": "BINANCE:BTCUSDT",
            "interval": "1",
            "timezone": "exchange",
            "theme": "dark",
            "style": "1",
            "toolbar_bg": "#131517",
            "enable_publishing": false,
            "hide_side_toolbar": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_chart"
        });
    } catch (error) {
        console.error('Error initializing TradingView widget:', error);
    }
}

// Order Book Management
class OrderBook {
    constructor() {
        this.buyOrders = [];
        this.sellOrders = [];
        this.currentPrice = 0;
        this.maxOrderBookItems = 15;
        this.setupMarketDataListeners();
    }

    setupMarketDataListeners() {
        marketData.onMessage('orderbook', (data) => {
            if (!data || !data.bids || !data.asks) return;

            // Update buy orders
            data.bids.forEach(bid => {
                const existingIndex = this.buyOrders.findIndex(order => order.price === bid.price);
                if (existingIndex !== -1) {
                    if (bid.amount === 0) {
                        this.buyOrders.splice(existingIndex, 1);
                    } else {
                        this.buyOrders[existingIndex].amount = bid.amount;
                        this.buyOrders[existingIndex].total = bid.price * bid.amount;
                    }
                } else if (bid.amount > 0) {
                    this.buyOrders.push({
                        price: bid.price,
                        amount: bid.amount,
                        total: bid.price * bid.amount
                    });
                }
            });

            // Update sell orders
            data.asks.forEach(ask => {
                const existingIndex = this.sellOrders.findIndex(order => order.price === ask.price);
                if (existingIndex !== -1) {
                    if (ask.amount === 0) {
                        this.sellOrders.splice(existingIndex, 1);
                    } else {
                        this.sellOrders[existingIndex].amount = ask.amount;
                        this.sellOrders[existingIndex].total = ask.price * ask.amount;
                    }
                } else if (ask.amount > 0) {
                    this.sellOrders.push({
                        price: ask.price,
                        amount: ask.amount,
                        total: ask.price * ask.amount
                    });
                }
            });

            // Sort and trim orders
            this.buyOrders.sort((a, b) => b.price - a.price);
            this.sellOrders.sort((a, b) => a.price - b.price);
            this.buyOrders = this.buyOrders.slice(0, this.maxOrderBookItems);
            this.sellOrders = this.sellOrders.slice(0, this.maxOrderBookItems);

            this.updateOrderBookDisplay();
        });

        marketData.onMessage('trade', (trade) => {
            if (!trade || !trade.price) return;
            this.currentPrice = trade.price;
            this.updateOrderBookDisplay();
        });
    }

    updateOrderBookDisplay() {
        const orderBookElement = document.querySelector('.order-book');
        if (!orderBookElement) return;

        // Clear existing orders
        orderBookElement.innerHTML = '';

        // Add sell orders (reversed to show highest price at top)
        this.sellOrders.slice().reverse().forEach(order => {
            orderBookElement.appendChild(this.createOrderRow(order, 'sell'));
        });

        // Add current price
        const priceRow = document.createElement('div');
        priceRow.className = 'order-book-row text-center py-2';
        priceRow.innerHTML = `<span class="price-display">${this.currentPrice.toFixed(2)}</span>`;
        orderBookElement.appendChild(priceRow);

        // Add buy orders
        this.buyOrders.forEach(order => {
            orderBookElement.appendChild(this.createOrderRow(order, 'buy'));
        });
    }

    createOrderRow(order, type) {
        const row = document.createElement('div');
        row.className = `order-book-row order-book-${type}`;
        row.innerHTML = `
            <span>${order.price.toFixed(2)}</span>
            <span>${order.amount.toFixed(4)}</span>
            <span>${order.total.toFixed(2)}</span>
        `;
        return row;
    }
}

// Trading Form Management
class TradingForm {
    constructor() {
        this.currentPrice = 0;
        this.form = null;
        this.amountInput = null;
        this.priceInput = null;
        this.totalInput = null;
        this.buyButton = null;
        this.sellButton = null;
        this.submitButton = null;
        this.initializeForm();
        this.setupMarketDataListeners();
    }

    setupMarketDataListeners() {
        marketData.onMessage('trade', (trade) => {
            if (!trade || !trade.price) return;
            this.currentPrice = trade.price;
            if (this.priceInput) {
                this.priceInput.value = this.currentPrice.toFixed(2);
                // Trigger total calculation
                this.updateTotal();
            }
        });
    }

    initializeForm() {
        this.amountInput = document.querySelector('input[placeholder="0.00"]');
        this.priceInput = document.querySelector('input[placeholder="65,084.55"]');
        this.totalInput = document.querySelector('input[placeholder="0.00"]:last-of-type');
        this.buyButton = document.querySelector('.btn-buy');
        this.sellButton = document.querySelector('.btn-sell');
        this.submitButton = document.querySelector('.btn-success');
        
        if (!this.amountInput || !this.priceInput || !this.totalInput) return;

        // Remove any existing listeners
        const newAmountInput = this.amountInput.cloneNode(true);
        const newPriceInput = this.priceInput.cloneNode(true);
        this.amountInput.parentNode.replaceChild(newAmountInput, this.amountInput);
        this.priceInput.parentNode.replaceChild(newPriceInput, this.priceInput);
        this.amountInput = newAmountInput;
        this.priceInput = newPriceInput;

        // Add new listeners
        this.amountInput.addEventListener('input', () => this.updateTotal());
        this.priceInput.addEventListener('input', () => this.updateTotal());

        if (this.buyButton && this.sellButton && this.submitButton) {
            const newBuyButton = this.buyButton.cloneNode(true);
            const newSellButton = this.sellButton.cloneNode(true);
            this.buyButton.parentNode.replaceChild(newBuyButton, this.buyButton);
            this.sellButton.parentNode.replaceChild(newSellButton, this.sellButton);
            this.buyButton = newBuyButton;
            this.sellButton = newSellButton;

            this.buyButton.addEventListener('click', () => this.switchOrderType('buy'));
            this.sellButton.addEventListener('click', () => this.switchOrderType('sell'));
        }
    }

    updateTotal() {
        if (!this.amountInput || !this.priceInput || !this.totalInput) return;
        const amount = parseFloat(this.amountInput.value) || 0;
        const price = parseFloat(this.priceInput.value) || this.currentPrice;
        this.totalInput.value = (amount * price).toFixed(2);
    }

    switchOrderType(type) {
        const buyButton = document.querySelector('.btn-buy');
        const sellButton = document.querySelector('.btn-sell');
        const submitButton = document.querySelector('.btn-success');

        if (type === 'buy') {
            buyButton.classList.add('active');
            sellButton.classList.remove('active');
            submitButton.className = 'btn btn-success w-100';
            submitButton.textContent = 'Buy BTC';
        } else {
            sellButton.classList.add('active');
            buyButton.classList.remove('active');
            submitButton.className = 'btn btn-danger w-100';
            submitButton.textContent = 'Sell BTC';
        }
    }
}

// Recent Trades Management
class RecentTrades {
    constructor() {
        this.trades = [];
        this.maxTrades = 50;
        this.tbody = null;
        this.setupMarketDataListeners();
    }

    setupMarketDataListeners() {
        marketData.onMessage('trade', (trade) => {
            if (!trade || !trade.price || !trade.amount) return;
            this.addTrade(trade);
        });
    }

    addTrade(trade) {
        this.trades.unshift({
            price: trade.price,
            amount: trade.amount,
            total: trade.price * trade.amount,
            time: trade.time,
            type: trade.isBuyerMaker ? 'sell' : 'buy'
        });
        this.trades = this.trades.slice(0, this.maxTrades);
        this.updateTradesDisplay();
    }

    updateTradesDisplay() {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        tbody.innerHTML = this.trades.map(trade => `
            <tr class="${trade.type === 'buy' ? 'text-success' : 'text-danger'}">
                <td>${trade.price.toFixed(2)}</td>
                <td>${trade.amount.toFixed(4)}</td>
                <td>${trade.total.toFixed(2)}</td>
                <td>${this.formatTime(trade.time)}</td>
            </tr>
        `).join('');
    }

    formatTime(time) {
        return time.toLocaleTimeString();
    }
}

// Initialize everything when the DOM is loaded
let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    isInitialized = true;

    try {
        // Initialize TradingView chart
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.id = 'tradingview_chart';
            initTradingViewWidget();
        }

        // Initialize trading components
        const orderBook = new OrderBook();
        const tradingForm = new TradingForm();
        const recentTrades = new RecentTrades();

        // Connect to market data
        marketData.connect();

        // Cleanup on page unload
        window.addEventListener('unload', () => {
            marketData.disconnect();
        });
    } catch (error) {
        console.error('Error initializing trading interface:', error);
    }
}); 
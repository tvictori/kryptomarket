import { api } from './api.js';
import { ui } from './utils.js';
import { components } from './components.js';
import { coincapService } from './services/coincap-service.js';

class CryptoApp {
    constructor() {
        this.cryptoData = [];
        this.refreshInterval = 60000; // 1 minute
        this.refreshTimer = null;
        this.currentCurrency = 'USD';
        
        // Initialize elements
        this.elements = {
            priceDisplay: document.querySelector('.price-display .h3'),
            changeDisplay: document.querySelector('.price-display .h3 + div'),
            tradingControls: document.querySelector('.trading-controls'),
            orderBook: document.querySelector('.order-book'),
            recentTradesTable: document.querySelector('.table tbody'),
            chartContainer: document.getElementById('tradingview-chart')
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            this.setupDataListeners();
            await coincapService.initialize();
            this.initTradingViewWidget();
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    setupEventListeners() {
        // Handle timeframe changes
        if (this.elements.tradingControls) {
            this.elements.tradingControls.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    // Remove active class from all buttons
                    this.elements.tradingControls.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Add active class to clicked button
                    e.target.classList.add('active');
                }
            });
        }

        // Cleanup on page unload
        window.addEventListener('unload', () => {
            this.cleanup();
            coincapService.cleanup();
        });
    }

    setupDataListeners() {
        coincapService.onPriceUpdate((data) => {
            if (!data) return;
            
            // Update price display
            this.updatePriceDisplay(data.current, data.change24h);
            
            // If there's a trade, update recent trades
            if (data.trade) {
                this.updateRecentTrades(data.trade);
            }
        });

        coincapService.onTradesUpdate((data) => {
            if (!data || !data.prices || data.prices.length === 0) return;
            
            // Create synthetic order book from recent price history
            const currentPrice = data.prices[data.prices.length - 1].price;
            this.updateOrderBook(currentPrice);
        });
    }

    updatePriceDisplay(price, change24h) {
        if (!this.elements.priceDisplay || !this.elements.changeDisplay) return;

        this.elements.priceDisplay.textContent = `$${price.toFixed(2)}`;
        
        // Update price change color and text
        if (typeof change24h === 'number') {
            const changeText = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
            this.elements.changeDisplay.textContent = changeText;
            this.elements.changeDisplay.className = change24h >= 0 ? 'text-success' : 'text-danger';
        }
    }

    updateRecentTrades(trade) {
        if (!this.elements.recentTradesTable) return;

        const row = document.createElement('tr');
        const total = (trade.price * trade.amount).toFixed(2);
        const time = new Date(trade.time).toLocaleTimeString();
        
        row.innerHTML = `
            <td class="${trade.isBuyerMaker ? 'text-danger' : 'text-success'}">$${trade.price.toFixed(2)}</td>
            <td>${trade.amount.toFixed(4)}</td>
            <td>$${total}</td>
            <td>${time}</td>
        `;

        // Insert at the beginning of the table
        if (this.elements.recentTradesTable.firstChild) {
            this.elements.recentTradesTable.insertBefore(row, this.elements.recentTradesTable.firstChild);
        } else {
            this.elements.recentTradesTable.appendChild(row);
        }

        // Keep only the last 50 trades
        const maxTrades = 50;
        while (this.elements.recentTradesTable.children.length > maxTrades) {
            this.elements.recentTradesTable.removeChild(this.elements.recentTradesTable.lastChild);
        }
    }

    updateOrderBook(currentPrice) {
        if (!this.elements.orderBook) return;

        // Clear existing orders
        this.elements.orderBook.innerHTML = '';

        // Create synthetic order book data based on current price
        const spread = currentPrice * 0.0002; // 0.02% spread
        const orders = 10;

        // Add asks (sell orders) in reverse order
        for (let i = orders - 1; i >= 0; i--) {
            const price = currentPrice + spread + (i * currentPrice * 0.0001);
            const amount = 0.1 + Math.random() * 2;
            
            const row = document.createElement('div');
            row.className = 'order-book-row';
            row.innerHTML = `
                <span class="text-danger">${price.toFixed(2)}</span>
                <span>${amount.toFixed(4)}</span>
            `;
            this.elements.orderBook.appendChild(row);
        }

        // Add current price row
        const priceRow = document.createElement('div');
        priceRow.className = 'order-book-row text-center py-2';
        priceRow.innerHTML = `<span class="price-display">${currentPrice.toFixed(2)}</span>`;
        this.elements.orderBook.appendChild(priceRow);

        // Add bids (buy orders)
        for (let i = 0; i < orders; i++) {
            const price = currentPrice - spread - (i * currentPrice * 0.0001);
            const amount = 0.1 + Math.random() * 2;
            
            const row = document.createElement('div');
            row.className = 'order-book-row';
            row.innerHTML = `
                <span class="text-success">${price.toFixed(2)}</span>
                <span>${amount.toFixed(4)}</span>
            `;
            this.elements.orderBook.appendChild(row);
        }
    }

    initTradingViewWidget() {
        if (!this.elements.chartContainer) return;

        new TradingView.widget({
            container_id: 'tradingview-chart',
            symbol: 'BITSTAMP:BTCUSD',
            interval: '1',
            timezone: 'Etc/UTC',
            theme: 'dark',
            locale: 'en',
            width: '100%',
            height: '500',
            autosize: false,
            enable_publishing: false,
            allow_symbol_change: true,
            studies: ['Volume@tv-basicstudies'],
            save_image: false,
            style: '1',
            toolbar_bg: '#131722',
            watchlist: [
                'BITSTAMP:BTCUSD',
                'BITSTAMP:ETHUSD',
                'BITSTAMP:XRPUSD',
                'BITSTAMP:LTCUSD',
                'BITSTAMP:BCHUSD',
                'BITSTAMP:ADAUSD',
                'BITSTAMP:DOTUSD',
                'BITSTAMP:SOLUSD'
            ],
            details: true,
            hotlist: true,
            calendar: false,
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650',
            hide_side_toolbar: false,
            hide_top_toolbar: false,
            withdateranges: true,
            hide_legend: false,
            enabled_features: [
                'study_templates',
                'use_localstorage_for_settings',
                'display_market_status',
                'control_bar',
                'header_widget',
                'header_symbol_search',
                'symbol_search_hot_key',
                'header_compare'
            ],
            studies_overrides: {
                "volume.volume.color.0": "#ef5350",
                "volume.volume.color.1": "#26a69a"
            }
        });
    }

    cleanup() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

// Initialize app when DOM is ready
let app = null;
document.addEventListener('DOMContentLoaded', () => {
    if (!app) {
        try {
            app = new CryptoApp();
            window.cryptoApp = app;
        } catch (error) {
            console.error('Error creating app:', error);
        }
    }
}); 
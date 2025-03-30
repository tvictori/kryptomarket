import { api, debouncedGetCryptoMarkets } from './api.js';
import { ui } from './utils.js';
import { components } from './components.js';

class CryptoApp {
    constructor() {
        this.cryptoData = [];
        this.refreshInterval = 60000; // 1 minute
        this.refreshTimer = null;
        this.currentCurrency = 'USD';
        
        // Initialize elements
        this.elements = {
            cryptoTableBody: document.getElementById('cryptoTableBody'),
            searchInput: document.getElementById('searchInput'),
            sortSelect: document.getElementById('sortSelect'),
            currencySelect: document.getElementById('currencySelect'),
            autoRefreshToggle: document.getElementById('autoRefreshToggle')
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.fetchAndUpdateData();
        if (this.elements.autoRefreshToggle.checked) {
            this.startAutoRefresh();
        }
    }
    
    setupEventListeners() {
        // Search and filter
        this.elements.searchInput.addEventListener('input', (e) => {
            const searchTerm = ui.sanitizeInput(e.target.value.toLowerCase());
            this.filterCryptoData(searchTerm);
        });
        
        // Sorting
        this.elements.sortSelect.addEventListener('change', () => this.sortCryptoData());
        
        // Currency change
        this.elements.currencySelect.addEventListener('change', (e) => {
            this.currentCurrency = e.target.value;
            this.fetchAndUpdateData();
        });
        
        // Auto-refresh toggle
        this.elements.autoRefreshToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
        
        // Table row clicks (event delegation)
        this.elements.cryptoTableBody.addEventListener('click', (e) => {
            const detailsButton = e.target.closest('.view-details');
            if (detailsButton) {
                const coinId = detailsButton.getAttribute('data-coin-id');
                this.showCoinDetails(coinId);
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('unload', () => this.cleanup());
    }
    
    async fetchAndUpdateData() {
        try {
            ui.setLoadingState(true);
            this.cryptoData = await debouncedGetCryptoMarkets(this.currentCurrency);
            
            // Update all components
            components.updateMarketOverview(this.cryptoData);
            components.updateFeaturedCoins(this.cryptoData);
            this.elements.cryptoTableBody.innerHTML = components.renderCryptoTable(this.cryptoData);
            
        } catch (error) {
            console.error('Error fetching data:', error);
            this.elements.cryptoTableBody.innerHTML = `
                <tr><td colspan="7" class="text-center text-danger">
                    Error loading data. Please try again later.
                </td></tr>`;
        } finally {
            ui.setLoadingState(false);
        }
    }
    
    filterCryptoData(searchTerm) {
        const filteredData = this.cryptoData.filter(coin => 
            coin.name.toLowerCase().includes(searchTerm) || 
            coin.symbol.toLowerCase().includes(searchTerm)
        );
        this.elements.cryptoTableBody.innerHTML = components.renderCryptoTable(filteredData);
    }
    
    sortCryptoData() {
        const sortBy = this.elements.sortSelect.value;
        let sortedData = [...this.cryptoData];
        
        const sortFunctions = {
            name: (a, b) => a.name.localeCompare(b.name),
            price: (a, b) => b.current_price - a.current_price,
            change: (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
            marketCap: (a, b) => b.market_cap - a.market_cap
        };
        
        if (sortFunctions[sortBy]) {
            sortedData.sort(sortFunctions[sortBy]);
        }
        
        this.elements.cryptoTableBody.innerHTML = components.renderCryptoTable(sortedData);
    }
    
    async showCoinDetails(coinId) {
        try {
            ui.setLoadingState(true);
            const coin = await api.getCoinDetails(coinId);
            components.updateCoinModal(coin);
            new bootstrap.Modal(document.getElementById('coinDetailModal')).show();
        } catch (error) {
            console.error('Error fetching coin details:', error);
        } finally {
            ui.setLoadingState(false);
        }
    }
    
    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear existing timer if any
        this.refreshTimer = setInterval(() => this.fetchAndUpdateData(), this.refreshInterval);
    }
    
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    cleanup() {
        this.stopAutoRefresh();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoApp = new CryptoApp();
}); 
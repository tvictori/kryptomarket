import { formatters, ui, dom } from './utils.js';

// Component rendering functions
export const components = {
    renderCryptoTable(data) {
        if (!data || data.length === 0) {
            return `<tr><td colspan="7" class="text-center">No data available</td></tr>`;
        }

        return data.map((coin, index) => `
            <tr data-coin-id="${coin.id}">
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${coin.image}" alt="${coin.name}" width="24" height="24" class="me-2">
                        <div>
                            <div>${coin.name}</div>
                            <small class="text-muted">${coin.symbol.toUpperCase()}</small>
                        </div>
                    </div>
                </td>
                <td>${formatters.currency(coin.current_price)}</td>
                <td class="${ui.getChangeClass(coin.price_change_percentage_24h)}">
                    ${formatters.percentage(coin.price_change_percentage_24h)}
                </td>
                <td>${formatters.currency(coin.market_cap)}</td>
                <td>${formatters.currency(coin.total_volume)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-details"
                            data-coin-id="${coin.id}"
                            aria-label="View details for ${coin.name}">
                        Details
                    </button>
                </td>
            </tr>
        `).join('');
    },

    updateMarketOverview(data) {
        const totalMarketCap = data.reduce((sum, coin) => sum + coin.market_cap, 0);
        const total24hVolume = data.reduce((sum, coin) => sum + coin.total_volume, 0);
        const btcData = data.find(coin => coin.id === 'bitcoin');
        
        document.getElementById('totalMarketCap').textContent = formatters.currency(totalMarketCap);
        document.getElementById('total24hVolume').textContent = formatters.currency(total24hVolume);
        
        if (btcData) {
            const btcDominance = (btcData.market_cap / totalMarketCap) * 100;
            document.getElementById('btcDominance').textContent = formatters.percentage(btcDominance);
        }
        
        document.getElementById('cryptoCount').textContent = formatters.number(data.length);
    },

    updateFeaturedCoins(data) {
        const updateCoin = (id, priceEl, changeEl) => {
            const coinData = data.find(coin => coin.id === id);
            if (coinData) {
                priceEl.textContent = formatters.currency(coinData.current_price);
                changeEl.textContent = formatters.percentage(coinData.price_change_percentage_24h);
                changeEl.className = `price-change ${ui.getChangeClass(coinData.price_change_percentage_24h)}`;
            }
        };

        updateCoin('bitcoin', 
            document.getElementById('btcPrice'),
            document.getElementById('btcChange')
        );
        updateCoin('ethereum',
            document.getElementById('ethPrice'),
            document.getElementById('ethChange')
        );
        updateCoin('binancecoin',
            document.getElementById('bnbPrice'),
            document.getElementById('bnbChange')
        );
    },

    updateCoinModal(coin) {
        document.getElementById('modalCoinName').textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
        document.getElementById('modalCoinPrice').textContent = formatters.currency(coin.current_price);
        
        const changeEl = document.getElementById('modalCoinChange');
        changeEl.textContent = formatters.percentage(coin.price_change_percentage_24h);
        changeEl.className = `price-change ${ui.getChangeClass(coin.price_change_percentage_24h)}`;
        
        document.getElementById('modalMarketCap').textContent = formatters.currency(coin.market_cap);
        document.getElementById('modal24hVolume').textContent = formatters.currency(coin.total_volume);
        document.getElementById('modalCirculatingSupply').textContent = 
            `${formatters.number(coin.circulating_supply)} ${coin.symbol.toUpperCase()}`;
        document.getElementById('modalMaxSupply').textContent = 
            coin.max_supply ? `${formatters.number(coin.max_supply)} ${coin.symbol.toUpperCase()}` : 'Unlimited';
    }
}; 
# Krypto Market

A real-time cryptocurrency market tracker with live price updates, order book visualization, and TradingView chart integration.

## Features

- Real-time cryptocurrency price updates using CoinCap API
- Live order book display
- Recent trades tracking
- Interactive TradingView charts with multiple cryptocurrency pairs
- Dark theme UI optimized for trading
- Support for multiple major cryptocurrencies:
  - Bitcoin (BTC)
  - Ethereum (ETH)
  - Ripple (XRP)
  - Litecoin (LTC)
  - Bitcoin Cash (BCH)
  - Cardano (ADA)
  - Polkadot (DOT)
  - Solana (SOL)

## Technology Stack

- Frontend: HTML5, JavaScript (ES6+), CSS3
- Real-time Data: CoinCap WebSocket API
- Charting: TradingView Widget API
- Styling: Bootstrap 5
- Build Tools: Webpack

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/tvictori/kryptomarket.git
   cd kryptomarket
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run watch
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
kryptomarket/
├── js/
│   ├── app.js                 # Main application entry point
│   ├── api.js                 # API configuration and helpers
│   ├── components.js          # UI components
│   ├── utils.js              # Utility functions
│   └── services/
│       └── coincap-service.js # CoinCap API integration
├── index.html                 # Main HTML file
├── package.json              # Project dependencies and scripts
└── webpack.config.js         # Webpack configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
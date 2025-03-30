# Krypto Market

A real-time cryptocurrency market tracker with live price updates, order book visualization, and TradingView chart integration.

## Features

- Real-time cryptocurrency price updates using CoinCap API
- Live order book display
- Recent trades tracking
- Interactive TradingView charts with multiple cryptocurrency pairs:
  - Bitcoin (BTC)
  - Ethereum (ETH)
  - Ripple (XRP)
  - Litecoin (LTC)
  - Bitcoin Cash (BCH)
  - Cardano (ADA)
  - Polkadot (DOT)
  - Solana (SOL)
- Dark theme UI optimized for trading

## Technology Stack

- HTML5, JavaScript (ES6+), CSS3
- CoinCap WebSocket API for real-time data
- TradingView Widget API for charts
- Bootstrap 5 for styling

## Project Structure

```
kryptomarket/
├── index.html          # Main HTML file
├── js/
│   ├── app.js         # Main application logic
│   ├── api.js         # API configuration
│   ├── components.js  # UI components
│   ├── utils.js       # Utility functions
│   └── services/
│       └── coincap-service.js  # CoinCap API integration
└── images/            # Image assets
```

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/tvictori/kryptomarket.git
   ```

2. Deploy to Apache/Wamp Server:
   - Copy the project directory to your Apache web root (e.g., `C:\wamp64\www\` or `/var/www/html/`)
   - Access the site through `http://localhost/kryptomarket/`

## Development

The project uses vanilla JavaScript with ES6 modules. No build tools or dependencies are required.

Key files:
- `app.js`: Main application entry point
- `coincap-service.js`: Handles real-time data from CoinCap
- `components.js`: UI component rendering
- `utils.js`: Helper functions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
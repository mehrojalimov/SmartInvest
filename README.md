# SmartInvest - Portfolio Tracker

A modern investment portfolio tracking application built with React, TypeScript, and Node.js. Features real-time stock data from Alpha Vantage API and a beautiful, responsive UI.

## Features

- 🔐 User authentication (login/signup)
- 📊 Real-time stock data from Alpha Vantage API
- 💼 Portfolio management (buy/sell stocks)
- 📈 Interactive performance charts
- 🎨 Modern, responsive UI with dark/light theme support
- 🔄 Real-time data updates

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Radix UI components
- React Query for data fetching
- Recharts for data visualization

### Backend
- Node.js with Express
- PostgreSQL database
- Alpha Vantage API integration
- Argon2 for password hashing
- Cookie-based authentication

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd SmartInvest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   ```bash
   # For local development
   npm run setup:local
   
   # For production (Fly.io)
   npm run setup
   ```

4. **Configure environment variables:**
   Create an `env.json` file in the root directory:
   ```json
   {
     "user": "your_db_username",
     "host": "localhost",
     "database": "smartinvest",
     "password": "your_db_password",
     "port": 5432
   }
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   npm run start:local
   ```
   The API server will run on `http://localhost:3000`

2. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The React app will run on `http://localhost:3001`

3. **Access the application:**
   Open your browser and go to `http://localhost:3001`

### Production Deployment

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/create` - Create new user account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/stock/:symbol` - Get stock data from Alpha Vantage
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/transaction` - Add buy/sell transaction
- `GET /api/portfolio/history` - Get portfolio history
- `POST /api/portfolio/history` - Save portfolio history

## Database Schema

The application uses the following main tables:
- `users` - User accounts
- `stocks` - Stock information
- `portfolio` - User portfolio holdings
- `transactions` - Buy/sell transactions
- `portfolio_history` - Portfolio value history

## Alpha Vantage API

The application uses Alpha Vantage API for real-time stock data. The API key is configured in the service file and is publicly accessible as requested.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

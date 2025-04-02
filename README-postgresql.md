# PostgreSQL Setup for TrendDrop

This document outlines the steps to set up and use PostgreSQL with the TrendDrop application.

## Prerequisites

- PostgreSQL 14 or higher
- Node.js 16 or higher
- npm 7 or higher

## Installation Steps

1. **Install PostgreSQL**

   ```bash
   brew install postgresql@14
   ```

2. **Start PostgreSQL Service**

   ```bash
   brew services start postgresql@14
   ```

3. **Create PostgreSQL Database**

   ```bash
   createdb trenddrop
   ```

4. **Initialize Database Schema**

   Use the provided script to initialize the database schema:

   ```bash
   node --experimental-modules db-setup.js
   ```

   This script will:
   - Drop existing tables if they exist
   - Create new tables with proper schema
   - Seed the database with sample data

## Configuration

1. **Environment Variables**

   Update your `.env` file with the following configuration:

   ```
   # Database configuration
   DATABASE_URL=postgres://username@localhost:5432/trenddrop
   USE_SQLITE=false

   # Application Configuration
   PORT=5001
   NODE_ENV=development
   ```

   Note: Replace `username` with your system username.

2. **Starting the Application**

   Use the provided script to start the application with PostgreSQL:

   ```bash
   ./start-pg.sh
   ```

   This script sets the necessary environment variables and starts the server.

## Troubleshooting

- **Port Conflicts**: The default port (5000) might be in use by other applications on macOS. The script uses port 5001 instead.
- **Connection Issues**: Make sure PostgreSQL service is running using `brew services list`
- **Database Errors**: Run the `db-setup.js` script again to reset the database

## Database Structure

The application uses the following tables:

- `products`: Main product information
- `trends`: Historical trend data for products
- `regions`: Geographic distribution data for products
- `videos`: Related marketing videos for products
- `users`: User accounts for the application 
# TrendDrop - Client

The TrendDrop client is a React-based frontend application that provides a powerful interface for analyzing trending dropshipping products, geographic trends, and marketing videos.

## Architecture

### Tech Stack

- **React**: UI library for building component-based interfaces
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **TanStack Query**: Data fetching and state management
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Wouter**: Lightweight routing library
- **Recharts**: Charting library for data visualization
- **WebSockets**: Real-time communication with the server
- **shadcn/ui**: Component library for consistent UI elements

### Key Components

The client application is organized around several core features:

#### Dashboard

The main dashboard provides a comprehensive overview of trending products, metrics, and insights. Key components include:

- `MetricsSummary`: Displays key performance indicators like total products, average trend scores, top regions, and viral videos
- `ProductDashboard`: Grid view of trending products with filtering options
- `FilterBar`: Interface for filtering products by trend score, category, and region
- `ProductDetail`: Detailed view of individual product metrics and related data

#### Product Research

The product research functionality helps discover and analyze trending products:

- `TrendScoreRing`: Visual representation of a product's trend score
- `TrendChart`: Historical trend data visualization
- `GeographicMap`: Geographic distribution of product popularity
- `VideoCard`: Display of marketing videos related to products

#### Real-time Updates

The application uses WebSockets to receive real-time updates from the server:

- `useWebSocket`: Custom hook for WebSocket communication
- The dashboard updates in real-time when new products are discovered or data changes

## Data Models

The client interfaces with several key data models that reflect the database schema:

### Product

```typescript
export interface Product {
  id: number;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  trendScore: number;
  engagementRate: number;
  salesVelocity: number;
  searchVolume: number;
  geographicSpread: number;
  aliexpressUrl?: string;
  cjdropshippingUrl?: string;
  imageUrl?: string;
  sourcePlatform?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Trend

Represents historical trend data for a product:

```typescript
export interface Trend {
  id: number;
  productId: number;
  date: string;
  engagementValue: number;
  salesValue: number;
  searchValue: number;
}
```

### Region

Geographic distribution data for a product:

```typescript
export interface Region {
  id: number;
  productId: number;
  country: string;
  percentage: number;
}
```

### Video

Marketing videos related to a product:

```typescript
export interface Video {
  id: number;
  productId: number;
  title: string;
  platform: string;
  views: number;
  uploadDate: string;
  thumbnailUrl: string;
  videoUrl: string;
}
```

### Dashboard Summary

Aggregated metrics for the dashboard:

```typescript
export interface DashboardSummary {
  trendingProductsCount: number;
  averageTrendScore: number;
  topRegion: string;
  topRegionPercentage: number;
  viralVideosCount: number;
  newVideosToday: number;
}
```

## Folder Structure

```
client/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base UI components from shadcn/ui
│   │   └── ...          # Custom application components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and constants
│   ├── pages/           # Page components for each route
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
└── ...                  # Configuration files
```

## Application Flow

1. **Initialization**: The application starts with a loading state while checking backend connectivity
2. **WebSocket Connection**: Establishes a WebSocket connection to receive real-time updates
3. **Data Loading**: Loads initial data from the API endpoints
4. **Real-time Updates**: Listens for WebSocket events to update UI in real-time
5. **User Interaction**: Allows filtering, selecting, and analyzing trending products

## API Integration

The client communicates with the server through several endpoints:

- `GET /api/dashboard`: Retrieves summary metrics
- `GET /api/products`: Lists products with optional filtering
- `GET /api/products/:id`: Gets detailed information about a specific product
- `GET /api/categories`: Lists all product categories
- `GET /api/regions`: Lists all regions with product data
- `GET /api/export`: Exports product data as CSV
- `WebSocket`: Real-time connection for updates

## Setup and Usage

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The application will be available at http://localhost:5000

### Building for Production

1. Create a production build:
   ```bash
   npm run build
   ```

2. The compiled output will be in the `dist` directory

## Customization

### Theme

The application supports light and dark modes, which can be customized in the `theme.json` file and through the theme provider in `src/components/ui/theme-provider.tsx`.

### Components

All UI components are based on the shadcn/ui library and can be customized by modifying the components in the `src/components/ui` directory.

### Configuration

Application settings can be found in:
- `src/lib/constants.ts`: Contains application constants
- `src/lib/queryClient.ts`: Configures the query client for data fetching

## Troubleshooting

### Connection Issues

If the application displays a connection error:

1. Ensure the server is running
2. Check that the WebSocket connection is established
3. Verify that the database has been initialized properly

### Loading State

The application shows different loading states based on the connection status:

- **Connecting**: Attempting to connect to the database
- **Initializing**: Database is connected, but the application is still initializing
- **Error**: Failed to connect to the database

## Additional Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

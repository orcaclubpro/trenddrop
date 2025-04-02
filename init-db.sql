-- Initialize PostgreSQL database schema for TrendDrop application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  price_range_low REAL NOT NULL,
  price_range_high REAL NOT NULL,
  trend_score INTEGER NOT NULL,
  engagement_rate INTEGER NOT NULL,
  sales_velocity INTEGER NOT NULL,
  search_volume INTEGER NOT NULL,
  geographic_spread INTEGER NOT NULL,
  aliexpress_url TEXT,
  cjdropshipping_url TEXT,
  image_url TEXT,
  source_platform TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trends table
CREATE TABLE IF NOT EXISTS trends (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  date TIMESTAMP NOT NULL,
  engagement_value INTEGER NOT NULL,
  sales_value INTEGER NOT NULL,
  search_value INTEGER NOT NULL
);

-- Regions table
CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  country TEXT NOT NULL,
  percentage INTEGER NOT NULL
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  views INTEGER NOT NULL,
  upload_date TIMESTAMP NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL
);

-- Sample data
-- Sample product 1
INSERT INTO products (name, category, subcategory, description, price_range_low, price_range_high, trend_score, engagement_rate, sales_velocity, search_volume, geographic_spread, aliexpress_url, cjdropshipping_url, image_url, source_platform)
VALUES ('Portable USB LED Light', 'Tech', 'Gadgets', 'A flexible USB LED light for laptops and power banks', 5.99, 14.99, 85, 76, 60, 68, 6, 'https://aliexpress.com/item/1001', 'https://cjdropshipping.com/product/1001', 'https://picsum.photos/seed/1001/400/400', 'AliExpress');

-- Sample product 2
INSERT INTO products (name, category, subcategory, description, price_range_low, price_range_high, trend_score, engagement_rate, sales_velocity, search_volume, geographic_spread, aliexpress_url, cjdropshipping_url, image_url, source_platform)
VALUES ('Silicone Cooking Utensil Set', 'Home', 'Kitchen', 'Heat-resistant silicone cooking utensils with wooden handles', 15.99, 29.99, 78, 70, 55, 62, 4, 'https://aliexpress.com/item/1002', 'https://cjdropshipping.com/product/1002', 'https://picsum.photos/seed/1002/400/400', 'CJ Dropshipping');

-- Sample product 3
INSERT INTO products (name, category, subcategory, description, price_range_low, price_range_high, trend_score, engagement_rate, sales_velocity, search_volume, geographic_spread, aliexpress_url, cjdropshipping_url, image_url, source_platform)
VALUES ('Collapsible Water Bottle', 'Fitness', 'Equipment', 'Eco-friendly silicone collapsible water bottle for travel', 9.99, 19.99, 92, 83, 64, 74, 8, 'https://aliexpress.com/item/1003', 'https://cjdropshipping.com/product/1003', 'https://picsum.photos/seed/1003/400/400', 'AliExpress');

-- Sample trend data for Product 1
INSERT INTO trends (product_id, date, engagement_value, sales_value, search_value)
VALUES 
(1, CURRENT_DATE - INTERVAL '30 days', 10, 5, 8),
(1, CURRENT_DATE - INTERVAL '20 days', 20, 10, 16),
(1, CURRENT_DATE - INTERVAL '10 days', 40, 20, 32),
(1, CURRENT_DATE, 80, 40, 64);

-- Sample region data for Product 1
INSERT INTO regions (product_id, country, percentage)
VALUES 
(1, 'USA', 40),
(1, 'UK', 25),
(1, 'Canada', 20),
(1, 'Australia', 15);

-- Sample video data for Product 1
INSERT INTO videos (product_id, title, platform, views, upload_date, thumbnail_url, video_url)
VALUES 
(1, 'Amazing USB Light Review', 'YouTube', 125000, CURRENT_DATE - INTERVAL '15 days', 'https://picsum.photos/seed/vid1/400/300', 'https://example.com/youtube/video/1001'),
(1, 'USB Light Unboxing', 'TikTok', 350000, CURRENT_DATE - INTERVAL '5 days', 'https://picsum.photos/seed/vid2/400/300', 'https://example.com/tiktok/video/1002'); 
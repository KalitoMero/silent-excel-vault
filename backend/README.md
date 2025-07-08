# Scan Orders Backend API

Express.js backend API server for the scan orders application with PostgreSQL database.

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
1. Create a PostgreSQL database
2. Copy `.env.example` to `.env` and configure your database connection:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=scan_orders_db
PORT=3002
NODE_ENV=development
```

### 3. Initialize Database Schema
```bash
npm run init-db
```

### 4. Start the Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3002`

## API Endpoints

### Excel Data
- `POST /api/excel-import` - Import Excel data
- `GET /api/excel-data` - Get latest Excel data

### Orders
- `POST /api/scan-orders` - Create new scan order
- `GET /api/orders` - Get all orders
- `POST /api/complete-order` - Mark order as completed

### Settings
- `GET /api/excel-settings` - Get Excel settings
- `POST /api/excel-settings` - Save Excel settings
- `GET /api/column-settings` - Get column settings
- `POST /api/column-settings` - Save column settings

### Media
- `POST /api/media` - Upload/save media files
- `GET /api/media` - Get all media
- `GET /api/media/:auftragsnummer` - Get media by order number

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `DELETE /api/departments/:id` - Delete department

### Additional Infos
- `GET /api/additional-infos` - Get all additional infos
- `POST /api/additional-infos` - Create additional info
- `DELETE /api/additional-infos/:id` - Delete additional info

## Project Structure
```
backend/
├── config/
│   ├── database.js     # Database connection
│   └── logger.js       # Winston logger setup
├── routes/
│   ├── excel.js        # Excel data routes
│   ├── orders.js       # Order management routes
│   ├── settings.js     # Settings routes
│   ├── media.js        # Media upload routes
│   ├── departments.js  # Department routes
│   └── additionalInfos.js # Additional info routes
├── scripts/
│   └── init-database.js # Database initialization
├── uploads/            # File upload directory
├── server.js          # Main server file
├── package.json
└── README.md
```

## Features
- ✅ Complete REST API for all frontend functionality
- ✅ PostgreSQL database with proper schema
- ✅ File upload support for Excel and media files
- ✅ Comprehensive error handling and logging
- ✅ CORS configuration for frontend
- ✅ Rate limiting and security middleware
- ✅ Automatic timestamp updates with triggers
- ✅ Database indexes for performance
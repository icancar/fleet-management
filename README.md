# Fleet Management System

A comprehensive fleet management web application built with React frontend and Node.js backend, featuring vehicle tracking, driver management, trip planning, maintenance scheduling, and fuel monitoring.

## 🚀 Features

- **Vehicle Management**: Track fleet vehicles with detailed information
- **Driver Management**: Manage driver profiles and assignments
- **Trip Planning**: Plan and track vehicle trips with real-time updates
- **Maintenance Scheduling**: Schedule and track vehicle maintenance
- **Fuel Monitoring**: Monitor fuel consumption and costs
- **Real-time Dashboard**: Comprehensive overview of fleet operations
- **Reporting**: Generate detailed reports and analytics
- **Mobile Tracking**: Android app with background location service
- **Real-time Location**: GPS tracking every 10 seconds
- **Responsive Design**: Mobile-friendly interface

## 🏗️ Architecture

This project follows a monorepo structure with shared types and utilities:

```
fleet-management/
├── client/                 # React frontend (Vite + TypeScript)
├── server/                 # Node.js backend (Express + TypeScript)
├── shared/                 # Shared types and utilities
├── android/                # Android mobile app (Kotlin)
├── docs/                   # Documentation
└── scripts/                # Build and deployment scripts
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Query for data fetching
- Recharts for data visualization

**Backend:**
- Node.js with Express
- TypeScript for type safety
- SQLite database with Knex.js
- JWT authentication
- Express validation middleware

**Mobile:**
- Android native app with Kotlin
- Google Play Services for location
- Background service for continuous tracking
- Retrofit for API communication

**Shared:**
- TypeScript interfaces and types
- Utility functions
- Common constants

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fleet-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your configuration
   ```

4. **Build shared package**
   ```bash
   npm run build:shared
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the backend (port 3001) and frontend (port 3000) in development mode.

## 📁 Project Structure

### Backend (`/server`)

```
server/
├── src/
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API endpoints
│   ├── middleware/        # Custom middleware
│   ├── database/          # Database configuration
│   └── utils/             # Utility functions
├── package.json
└── tsconfig.json
```

### Frontend (`/client`)

```
client/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service functions
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript type definitions
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### Shared (`/shared`)

```
shared/
├── src/
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Common utility functions
├── package.json
└── tsconfig.json
```

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier

### Backend (`/server`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

### Frontend (`/client`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Drivers
- `GET /api/drivers` - Get all drivers
- `GET /api/drivers/:id` - Get driver by ID
- `POST /api/drivers` - Create new driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Trips
- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create new trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Maintenance
- `GET /api/maintenance` - Get all maintenance records
- `GET /api/maintenance/:id` - Get maintenance record by ID
- `POST /api/maintenance` - Create new maintenance record
- `PUT /api/maintenance/:id` - Update maintenance record
- `DELETE /api/maintenance/:id` - Delete maintenance record

### Fuel
- `GET /api/fuel` - Get all fuel records
- `GET /api/fuel/:id` - Get fuel record by ID
- `POST /api/fuel` - Create new fuel record
- `PUT /api/fuel/:id` - Update fuel record
- `DELETE /api/fuel/:id` - Delete fuel record

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
DATABASE_URL=./fleet.db
```

### Database

The application uses SQLite by default. Database migrations and seeding scripts are available:

```bash
# Run migrations
npm run migrate

# Seed with sample data
npm run seed
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Deployment

### Production Build

```bash
# Build all packages
npm run build

# Start production server
npm start
```

### Docker (Optional)

Docker configuration files are provided for containerized deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🔮 Roadmap

- [ ] Real-time GPS tracking
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with external APIs
- [ ] Multi-tenant support
- [ ] Advanced user permissions
- [ ] Automated maintenance alerts
- [ ] Fuel price integration
- [ ] Driver performance metrics
- [ ] Route optimization

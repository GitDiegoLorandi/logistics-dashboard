# Logistics Dashboard

A modern logistics management system with real-time tracking, analytics, and delivery management.

## Project Overview

The Logistics Dashboard is a comprehensive logistics management system designed to help businesses track deliveries, manage deliverers, and gain insights through real-time analytics. The application provides role-based access control, allowing administrators and regular users to access features relevant to their roles.

### Core Functionality

- **Delivery Management**: Create, track, and update delivery orders through their entire lifecycle
- **Deliverer Management**: Assign deliverers to orders, track performance metrics
- **Real-time Statistics**: Visualize delivery trends, status distributions, and performance data
- **Background Jobs**: Automated tasks for monitoring system health, checking overdue deliveries, and data cleanup
- **Notification System**: Alert users about important events and status changes
- **User Management**: Comprehensive user administration with role-based permissions

## Features

- 📊 Real-time delivery tracking and analytics
- 🚚 Deliverer management and assignment
- 📱 Responsive design for all devices
- 🔐 Role-based access control (Admin and User roles)
- 🌐 Internationalization support (English and Portuguese)
- 📈 Interactive charts and data visualization
- 🔍 Advanced search and filtering capabilities
- ⌨️ Command palette for quick navigation
- 🎨 Customizable themes (light/dark mode)
- 🧩 Component library with Storybook documentation
- 🔄 Background jobs for system maintenance
- 📋 Comprehensive API documentation with Swagger

## Tech Stack

### Frontend
- **React 18**: Core UI library
- **React Router 6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js & React-Chartjs-2**: Data visualization
- **@tanstack/react-table**: Table management and display
- **React Joyride**: User onboarding tours
- **i18next**: Internationalization framework
- **Lucide React**: Modern icon library
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Framer Motion**: Animation library
- **Zod**: Schema validation
- **Storybook**: Component documentation and testing
- **React Toastify**: Toast notifications
- **date-fns**: Date utility library
- **clsx & tailwind-merge**: Class name utilities

### Backend
- **Node.js**: JavaScript runtime
- **Express 4**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication with JSON Web Tokens
- **bcrypt**: Password hashing
- **node-cron**: Scheduled tasks
- **socket.io**: Real-time bidirectional event-based communication
- **express-validator**: Request validation
- **Joi**: Data validation
- **Swagger**: API documentation
- **Jest**: Testing framework
- **Helmet**: Security middleware
- **Morgan**: HTTP request logger
- **express-rate-limit**: Rate limiting middleware
- **express-mongo-sanitize**: NoSQL injection prevention

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate user

### Users
- `GET /api/users`: Get all users (Admin only)
- `GET /api/users/:id`: Get a specific user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user (Admin only)

### Deliveries
- `GET /api/deliveries`: Get all deliveries
- `GET /api/deliveries/:id`: Get a specific delivery
- `POST /api/deliveries`: Create a new delivery
- `PUT /api/deliveries/:id`: Update a delivery (Admin only)
- `DELETE /api/deliveries/:id`: Delete a delivery (Admin only)
- `PUT /api/deliveries/:id/assign`: Assign a deliverer to a delivery
- `GET /api/deliveries/available`: Get available (unassigned) deliveries

### Deliverers
- `GET /api/deliverers`: Get all deliverers
- `GET /api/deliverers/:id`: Get a specific deliverer
- `POST /api/deliverers`: Create a new deliverer
- `PUT /api/deliverers/:id`: Update a deliverer
- `DELETE /api/deliverers/:id`: Delete a deliverer

### Statistics
- `GET /api/statistics/overall`: Get overall statistics
- `GET /api/statistics/status`: Get deliveries by status
- `GET /api/statistics/date-range`: Get deliveries by date range
- `GET /api/statistics/deliverers`: Get deliverer performance (Admin only)
- `GET /api/statistics/trends`: Get delivery trends for last 30 days
- `GET /api/statistics/priority`: Get priority-based statistics

### Background Jobs
- `GET /api/jobs/status`: Get status of all jobs (Admin only)
- `GET /api/jobs/health`: Get system health status
- `GET /api/jobs/performance`: Get performance metrics (Admin only)
- `GET /api/jobs/dashboard`: Get comprehensive job dashboard (Admin only)
- `POST /api/jobs/run/:jobName`: Manually trigger a job (Admin only)
- `POST /api/jobs/start`: Start all background jobs (Admin only)
- `POST /api/jobs/stop`: Stop all background jobs (Admin only)

## System Architecture

The application follows a feature-slice architecture with clear separation of concerns:

### Frontend Structure
```
frontend/
  ├── src/
  │   ├── components/       # Reusable UI components
  │   │   ├── Dashboard/    # Dashboard components
  │   │   ├── Deliverers/   # Deliverer management components
  │   │   ├── Deliveries/   # Delivery management components
  │   │   ├── Layout/       # Layout components
  │   │   ├── UI/           # Base UI primitives
  │   │   └── Users/        # User management components
  │   ├── contexts/         # React contexts
  │   ├── hooks/            # Custom React hooks
  │   ├── i18n/             # Internationalization
  │   ├── lib/              # Utility functions
  │   ├── services/         # API services
  │   └── styles/           # Global styles
```

### Backend Structure
```
backend/
  ├── src/
  │   ├── config/           # Application configuration
  │   ├── controllers/      # Request handlers
  │   ├── data/             # Static data files
  │   ├── jobs/             # Background jobs
  │   ├── middleware/       # Express middleware
  │   ├── models/           # Mongoose models
  │   ├── routes/           # API routes
  │   └── scripts/          # Utility scripts
```

## Background Jobs

The system includes several automated jobs:

1. **Health Check**: Monitors system health and services
2. **Overdue Delivery Check**: Flags and notifies about overdue deliveries
3. **Performance Monitoring**: Collects and analyzes system performance metrics
4. **Notifications Processing**: Handles sending and tracking notifications
5. **Data Cleanup**: Performs routine database maintenance

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB 4.4+

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/logistics-dashboard.git
cd logistics-dashboard
```

2. Install dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables
```bash
# In the backend directory
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development servers
```bash
# Start backend server
cd backend
npm run dev

# In another terminal, start frontend server
cd frontend
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

6. Seed the database with initial data (optional)
```bash
cd backend
npm run seed
```

## Development

### Available Scripts

#### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run storybook` - Start Storybook server
- `npm run build-storybook` - Build Storybook

#### Backend
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed the database
- `npm run migrate` - Run migrations

### Code Quality

This project uses:
- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks
- lint-staged for running linters on staged files
- GitHub Actions for CI/CD

## Security Features

- JWT authentication with configurable expiration
- Password hashing with bcrypt
- Rate limiting for authentication endpoints
- HTTP security headers with Helmet
- NoSQL injection prevention
- CORS configuration
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
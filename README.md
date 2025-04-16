# Neptune Holidays Backend API

A Node.js backend API for Neptune Holidays using Express and PostgreSQL with Sequelize ORM.

## Features

- Express.js framework
- PostgreSQL database with Sequelize ORM
- JWT authentication
- Role-based authorization
- Error handling middleware
- CORS support
- Security with Helmet
- Environment configuration
- MVC architecture

## Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── services/        # Business logic
│   ├── database/        # Database setup and migrations
│   ├── public/          # Static files
│   │   ├── uploads/     # File uploads
│   │   └── assets/      # Public assets
│   ├── views/           # View templates (if needed)
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── .env                 # Environment variables
├── .env.example         # Example environment file
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/neptune-holidays-backend.git
cd neptune-holidays-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy the example environment file and modify it with your own settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL database credentials.

### 4. Setup the database

Create a PostgreSQL database named `neptune_holidays`.

### 5. Run the server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login with credentials
- `GET /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user information

## License

ISC 
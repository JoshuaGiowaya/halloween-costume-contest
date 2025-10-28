const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./utils/db');
dotenv.config(); // Load environment variables from .env file

// Import custom middleware
const { errorHandler } = require('./middleware/errorMiddleware');
const apiKeyMiddleware = require('./middleware/apiKeyMiddleware');

const app = express();

// Set NODE_ENV to development if not specified
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Set default for disable join when voting starts
process.env.DISABLE_JOIN_WHEN_VOTING_STARTS = process.env.DISABLE_JOIN_WHEN_VOTING_STARTS || 'false';

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:3000'], // Default to localhost:3000 for development
    credentials: true, // This allows the browser to send cookies with the requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};
app.use(cors(corsOptions));


// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(helmet()); // Set security-related HTTP headers
app.use(morgan('common')); // Logging HTTP requests


// Connect to MongoDB
connectDB();

// Import routes
const contestRoutes = require('./routes/contestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const photoRoutes = require('./routes/photoRoutes');
const voteRoutes = require('./routes/voteRoutes');

// Use routes
app.use('/api/contests', contestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/votes', voteRoutes);

// Error handling middleware
app.use(errorHandler); // Custom error handler

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

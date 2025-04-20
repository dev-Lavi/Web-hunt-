import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; 
import rateLimit from 'express-rate-limit'; 

import connectDB from './config/db.js'; 
import quizRoutes from './routes/quiz.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1); // Trust the first proxy for rate limiting

// Middleware
app.use(helmet()); // Helmet for security
app.use(cors()); // Enable CORS
app.use(express.json()); // For parsing JSON request bodies

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 10, // Allow 10 requests in 2 minutes
  message: 'Too many requests from this IP, please try again after a while.'
});
app.use(limiter);

// Connect to the database
connectDB()
  .then(() => {
    // Only start the server once DB is connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit process with failure
  });

// Routes
app.use('/api/quiz', quizRoutes);

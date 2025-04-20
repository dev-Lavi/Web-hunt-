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

app.use(helmet());
app.use(cors());
app.use(express.json());


const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, 
  max: 10,
  message: 'Too many requests from this IP, please try again after a while.'
});
app.use(limiter);

connectDB();


app.use('/api/quiz', quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from 'express'; 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; 
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

import connectDB from './config/db.js'; 
import quizRoutes from './routes/quiz.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1); 

app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, 
  max: 10, 
  message: 'Too many requests from this IP, please try again after a while.'
});
app.use(limiter);


app.get('/ping', (req, res) => {
  res.send('pong');
});


app.use('/api/quiz', quizRoutes);


connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      // Keep-alive cron job (every 5 mins)
      const SELF_URL = `https://${process.env.RENDER_EXTERNAL_URL || 'your-render-app.onrender.com'}/ping`;

      cron.schedule('*/5 * * * *', async () => {
        try {
          const res = await fetch(SELF_URL);
          console.log(`Keep-alive ping sent: ${res.status}`);
        } catch (err) {
          console.error('Keep-alive ping failed:', err.message);
        }
      });

    });
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
    process.exit(1); 
  });

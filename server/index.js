const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mangaRoutes = require('./routes/manga');
const translationRoutes = require('./routes/translation');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-username.github.io'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/manga', mangaRoutes);
app.use('/api/translation', translationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

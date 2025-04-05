const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Eskode3 Server is running! Available endpoints: /api/status');
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

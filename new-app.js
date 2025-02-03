const express = require('express');
const app = express();
const path = require('path');

// Middleware to parse JSON request bodies
app.use(express.json());

// A simple route to check if the server is running
app.get('/', (req, res) => {
  console.log('Root route accessed!');
  res.send('Server is running!');
});

// Example of an API endpoint
app.post('/api/data', (req, res) => {
  console.log('Data received:', req.body);
  res.status(200).send({ message: 'Data received successfully' });
});

// Static files (if you need to serve any static assets like images or HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware (for uncaught errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

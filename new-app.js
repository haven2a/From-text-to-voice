const express = require('express');
const app = express();
const path = require('path');

// Middleware to parse request bodies
app.use(express.json());

// A simple route to check if the server is running
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Example of an API endpoint
app.post('/api/data', (req, res) => {
  console.log(req.body);
  res.status(200).send({ message: 'Data received successfully' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

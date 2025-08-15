const express = require('express');

const app = express();
const api = express.Router();

console.log('Setting up routes...');
api.get('/health', (req, res) => res.json({ health: 'ok' }));
api.get('/test', (req, res) => res.json({ test: 'working' }));

console.log('Mounting router...');
app.use('/api/v1', api);

const PORT = 3001;
console.log(`Starting server on port ${PORT}...`);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
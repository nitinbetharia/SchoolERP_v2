import express from 'express';

const app = express();
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'TypeScript Express working' });
});

app.use('/api/v1', router);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Minimal TypeScript server on http://localhost:${PORT}`);
});
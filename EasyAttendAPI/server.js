const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sessionsRouter = require('./routes/sessions');

const app = express();

app.use(cors({
  origin: true, // allow all origins (localhost:5173, 5174, mobile, etc.)
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('EasyAttend API is running');
});

app.use('/api', sessionsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`EasyAttend API running on http://localhost:${PORT}`);
});
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['*'] }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  return res.json({ message: 'Hello world!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`);
});

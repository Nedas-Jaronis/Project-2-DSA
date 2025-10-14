import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); // allows JSON body parsing

// Example in-memory storage
let addedSongs = [];

// Endpoint to receive searches from frontend
app.post('/api/add-song', (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: 'Song is required' });

  addedSongs.push(song);
  console.log('Added:', song);
  res.json({ success: true, addedSongs });
});

// Endpoint to get current songs
app.get('/api/songs', (req, res) => {
  res.json(addedSongs);
});

app.listen(5000, () => console.log('Backend running on port 5000'));


import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());


let addedSongs = [];


app.post('/api/add-song', (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: 'Song is required' });

  addedSongs.push(song);
  console.log('Added:', song);
  res.json({ success: true, addedSongs });
});


app.get('/api/songs', (req, res) => {
  res.json(addedSongs);
});

app.post('/reset', (req, res)=> {
    addedSongs = [];
    res.json({ message: 'Songs cleared' });
});

app.listen(5000, () => console.log('Backend running on port 5000'));


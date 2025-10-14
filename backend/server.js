import express from 'express';
import cors from 'cors';
import fs from 'fs';
import csv from 'csv-parser';

const app = express();
app.use(cors());
app.use(express.json());

let addedSongs = [];
let validSongs = new Set(); // ✅ store all valid song names

console.log('Loading dataset...');
fs.createReadStream('./data/tracks.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.name) validSongs.add(row.name.toLowerCase());
  })
  .on('end', () => {
    console.log(`✅ Loaded ${validSongs.size} songs from dataset`);
  });

// --- Add song endpoint ---
app.post('/api/add-song', (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: 'Song is required' });

  const songName = song.toLowerCase().trim();

  // ✅ Validate song against dataset
  if (!validSongs.has(songName)) {
    return res.status(404).json({ error: 'Song not found in dataset' });
  }

  addedSongs.push(song);
  console.log('Added:', song);
  res.json({ success: true, addedSongs });
});

// --- Get all added songs ---
app.get('/api/songs', (req, res) => {
  res.json(addedSongs);
});

// --- Reset songs ---
app.post('/reset', (req, res) => {
  addedSongs = [];
  res.json({ message: 'Songs cleared' });
});

app.listen(5000, () => console.log('✅ Backend running on port 5000'));

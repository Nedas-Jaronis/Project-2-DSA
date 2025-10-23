import express from "express";
import cors from "cors";
import fs from "fs";
import csv from "csv-parser";

const app = express();
app.use(cors());
app.use(express.json());

let validSongs = new Set();
let addedSongs = [];

// ✅ Load valid songs from CSV
fs.createReadStream("data/song_names.csv")
  .pipe(csv())
  .on("data", (row) => {
    if (row.name) validSongs.add(row.name.toLowerCase());
  })
  .on("end", () => {
    console.log(`✅ Loaded ${validSongs.size} songs from dataset`);
  });

// ✅ Add song
app.post("/api/add-song", (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: "Song is required" });

  if (!validSongs.has(song.toLowerCase())) {
    return res.status(400).json({ error: "Song not found in dataset" });
  }

  addedSongs.push(song);
  res.json({ success: true, addedSongs });
});

// ✅ Get all added songs
app.get("/api/songs", (req, res) => res.json(addedSongs));

// ✅ Get suggestions
app.get("/api/suggestions", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  if (!query) return res.json([]);

  const matches = Array.from(validSongs)
    .filter((name) => name.startsWith(query) && name.toLowerCase() !== query)
    .slice(0, 10);

  res.json(matches);
});

// ✅ Reset songs
app.post("/reset", (req, res) => {
  addedSongs = [];
  res.json({ message: "Songs cleared" });
});

// ✅ Delete selected songs
app.post("/api/delete-songs", (req, res) => {
  const { songs } = req.body;
  if (!Array.isArray(songs))
    return res.status(400).json({ error: "Songs array is required" });

  addedSongs = addedSongs.filter((song) => !songs.includes(song));
  res.json({ success: true, addedSongs });
});

// ✅ NEW: Endpoint for Python (or other) to fetch the current songs
app.get("/api/current-songs", (req, res) => {
  res.json({ addedSongs });
});

// ✅ NEW: Optional — allow frontend to POST to this instead of 8000
app.post("/api/receive-songs", (req, res) => {
  const { addedSongs: songs } = req.body;
  if (Array.isArray(songs)) {
    addedSongs = songs;
    console.log("📥 Received updated song list from frontend:", songs);
    return res.json({ success: true });
  } else {
    return res.status(400).json({ error: "Invalid songs array" });
  }
});

app.listen(5000, () => console.log("✅ Backend running on port 5000"));

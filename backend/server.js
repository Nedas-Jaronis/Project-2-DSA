import express from "express";
import cors from "cors";
import fs from "fs";
import csv from "csv-parser";

const app = express();
app.use(cors());
app.use(express.json());


let validSongs = new Set();

fs.createReadStream("data/song_names.csv")
  .pipe(csv())
  .on("data", (row) => {
    if (row.name) validSongs.add(row.name.toLowerCase());
  })
  .on("end", () => {
    console.log(`✅ Loaded ${validSongs.size} songs from dataset`);
  });


let addedSongs = [];


app.post("/api/add-song", (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: "Song is required" });

  if (!validSongs.has(song.toLowerCase())) {
    return res.status(400).json({ error: "Song not found in dataset" });
  }

  addedSongs.push(song);
  res.json({ success: true, addedSongs });
});

// Get added songs
app.get("/api/songs", (req, res) => res.json(addedSongs));

app.get("/api/suggestions", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  if (!query) return res.json([]);

  const matches = Array.from(validSongs)
    .filter(
      (name) =>
        name.startsWith(query) && name.toLowerCase() !== query
    )
    .slice(0, 10);

  res.json(matches);
});

app.post("/reset", (req, res) => {
  addedSongs = [];
  res.json({ message: "Songs cleared" });
});

app.listen(5000, () => console.log("✅ Backend running on port 5000"));

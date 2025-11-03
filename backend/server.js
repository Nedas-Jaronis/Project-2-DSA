import express from "express";
import cors from "cors";
import fs from "fs";
import csv from "csv-parser";

const app = express();
app.use(cors());
app.use(express.json());

let validSongs = new Map(); // songName -> attributes object
let addedSongs = [];

// Load all songs from tracks.csv into memory (only once)
function loadAllSongs() {
  return new Promise((resolve, reject) => {
    const map = new Map();
    fs.createReadStream("data/tracks.csv")
      .pipe(csv())
      .on("data", (row) => {
        if (row.name) {
          map.set(row.name.toLowerCase(), {
            danceability: parseFloat(row.danceability),
            energy: parseFloat(row.energy),
            valence: parseFloat(row.valence),
            tempo: parseFloat(row.tempo),
            popularity: parseFloat(row.popularity),
            loudness: parseFloat(row.loudness),
            acousticness: parseFloat(row.acousticness),
            instrumentalness: parseFloat(row.instrumentalness),
            speechiness: parseFloat(row.speechiness),
            liveness: parseFloat(row.liveness),
          });
        }
      })
      .on("end", () => {
        validSongs = map;
        console.log(`✅ Loaded ${validSongs.size} songs from dataset`);
        resolve();
      })
      .on("error", reject);
  });
}

// Utility to save averages CSV (optional)
function saveAveragesCSV() {
  if (addedSongs.length === 0) {
    fs.writeFileSync(
      "data/averages.csv",
      "danceability,energy,valence,tempo,popularity,loudness,acousticness,instrumentalness,speechiness,liveness\n"
    );
    return;
  }

  const sum = {
    danceability: 0,
    energy: 0,
    valence: 0,
    tempo: 0,
    popularity: 0,
    loudness: 0,
    acousticness: 0,
    instrumentalness: 0,
    speechiness: 0,
    liveness: 0,
  };
  let count = 0;

  addedSongs.forEach((songName) => {
    const attrs = validSongs.get(songName.toLowerCase());
    if (attrs) {
      for (const key in sum) {
        sum[key] += attrs[key];
      }
      count++;
    }
  });

  for (const key in sum) {
    sum[key] /= count;
  }

  const header = Object.keys(sum).join(",");
  const values = Object.values(sum).join(",");
  fs.writeFileSync("data/averages.csv", header + "\n" + values);
  console.log("📊 Saved averages.csv with current playlist averages");
}

// Routes
app.get("/api/songs", (req, res) => res.json(addedSongs));

app.post("/api/add-song", (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: "Song is required" });

  const songLower = song.toLowerCase();
  if (!validSongs.has(songLower))
    return res.status(400).json({ error: "Song not found in dataset" });

  if (addedSongs.some((s) => s.toLowerCase() === songLower))
    return res.status(400).json({ error: "Song already added" });

  addedSongs.push(song);
  saveAveragesCSV();
  res.json({ success: true, addedSongs });
});

app.get("/api/song-attributes", (req, res) => {
  const name = req.query.name?.toString().toLowerCase();
  if (!name || !validSongs.has(name)) {
    return res.status(404).json({ error: "Song not found" });
  }

  res.json({ attributes: validSongs.get(name) });
});

app.get("/api/suggestions", (req, res) => {
  const query = req.query.q?.toString().toLowerCase() || "";
  if (!query) return res.json([]);

  const matches = Array.from(validSongs.keys())
    .filter((name) => name.startsWith(query) && name !== query)
    .slice(0, 10);

  res.json(matches);
});

// **New endpoint**: return average attributes
app.get("/api/averages", (req, res) => {
  if (addedSongs.length === 0) {
    return res.json({
      danceability: 0,
      energy: 0,
      valence: 0,
      tempo: 0,
      acousticness: 0,
      instrumentalness: 0,
      speechiness: 0,
      loudness: 0,
    });
  }

  const sum = {
    danceability: 0,
    energy: 0,
    valence: 0,
    tempo: 0,
    acousticness: 0,
    instrumentalness: 0,
    speechiness: 0,
    loudness: 0,
  };
  let count = 0;

  addedSongs.forEach((songName) => {
    const attrs = validSongs.get(songName.toLowerCase());
    if (attrs) {
      sum.danceability += attrs.danceability;
      sum.energy += attrs.energy;
      sum.valence += attrs.valence;
      sum.tempo += attrs.tempo;
      sum.acousticness += attrs.acousticness;
      sum.instrumentalness += attrs.instrumentalness;
      sum.speechiness += attrs.speechiness;
      sum.loudness += attrs.loudness;
      count++;
    }
  });

  for (const key in sum) {
    sum[key] /= count;
  }

  res.json(sum);
});

app.post("/reset", (req, res) => {
  addedSongs = [];
  fs.writeFileSync(
    "data/averages.csv",
    "danceability,energy,valence,tempo,popularity,loudness,acousticness,instrumentalness,speechiness,liveness\n"
  );
  res.json({ message: "Songs cleared" });
});

app.post("/api/delete-songs", (req, res) => {
  const { songs } = req.body;
  if (!Array.isArray(songs))
    return res.status(400).json({ error: "Songs array is required" });

  addedSongs = addedSongs.filter((song) => !songs.includes(song));
  saveAveragesCSV();
  res.json({ success: true, addedSongs });
});

app.get("/api/current-songs", (req, res) => {
  res.json({ addedSongs });
});

app.post("/api/receive-songs", (req, res) => {
  const { addedSongs: songs } = req.body;
  if (Array.isArray(songs)) {
    addedSongs = songs;
    saveAveragesCSV();
    console.log("📥 Received updated song list from frontend:", songs);
    return res.json({ success: true });
  } else {
    return res.status(400).json({ error: "Invalid songs array" });
  }
});

// Initialize server
loadAllSongs().then(() => {
  app.listen(5000, () => console.log("✅ Backend running on port 5000"));
});

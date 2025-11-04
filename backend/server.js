import express from "express";
import cors from "cors";
import fs from "fs";
import csv from "csv-parser";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

let validSongs = new Map();
let addedSongs = [];

// Load all songs from CSV into memory
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
        console.log(`Loaded ${validSongs.size} songs`);
        resolve();
      })
      .on("error", reject);
  });
}

function saveAveragesCSV() {
  if (addedSongs.length === 0) return;
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
  addedSongs.forEach((song) => {
    const attrs = validSongs.get(song.toLowerCase());
    if (attrs) {
      for (const key in sum) sum[key] += attrs[key];
      count++;
    }
  });

  for (const key in sum) sum[key] /= count;

  const header = Object.keys(sum).join(",");
  const values = Object.values(sum).join(",");
  fs.writeFileSync("data/averages.csv", header + "\n" + values);
}

// Get current playlist
app.get("/api/songs", (req, res) => res.json({ addedSongs }));

// Add song
app.post("/api/add-song", (req, res) => {
  const { song } = req.body;
  if (!song) return res.status(400).json({ error: "Song required" });

  const songLower = song.toLowerCase();
  if (!validSongs.has(songLower)) return res.status(400).json({ error: "Song not found" });
  if (addedSongs.some((s) => s.toLowerCase() === songLower))
    return res.status(400).json({ error: "Song already added" });

  addedSongs.push(song);
  saveAveragesCSV();
  res.json({ success: true, addedSongs });
});

// Delete selected songs
app.post("/api/delete-songs", (req, res) => {
  const { songs } = req.body;
  if (!Array.isArray(songs)) return res.status(400).json({ error: "Songs array required" });

  addedSongs = addedSongs.filter((s) => !songs.includes(s));
  saveAveragesCSV();
  res.json({ success: true, addedSongs });
});

// Get averaged attributes for current playlist
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
  addedSongs.forEach((song) => {
    const attrs = validSongs.get(song.toLowerCase());
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

  for (const key in sum) sum[key] /= count;
  res.json(sum);
});

//endpoint for getting recommendations from c++ executable
app.get("/api/recommendations", async (req, res) => {
  const searchType = req.query.type || "BFS"; 
  const k = parseFloat(req.query.k) || 0.5;

  if (addedSongs.length === 0) {
    return res.json({ recommendations: [] });
  }

  try {
    // Call the C++ executable (from tree.cpp)
    const { stdout, stderr } = await execPromise(`./recommendation ${searchType} ${k}`);
    
    if (stderr) {
      console.error("C++ stderr:", stderr);
    }

    // Parse JSON output from c++ executable
    const recommendations = JSON.parse(stdout.trim());
    
    // Filter out songs that are already in the playlist
    const addedSongsLower = addedSongs.map(s => s.toLowerCase());
    const filtered = recommendations.filter(song => 
      !addedSongsLower.includes(song.toLowerCase())
    );

    res.json({ recommendations: filtered });
  } catch (error) {
    console.error("Error calling C++ recommendation:", error);
    res.status(500).json({ 
      error: "Failed to generate recommendations",
      details: error.message 
    });
  }
});

// Autocomplete suggestions
app.get("/api/suggestions", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  if (!query) return res.json([]);
  const matches = Array.from(validSongs.keys())
    .filter((name) => name.startsWith(query) && name !== query)
    .slice(0, 10);
  res.json(matches);
});

// Reset playlist
app.post("/reset", (req, res) => {
  addedSongs = [];
  fs.writeFileSync("data/averages.csv", "danceability,energy,valence,tempo,popularity,loudness,acousticness,instrumentalness,speechiness,liveness\n");
  res.json({ message: "Songs cleared" });
});

// Initialize server
loadAllSongs().then(() => {
  app.listen(5000, () => console.log("Backend running on port 5000"));
});

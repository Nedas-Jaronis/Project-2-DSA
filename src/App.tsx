import { useState, useEffect, useRef } from 'react';
import './App.css';
import SkillRadar from './skillRadarChart';

interface SongAttributes {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  loudness: number;
}

const sampleData = [
  { subject: "Danceability", value: 0 },
  { subject: "Valence", value: 0 },
  { subject: "Energy", value: 0 },
  { subject: "Tempo", value: 0 },
  { subject: "Acousticness", value: 0 },
  { subject: "Instrumentalness", value: 0 },
  { subject: "Speechiness", value: 0 },
  { subject: "Loudness", value: 0 },
];

function App() {
  const [activeButton, setActiveButton] = useState<'BFS' | 'DFS' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedSongs, setAddedSongs] = useState<string[]>([]);
  const [songAttributes, setSongAttributes] = useState(sampleData);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);


  // Toggle song selection
  const handleToggleSong = (song: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(song)) newSelected.delete(song);
    else newSelected.add(song);
    setSelectedSongs(newSelected);
  };

  const handleToggleAlgorithm = (algo: 'BFS' | 'DFS') => {
  if (activeButton === algo) {
    setActiveButton(null); // turn off if already active
  } else {
    setActiveButton(algo); // activate the selected algorithm
  }
};

  // Fetch recommendations when songs change or algorithm changes
  useEffect(() => {

    if (!activeButton) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

  if (addedSongs.length > 0 && activeButton) {
    fetchRecommendations();
  } else {
    setRecommendations([]);
  }
   return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [activeButton, addedSongs]);

const fetchRecommendations = async () => {
  if(abortControllerRef.current){
    abortControllerRef.current.abort();
  }
  const controller = new AbortController();
  abortControllerRef.current = controller;

  setIsLoading(true);
  try {
    const response = await fetch(
      `http://localhost:5000/api/recommendations?type=${activeButton}&k=0.5`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Explicitly type the expected JSON structure
    const data = (await response.json()) as { recommendations?: string[] };

    // Ensure recommendations is a string[]
    const recs = data.recommendations ?? [];

    // Filter, dedupe, and slice
    const filteredRecommendations: string[] = Array.from(
      new Set(
        recs
          .filter((song) => song && song.trim() !== "")
          .filter((song) => !addedSongs.includes(song))
      )
    ).slice(0, 10);

    setRecommendations(filteredRecommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    setRecommendations([]);
  } finally {
    setIsLoading(false);
  }
};



  // Delete selected songs
  const handleDeleteSelected = async () => {
    if (!selectedSongs.size) return;
    const songsToDelete = Array.from(selectedSongs);
    try {
      const res = await fetch("http://localhost:5000/api/delete-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs: songsToDelete }),
      });
      const data = await res.json();
      setAddedSongs(data.addedSongs);
      setSelectedSongs(new Set());
    } catch (err) {
      console.error(err);
      alert("Failed to delete songs");
    }
  };

  const handleAddRecommendedSong = async (song: string): Promise<void> => {
    if (addedSongs.includes(song)) return; // Prevent duplicates

    try {
      const res = await fetch("http://localhost:5000/api/add-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to add song");
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setAddedSongs(data.addedSongs);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add song");
    }
  };


  

  // Reset backend on load
  useEffect(() => {
    fetch("http://localhost:5000/reset", { method: "POST" }).catch(console.error);
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!searchQuery.trim()) return setSuggestions([]);
    fetch(`http://localhost:5000/api/suggestions?q=${encodeURIComponent(searchQuery)}`)
      .then(res => res.json())
      .then(setSuggestions)
      .catch(console.error);
  }, [searchQuery]);

  // Add song on Enter key
  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !searchQuery.trim()) return;
    const song = searchQuery.trim();
    try {
      const res = await fetch("http://localhost:5000/api/add-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to add song");
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setAddedSongs(data.addedSongs);
      }
      setSearchQuery('');
      setSuggestions([]);
    } catch (err) {
      console.error(err);
      alert("Failed to add song");
    }
  };

  // Normalize attributes 0-100
  const normalizeAttributes = (attrs: Partial<SongAttributes>) => {
    if (!attrs) {
      return {
        danceability: 0,
        energy: 0,
        valence: 0,
        tempo: 0,
        acousticness: 0,
        instrumentalness: 0,
        speechiness: 0,
        loudness: 0,
      };
    }

    return {
      danceability: Math.min(Math.max((attrs.danceability ?? 0) * 100, 0), 100),
      energy: Math.min(Math.max((attrs.energy ?? 0) * 100, 0), 100),
      valence: Math.min(Math.max((attrs.valence ?? 0) * 100, 0), 100),
      tempo: Math.min(Math.max(((attrs.tempo ?? 120) - 50) / (200 - 50) * 100, 0), 100), // map 50-200 BPM to 0-100
      acousticness: Math.min(Math.max((attrs.acousticness ?? 0) * 100, 0), 100),
      instrumentalness: Math.min(Math.max(Math.sqrt(attrs.instrumentalness ?? 0) * 100, 0), 100),
      speechiness: Math.min(Math.max(Math.pow(attrs.speechiness ?? 0, 0.25) * 100, 0), 100),
      loudness: Math.min(Math.max(((attrs.loudness ?? -60) + 60) / 60 * 100, 0), 100), // -60dB -> 0, 0dB -> 100
    };
  };

  // Fetch averages from backend and normalize
  useEffect(() => {
    const fetchAverages = async () => {
      if (addedSongs.length === 0) {
        setSongAttributes(sampleData); // show zeros if no songs
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/averages");
        const data = await res.json();
        const normalized = normalizeAttributes(data);
        setSongAttributes([
          { subject: "Danceability", value: normalized.danceability },
          { subject: "Energy", value: normalized.energy },
          { subject: "Valence", value: normalized.valence },
          { subject: "Tempo", value: normalized.tempo },
          { subject: "Acousticness", value: normalized.acousticness },
          { subject: "Instrumentalness", value: normalized.instrumentalness },
          { subject: "Speechiness", value: normalized.speechiness },
          { subject: "Loudness", value: normalized.loudness },
        ]);
      } catch (err) {
        console.error("Failed to fetch averages", err);
        setSongAttributes(sampleData); // fallback to zeros
      }
    };
    fetchAverages();
  }, [addedSongs]);

return (
    <div className="PageContainer">
      <div className="headerContainer">
        <div className="Header" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="SearchInput"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="SuggestionsDropdown">
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => { setSearchQuery(s); setSuggestions([]); }}>{s}</li>
              ))}
            </ul>
          )}
          {errorMessage && (
            <div className="ErrorPopup">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="CloseBtn">X</button>
            </div>
          )}
        </div>
      </div>

      <div className="mainContent">
        <div className="LeftAddContainer">
          <div className="AddSongs">
            <h2>Playlist</h2>
            {addedSongs.map((song, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span>{song}</span>
                <input type="checkbox" checked={selectedSongs.has(song)} onChange={() => handleToggleSong(song)} />
              </div>
            ))}
            {addedSongs.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none' }}
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>

        <div className="ChartContainer">
          <div className="Chart">
            <SkillRadar data={songAttributes} fixedScale={true} />
          </div>
        </div>

        <div className="RightRecommendContainer">
          <div className="RecommendSongs">
            <h2>Recommendations {activeButton}</h2>
            {isLoading ? (
              <div className="loading-container">
                <p>Loading recommendations...</p>
                <div className="spinner"></div>
              </div>
            ) : addedSongs.length === 0 ? (
              <p className="info-message">Add songs to your playlist to get recommendations</p>
            ) : recommendations.length === 0 ? (
              <p className="info-message">No recommendations available</p>
            ) : (
              <div>
                {recommendations.slice(0, 10).map((song, index) => (
                  <div
                    key={index}
                    className="recommendation-item"
                    onClick={() => handleAddRecommendedSong(song)}
                    style={{ cursor: 'pointer' }}
                    title={`Add "${song}" to playlist`}
                  >
                    <span>{index + 1}.</span> {song}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

        <div className="toggle">
          <div 
            className={`BFS ${activeButton === 'BFS' ? 'active' : ''}`} 
            onClick={() => handleToggleAlgorithm('BFS')}
          >
            <h1>BFS</h1>
          </div>
          <div 
            className={`DFS ${activeButton === 'DFS' ? 'active' : ''}`} 
            onClick={() => handleToggleAlgorithm('DFS')}
          >
            <h1>DFS</h1>
          </div>
        </div>

    </div>
  );
}

export default App;

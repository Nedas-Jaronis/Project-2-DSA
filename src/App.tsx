import { useState, useEffect } from 'react';
import './App.css';
import SkillRadar from './skillRadarChart';

const sampleData = [
  { subject: "Danceability", value: 80 },
  { subject: "Valence", value: 65 },
  { subject: "Energy", value: 100 },
  { subject: "Tempo", value: 120 },
  { subject: "Acousticness", value: 30 },
  { subject: "Instrumentalness", value: 10 },
  { subject: "Speechiness", value: 5 },
  { subject: "Loudness", value: -5 },
];

function App() {
  const [activeButton, setActiveButton] = useState<'BFS' | 'DFS'>('BFS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedSongs, setAddedSongs] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ✅ Toggle a song selection
  const handleToggleSong = (song: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(song)) {
      newSelected.delete(song);
    } else {
      newSelected.add(song);
    }
    setSelectedSongs(newSelected);
  };

  // ✅ Delete selected songs (POST to backend)
  const handleDeleteSelected = async () => {
    const songsToDelete = Array.from(selectedSongs);
    if (songsToDelete.length === 0) return;

    try {
      const res = await fetch("http://localhost:5000/api/delete-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs: songsToDelete }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete songs");
        return;
      }

      const data = await res.json();
      setAddedSongs(data.addedSongs);
      setSelectedSongs(new Set());
    } catch (err) {
      console.error("❌ Error deleting songs from backend:", err);
      alert("Error connecting to backend");
    }
  };

  // ✅ Reset backend when page loads
  useEffect(() => {
    fetch('http://localhost:5000/reset', { method: 'POST' })
      .then(() => console.log('Backend reset on page load'))
      .catch(err => console.error('Failed to reset backend:', err));
  }, []);

  // ✅ Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/suggestions?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [searchQuery]);

  const handleToggle = (button: 'BFS' | 'DFS') => {
    setActiveButton(button);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSuggestionClick = (song: string) => {
    setSearchQuery(song);
    setSuggestions([]);
  };

  // ✅ Add song to playlist
  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      const song = searchQuery.trim();

      try {
        const res = await fetch('http://localhost:5000/api/add-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ song }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          setErrorMessage(errorData.error || 'Failed to add song');
          setTimeout(() => setErrorMessage(''), 3000);
          setSearchQuery('');
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        console.log('Backend now has:', data.addedSongs);
        setAddedSongs(data.addedSongs);
        setSearchQuery('');
        setSuggestions([]);
      } catch (err) {
        console.error('❌ Error sending to backend:', err);
        alert('Error connecting to backend');
      }
    }
  };

  // 🧩 Send updated playlist to Node backend
  useEffect(() => {
    if (addedSongs.length === 0) return;

    const sendToNodeBackend = async () => {
      try {
        await fetch("http://localhost:8000/receive-songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addedSongs }),
        });
        console.log("📡 Sent songs to Node backend:", addedSongs);
      } catch (err) {
        console.error("❌ Failed to send songs to Node backend:", err);
      }
    };

    sendToNodeBackend();
  }, [addedSongs]); // Trigger when playlist updates

  return (
    <div className="PageContainer">
      <div className="headerContainer">
        <div className="Header" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
            className="SearchInput"
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="SuggestionsDropdown">
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => handleSuggestionClick(s)}>
                  {s}
                </li>
              ))}
            </ul>
          )}

          {errorMessage && (
            <div className="ErrorPopup">
              <img src="/src/spiderman-electro.png" alt="Error" className="ErrorIcon" />
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
            {addedSongs.map((song, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>{song}</span>
                <input
                  type="checkbox"
                  checked={selectedSongs.has(song)}
                  onChange={() => handleToggleSong(song)}
                />
              </div>
            ))}

            {addedSongs.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                style={{
                  marginTop: '10px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                }}
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>

        <div className="ChartContainer">
          <div className="Chart">
            <SkillRadar data={sampleData} />
          </div>
        </div>

        <div className="RightRecommendContainer">
          <div className="RecommendSongs">
            <h1>Rec 1</h1>
            <h1>Rec 2</h1>
          </div>
        </div>
      </div>

      <div className="toggle">
        <div
          className={`BFS ${activeButton === 'BFS' ? 'active' : ''}`}
          onClick={() => handleToggle('BFS')}
        >
          <h1>BFS</h1>
        </div>
        <div
          className={`DFS ${activeButton === 'DFS' ? 'active' : ''}`}
          onClick={() => handleToggle('DFS')}
        >
          <h1>DFS</h1>
        </div>
      </div>
    </div>
  );
}

export default App;

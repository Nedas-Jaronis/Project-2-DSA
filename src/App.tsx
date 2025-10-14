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

  useEffect(() => {
    fetch('http://localhost:5000/reset', { method: 'POST' })
      .then(() => console.log('Backend reset on page load'))
      .catch(err => console.error('Failed to reset backend:', err));
  }, []); // empty dependency array → runs once when page loads


  const handleToggle = (button: 'BFS' | 'DFS') => {
    setActiveButton(button);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      const song = searchQuery.trim();

      // Add locally
      setAddedSongs([...addedSongs, song]);
      setSearchQuery('');

      // ✅ Send to backend
      try {
        const res = await fetch('http://localhost:5000/api/add-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ song }),
        });

        if (!res.ok) throw new Error('Failed to send to backend');
        const data = await res.json();
        console.log('Backend now has:', data.addedSongs);
      } catch (err) {
        console.error('❌ Error sending to backend:', err);
      }
    }
  };


  return (
    <div className="PageContainer">
      <div className="headerContainer">
        <div className="Header">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress} // ✅ Add this line
            className="SearchInput"
          />
        </div>
      </div>

      <div className="mainContent">
        <div className="LeftAddContainer">
          <div className="AddSongs">
            <h2>Added Songs</h2>
            {addedSongs.map((song, index) => (
              <h3 key={index}>{song}</h3>
            ))}
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

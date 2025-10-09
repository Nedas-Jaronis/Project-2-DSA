import { useState } from 'react';
import './App.css';
import SkillRadar from './skillRadarChart';

const sampleData = [
  { subject: 'Speed', value: 80 },
  { subject: 'Strength', value: 65 },
  { subject: 'Endurance', value: 90 },
  { subject: 'Agility', value: 70 },
  { subject: 'Intelligence', value: 50 },
];

function App() {
  const [activeButton, setActiveButton] = useState<'BFS' | 'DFS'>('BFS');

  const handleToggle = (button: 'BFS' | 'DFS') => {
    setActiveButton(button);
  };

  return (
    <div className="PageContainer">
      <div className="headerContainer">
        <div className="Header">
          <h1 id="search">Search</h1>
        </div>
      </div>

      <div className="mainContent">
        <div className="LeftAddContainer">
          <div className="AddSongs">
            <h1>song1</h1>
            <h1>song2</h1>
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

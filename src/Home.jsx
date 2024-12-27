import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home (){
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [githubAccessToken, setGithubAccessToken] = useState('');
  const navigate = useNavigate();

  // Load stored data on component mount
  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey', 'githubAccessToken'], (result) => {
      if (result.geminiApiKey) setGeminiApiKey(result.geminiApiKey);
      if (result.githubAccessToken) setGithubAccessToken(result.githubAccessToken);
    });
  }, []);

  // Save data to Chrome storage
  const handleSave = () => {
    chrome.storage.sync.set({ geminiApiKey, githubAccessToken }, () => {
      alert('API keys saved successfully.');
    });
  };

  // Navigate to Generate component
  const handleGenerate = () => {
    navigate('/generate');
  };

  return (
    <div className="container">
      <h1>API Key Configuration</h1>
      <div className="form-group">
        <label htmlFor="geminiApiKey">Gemini API Key:</label>
        <input
          type="text"
          id="geminiApiKey"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="githubAccessToken">GitHub Access Token:</label>
        <input
          type="text"
          id="githubAccessToken"
          value={githubAccessToken}
          onChange={(e) => setGithubAccessToken(e.target.value)}
        />
      </div>
      <button onClick={handleSave} className="btn save-btn">Save</button>
      <button onClick={handleGenerate} className="btn generate-btn">Generate</button>
    </div>
  );
};

export default Home;

import { useEffect, useState } from "react";
import {
  generateORupdateReadmeFile,
  generateReadmeContent,
  getEmailId,
  getFileContent,
} from "./utils";

function GetDetails({ userName, githubUsername, repoName, repositoryUrl }) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [githubAccessToken, setGithubAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readmeFileContent, setReadmeFileContent] = useState(null);
  const [isReadmeUpdated, setIsReadmeUpdated] = useState(false);
  const [clickSave, setClcikSave] = useState(false);



  useEffect(() => {

    // chrome.storage.sync.get(null, function (data) {
    //   console.info(data);
    // })

    chrome.storage.sync.get(['geminiApiKey', 'githubAccessToken', 'githubUsername'], function (result) {
      if (result.geminiApiKey && result.githubAccessToken) {

        setGeminiApiKey(JSON.parse(result.geminiApiKey));
        setGithubAccessToken(JSON.parse(result.githubAccessToken));
        setClcikSave(true);
        document.getElementById("statusMessage").textContent = "Keys are already present.";
        document.getElementById("statusMessage").style.color = "#28a745";


      } else {
        document.getElementById("statusMessage").textContent = "Please fill in both fields.";
        document.getElementById("statusMessage").style.color = "#dc3545";
      }
    });
  }, [userName, githubUsername]);

  const handleSave = () => {
    if (geminiApiKey && githubAccessToken) {
      chrome.storage.sync.set(
        {
          geminiApiKey: JSON.stringify(geminiApiKey),
          githubAccessToken: JSON.stringify(githubAccessToken),
          githubUsername: JSON.stringify(userName),
        },
        function () {
          document.getElementById("statusMessage").textContent = "API keys saved successfully!";
          document.getElementById("statusMessage").style.color = "#28a745";
          window.location.reload();
        }
      );
    } else {
      document.getElementById("statusMessage").textContent = "Please fill in both fields.";
      document.getElementById("statusMessage").style.color = "#dc3545";
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);  // Show loader when generating
    const repoFileContent = await getFileContent(userName, repoName, githubAccessToken);
    if (repoFileContent) {
      const generatedContent = await generateReadmeContent(repoFileContent, geminiApiKey, repositoryUrl);
      setReadmeFileContent(generatedContent);
      // console.log(generatedContent);
    }
    setIsLoading(false);  // Hide loader after content is generated
  };

  const handleCreateReadme = async () => {
    setIsLoading(true);
    await generateORupdateReadmeFile(userName, repoName, githubAccessToken, readmeFileContent);
    setTimeout(() => {
      setReadmeFileContent("README file content updated successfully...");
      setIsReadmeUpdated(true);
      setIsLoading(false);
    }, 1500);
    chrome.tabs.reload();
    setTimeout(() => {
      window.close();
    }, 2500)
  };


  const handleClearKeys = async () => {
    // clear the chrome storage
    await chrome.storage.sync.clear(function () {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      } else {
        console.log('Sync storage cleared.');
      }
      window.location.reload();
    });
  }

  return (
    <div className="container">
      <h2 className="header">AI Powered GitHub Readme Generator</h2>

      {/* input fields */}
      <div className="form-group">
        <label htmlFor="geminiApiKey">
          Gemini API Key:
          <a
            href="https://ai.google.dev/gemini-api/docs/api-key"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 'small', fontStyle: 'italic', marginLeft: '10px' }}
          >
            how to get gemini key
          </a>
        </label>
        <input
          type="text"
          id="geminiApiKey"
          value={geminiApiKey}
          placeholder="Enter Gemini Api key..."
          onChange={(e) => setGeminiApiKey(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="githubAccessToken">
          GitHub Access Token:
          <a
            href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 'small', fontStyle: 'italic', marginLeft: '10px' }}
          >
            how to get github access token
          </a>
        </label>
        <input
          type="text"
          id="githubAccessToken"
          value={githubAccessToken}
          placeholder="Enter gitHub access token..."
          onChange={(e) => setGithubAccessToken(e.target.value)}
        />
      </div>

      <p id="statusMessage"></p>

      <div className="button-container">
        <button onClick={handleSave} className="btn save-btn">Save</button>
        {githubAccessToken && geminiApiKey && clickSave && (<button onClick={handleClearKeys} className="btn clear-btn">Clear Keys</button>)}
        {githubAccessToken && geminiApiKey && clickSave && (
          <button onClick={handleGenerate} className="btn generate-btn">
            {isLoading && !readmeFileContent ? "Generating..." : "Generate"}
          </button>
        )}
      </div>


      {isLoading && !readmeFileContent && (
        <div className="loader">Loading...</div>
      )}

      {readmeFileContent && (
        <div className="content-display">
          <h3>Generated README Content:</h3>
          <pre>{readmeFileContent}</pre>
        </div>
      )}

      {readmeFileContent && !isLoading && !isReadmeUpdated && (
        <div className="button-container">
          <button onClick={handleCreateReadme} className="btn create-btn">
            Create/Update Readme
          </button>
        </div>
      )}

      {readmeFileContent && isLoading && (
        <div className="loader">Loading...</div>
      )}
    </div>
  );
}

export default GetDetails;

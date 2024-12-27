import { useEffect, useState } from "react";
import { generateORupdateReadmeFile, generateReadmeContent, getEmailId, getFileContent } from "./utils";

function GetDetails({ userName, repoName, repositoryUrl }) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [githubAccessToken, setGithubAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);  // To manage loader visibility
  const [readmeFileContent, setReadmeFileContent] = useState(null);  // To store readme content
  const [isReadmeUpdated, setIsReadmeUpdated] = useState(false); // track readme updation

  // Load stored data on component mount
  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey', 'githubAccessToken'], function (result) {
      if (result.geminiApiKey && result.githubAccessToken) {
        if (result.geminiApiKey) setGeminiApiKey(JSON.parse(result.geminiApiKey));
        if (result.githubAccessToken) setGithubAccessToken(JSON.parse(result.githubAccessToken));
        document.getElementById("statusMessage").textContent = "Keys are already present.";
        document.getElementById("statusMessage").style.color = "#28a745";
      } else {
        document.getElementById("statusMessage").textContent = "Please fill in both fields.";
        document.getElementById("statusMessage").style.color = "#dc3545";
      }
    });
  }, []);

  // Save data to Chrome storage
  const handleSave = () => {
    if (geminiApiKey && githubAccessToken) {
      chrome.storage.sync.set(
        {
          geminiApiKey: JSON.stringify(geminiApiKey),
          githubAccessToken: JSON.stringify(githubAccessToken),
        },
        function () {
          document.getElementById("statusMessage").textContent = "API keys saved successfully!";
          document.getElementById("statusMessage").style.color = "#28a745";
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
      setReadmeFileContent("README file content updated successfully! Please reload the Page...");
      setIsReadmeUpdated(true);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="container">
     <h2 className="header">AI Powered GitHub Readme Generator</h2>


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
          onChange={(e) => setGithubAccessToken(e.target.value)}
        />
      </div>







      <p id="statusMessage"></p>

      <div className="button-container">
        <button onClick={handleSave} className="btn save-btn">Save</button>
        <button onClick={handleGenerate} className="btn generate-btn">
          {isLoading && !readmeFileContent ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Show loader if content is loading */}
      {isLoading && !readmeFileContent && (
        <div className="loader">Loading...</div>
      )}

      {/* Display the generated README content if available */}
      {readmeFileContent && (
        <div className="content-display">
          <h3>Generated README Content:</h3>
          <pre>{readmeFileContent}</pre>
        </div>
      )}


      {/* Show "Create/Update Readme" button after content is generated */}
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

import './App.css';
import { useState, useEffect } from "react";
import GetDetails from './GetDetails';

function App() {
  const [userName, setUserName] = useState();
  const [repoName, setRepoName] = useState();
  const [repositoryUrl, setRepositoryUrl] = useState();
  const [isValidGitHubRepo, setIsValidGitHubRepo] = useState(true);

  useEffect(() => {
    async function getActiveTabURL() {
      let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0];
    }

    async function fetchRepoDetails() {
      let currentTab = await getActiveTabURL();

      if (!currentTab || !currentTab.url) {
        console.log("No valid URL found");
        setIsValidGitHubRepo(false);
        return;
      }

      const { userName, repoName, error } = extractRepoDetails(currentTab.url);

      if (error) {
        setIsValidGitHubRepo(false);
      } else {
        setRepoName(repoName);
        setUserName(userName);
        setRepositoryUrl(currentTab.url);
        setIsValidGitHubRepo(true);
      }
    }

    fetchRepoDetails();
  }, []);

  function extractRepoDetails(githubUrl) {
    if (!githubUrl) {
      return { error: "URL is undefined or empty." };
    }

    const regex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/;
    const match = githubUrl.match(regex);

    if (match) {
      const userName = match[1];
      const repoName = match[2];
      return { userName, repoName };
    } else {
      console.log("Invalid GitHub URL format.");
      return { error: "Invalid GitHub URL format." };
    }
  }

  return (
    <div>
      {isValidGitHubRepo ? (
        <GetDetails userName={userName} repoName={repoName} repositoryUrl={repositoryUrl} />
      ) : (
        <div className="error-message">
          <p>This is not a valid GitHub repository page.</p>    
        </div>
      )}
    </div>
  );
}

export default App;

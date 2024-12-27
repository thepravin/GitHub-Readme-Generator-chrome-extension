import { GoogleGenerativeAI } from "@google/generative-ai";
import { Octokit } from "@octokit/core";
import { Buffer } from "buffer";

export async function getFileContent(userName, repoName, githubAccessToken) {
  const octokit = new Octokit({
    auth: githubAccessToken,
  });

  let content = "";

  try {
    // Fetch the contents of the repository's root directory
    const { data: files } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents",
      {
        owner: userName,
        repo: repoName,
      }
    );

    // Define the files to exclude
    const excludeFiles = [
      "package-lock.json",
      ".prettierrc",
      ".git",
      ".gitignore",
      ".gitmodules",
      "node_modules/",
      "bower_components/",
      "vendor/",
      "*.log",
      "*.tmp",
      "*.bak",
      "*.swp",
      "*.swo",
      "*.DS_Store",
      "Thumbs.db",
      "desktop.ini",
      "*.class",
      "*.pyc",
      "*.pyo",
      "*.pdb",
      "*.idb",
      "*.suo",
      "*.user",
      "*.userosscache",
      "*.sln.docstates",
    ];

    // Iterate over each file in the directory
    for (const file of files) {
      // Check if the item is a file (not a directory) and not in the exclude list
      if (file.type === "file" && !excludeFiles.includes(file.name)) {
        // Fetch the content of the file
        const { data: fileData } = await octokit.request(
          "GET /repos/{owner}/{repo}/contents/{path}",
          {
            owner: userName,
            repo: repoName,
            path: file.path,
          }
        );

        // Decode the base64 content
        const base64Content = fileData.content;
        const buffer = Buffer.from(base64Content, "base64");
        const decodedContent = buffer.toString("utf-8");
        content += file.path;
        content += "\n";
        content += decodedContent;
        content += "\n";
      }
    }
  } catch (error) {
    console.error("Error fetching file contents:", error);
  }

  return content;
}

export async function generateReadmeContent(
  repoFileContent,
  geminiApiKey,
  repositoryUrl
) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
I am providing the GitHub repository link and the code content. Please generate a detailed and well-structured README.md file with the following sections:

1. **Project Title and Description**: Derive the project title from the repository name and provide a concise description of its purpose and functionality.

2. **Table of Contents**: Create a navigable list of sections included in the README for easy reference.

3. **Folder Structure**: Present the project's folder structure in a tree format to give an overview of its organization.

4. **Installation Instructions**: Provide step-by-step guidance on how to install and set up the project, including any dependencies or prerequisites.

5. **Usage Guide**: Offer clear instructions and examples on how to use the project, including code snippets where applicable.

6. **Code Snippets**: Highlight key parts of the codebase with relevant code snippets, explaining their significance and functionality.

7. **API Documentation (if applicable)**: For any API endpoints present in the code, detail each endpoint with descriptions of parameters, expected responses, and usage examples.

8. **Features**: List and describe the main features and functionalities of the project.

9. **Contributing Guidelines**: Outline how others can contribute to the project, including any coding standards, branch management, and submission processes.

10. **License Information**: Specify the licensing terms under which the project is distributed.

11. **Tech Stack**: Represent the technologies used in the project with appropriate emojis (e.g., 🖥️ for development, 💻 for programming languages, 🌐 for web technologies, 🗄️ for databases, ☁️ for cloud services).

12. **Acknowledgements**: Credit any individuals, organizations, or resources that significantly contributed to the project.

### GitHub Repository URL:
${repositoryUrl}

### Code Content:
${repoFileContent}

The README.md should be clear, concise, and formatted in Markdown, adhering to best practices for readability and organization.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}


// export async function getEmailId(userName, githubAccessToken) {
//   const octokit = new Octokit({
//     auth: githubAccessToken,
//   });

//   try {
//     const data  = await octokit.request('GET /user/emails', {
//       headers: {
//         'X-GitHub-Api-Version': '2022-11-28'
//       }
//     })
    
//     // await octokit.request('GET /users/{username}', {
//     //   username: userName,
//     //   headers: {
//     //     'X-GitHub-Api-Version': '2022-11-28'
//     //   }
//     // });

//     let emailId = data.email;
//     console.log(data);

//     // if (!emailId) {
//     //   // Email is not publicly visible, attempt to retrieve via authenticated endpoint
//     //   const emailsResponse = await octokit.request('PATCH /user/email/visibility', {
//     //     visibility: 'private',
//     //     headers: {
//     //       'X-GitHub-Api-Version': '2022-11-28'
//     //     }
//     //   })

//     //   console.log("Emails Response : ");
//     //   console.log(emailsResponse)

//     //   const primaryEmail = emailsResponse.data.find(email => email.primary);
//     //   emailId = primaryEmail ? primaryEmail.email : null;
//     // }

//     console.log(emailId);
//     return emailId;
//   } catch (error) {
//     console.error('Error fetching email:', error);
//     return null;
//   }
// }

export async function generateORupdateReadmeFile(
  userName,
  repoName,
  githubAccessToken,
  generatedContent
) {
  const octokit = new Octokit({
    auth: githubAccessToken,
  });

  // const emailId = await getEmailId(userName,githubAccessToken);

  const owner = userName;
  const repo = repoName;
  const path = "README.md";
  const message = "Add README.md";
  const committer = {
    name: userName,
    email: `${userName}+@gmail.com`,
  };

  const content = Buffer.from(generatedContent).toString("base64");

  try {
    // Step 1: Check if the file exists and get its current sha
    let sha;
    try {
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path,
        }
      );
      sha = data.sha; // File exists, store its sha
    } catch (error) {
      if (error.status === 404) {
        // File does not exist
        sha = null;
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Step 2: Create or update the file
    const response = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        message,
        committer,
        content,
        sha, // Include sha only if updating an existing file
      }
    );

    console.log("Success:", response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}



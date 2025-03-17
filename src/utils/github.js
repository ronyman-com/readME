import axios from 'axios';
import chalk from 'chalk';

const fetchRepoChanges = async (owner, repo, token) => {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    const commits = response.data;
    const changes = [];

    for (const commit of commits) {
      const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`;
      const commitResponse = await axios.get(commitUrl, {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const files = commitResponse.data.files;
      files.forEach((file) => {
        changes.push({
          type: file.status, // 'added', 'modified', 'removed'
          path: file.filename,
          commitMessage: commit.commit.message,
          timestamp: commit.commit.author.date,
        });
      });
    }

    return changes;
  } catch (error) {
    console.error(chalk.red('Error fetching repository changes:'), error.message);
    return [];
  }
};

// Export the function
export { fetchRepoChanges };
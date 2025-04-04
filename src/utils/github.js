// src/utils/github.js
import axios from 'axios';
import chalk from 'chalk';
import { logError } from './logger.js'; // Assuming you have a logger utility

const fetchRepoChanges = async (owner, repo, token) => {
  try {
    if (!owner || !repo) {
      throw new Error('GitHub owner/repo not specified');
    }

    // Get the list of commits
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
    const commitsResponse = await axios.get(commitsUrl, {
      headers: {
        Authorization: token ? `token ${token}` : '',
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const changes = [];

    // Process each commit to get file changes
    for (const commit of commitsResponse.data) {
      try {
        const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`;
        const commitResponse = await axios.get(commitUrl, {
          headers: {
            Authorization: token ? `token ${token}` : '',
            Accept: 'application/vnd.github.v3+json'
          }
        });

        // Safely process files data
        const files = commitResponse.data?.files || [];
        files.forEach((file) => {
          changes.push({
            sha: commit.sha,
            url: commit.html_url,
            type: file.status || 'modified', // Default to 'modified' if status missing
            path: file.filename || 'unknown',
            author: commit.commit?.author?.name || commit.author?.login || 'Unknown',
            message: commit.commit?.message || 'No commit message',
            date: commit.commit?.author?.date || new Date().toISOString(),
            timestamp: commit.commit?.author?.date || new Date().toISOString()
          });
        });
      } catch (commitError) {
        logError(`Error processing commit ${commit.sha}: ${commitError.message}`);
      }
    }

    return changes;
  } catch (error) {
    if (error.response?.status === 404) {
      logError('Repository not found - check owner/repo name');
    } else if (error.response?.status === 401) {
      logError('Authentication failed - check your GitHub token');
    } else {
      logError(`GitHub API error: ${error.message}`);
    }
    return [];
  }
};

export { fetchRepoChanges };
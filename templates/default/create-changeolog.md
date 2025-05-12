# Creating a Changelog for Your Documentation Website

Follow these steps to generate an automated changelog page for your project:

## 1. Set Up GitHub Authentication

1. Create a `.env` file in your project root directory
2. Add these required GitHub credentials:

```env
GITHUB_TOKEN=ghp_yourgithubtoken123
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
```



Learn more about .env files [here](/env).

2. Generate GitHub Personal Access Token
Go to your GitHub profile settings

Navigate to: Settings → Developer Settings → Personal Access Tokens

Click "Generate new token"

Select the repo scope for repository access

3. Generate the Changelog
Run this command in your terminal:

```bash
readme --changelog --md
```
This will generate a changelog.md file from the template located at:
templates/default/changelog.md

Learn More  about ReadME CLI documentation [here](/cli).

Or Get CLI help directly in your terminal:

```bash
readme help
```
The changelog will automatically include all your project's updates and changes.

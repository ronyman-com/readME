# index.ejs Template Example

This Markdown file provides both the code samples and explanatory documentation for working with the `index.ejs` template in the ReadME framework.
## Basic Hero Section
```ejs
<div class="hero">
  <h1><%= projectName %></h1>
  <p class="tagline">Modern documentation solution</p>
</div>



# Advanced EJS Features for Documentation Templates

## Basic Syntax

### Output Escaped Content
```ejs
<%= document.title %>


# page.ejs - Template Inheritance Example

This template demonstrates EJS layout inheritance for documentation pages.

## Complete Template Code
```ejs
<% layout('layout') -%>

<% block('head', () => { %>
  <link rel="stylesheet" href="/docs.css">
  <meta name="description" content="<%= description %>">
<% }) %>

<% block('content', () => { %>
  <article class="documentation-content">
    <header>
      <h1><%= title %></h1>
      <% if (subtitle) { %>
        <p class="subtitle"><%= subtitle %></p>
      <% } %>
    </header>
    
    <div class="content-body">
      <%- content %>
    </div>

    <footer class="page-footer">
      <% if (lastUpdated) { %>
        <div class="last-updated">
          Last updated: <%= new Date(lastUpdated).toLocaleDateString() %>
        </div>
      <% } %>
    </footer>
  </article>
<% }) %>

```


To learn more about ejs file extensions, go [here](https://ejs.co/).
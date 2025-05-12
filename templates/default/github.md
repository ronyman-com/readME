# Customizing the Header

To add your own site link or branding to the ReadME Framework header, modify the `index.ejs` file.

## Default Header Structure
```html
<header class="navbar">
  <div class="navbar-brand">
    <img src="/assets/images/logo.jpg" alt="ReadME Logo">
    <span>ReadME Framework <span id="readme-version">v${version}</span></span>
  </div>
  <div class="github-buttons">
    <a class="github-button" href="https://github.com/ronyman-com/readME" data-icon="octicon-star" data-size="large" data-show-count="true">
      Star
    </a>
    <a href="https://github.com/ronyman-com/readME" class="source-code-link">
      Source Code
    </a>
  </div>
  <button id="mobile-sidebar-toggle" class="mobile-sidebar-toggle">☰</button>
</header>
```



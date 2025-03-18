# Getting Started

## Install readME from npm

```bash <button onclick="copyCode('readme init')">Copy</button>
npm install -g readme-framework





---

### **Copy-to-Clipboard Function**
To add the **copy-to-clipboard functionality**, include the following JavaScript in your `README.md` file:

```html
<script>
  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      alert('Copied to clipboard: ' + code);
    });
  }
</script>
# ABI Splitter

A simple web tool to split hex strings (encoded from `abi.encode`) into bytes32 blocks for easy visualization.

## Features

- 📝 Paste any hex string encoded from ABI encoding
- 🔍 Automatically splits the hex string into bytes32 blocks (64 hex characters each)
- ✅ Validates hex input with helpful error messages
- 🔄 Handles hex strings with or without "0x" prefix
- 📦 Shows partial blocks if the input length isn't a multiple of 64
- 🎨 Clean, modern UI with responsive design

## Usage

1. Open `index.html` in your web browser
2. Paste your hex string into the textarea
3. Click "Split into Bytes32 Blocks"
4. View the result displayed as separate bytes32 blocks

## Example

Input:
```
0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000036162630000000000000000000000000000000000000000000000000000000000
```

Output:
- Block 0: `0x0000000000000000000000000000000000000000000000000000000000000020`
- Block 1: `0x0000000000000000000000000000000000000000000000000000000000000003`
- Block 2: `0x6162630000000000000000000000000000000000000000000000000000000000`

## Local Development

Simply open `index.html` in your browser, or serve it with any local web server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve
```

Then visit `http://localhost:8080` in your browser.

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `script.js` - JavaScript logic for splitting and validation
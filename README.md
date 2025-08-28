# PDF Merger

A modern, user-friendly web app to merge multiple PDF files into a single document—right in your browser, with no server upload required.

## Features

- **Drag & Drop** PDF files or use the file picker
- **Reorder** files before merging (drag to rearrange)
- **Remove** individual files or clear all
- **Shows page count** and file size for each PDF
- **Progress bar** during merging
- **Download** the merged PDF instantly
- **Dark mode** support (via `darkmode.js`)
- **Keyboard shortcuts**:  
	- <kbd>Delete</kbd> to clear all  
	- <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to merge

## How It Works

- All processing is done locally in your browser using [pdf-lib](https://pdf-lib.js.org/).
- No files are uploaded to any server.

## Getting Started

1. **Clone or download** this repository.
2. Open `index.html` in your browser.
3. Drag and drop your PDF files, arrange them, and click **Merge**.

## File Structure

- `index.html` — Main app UI
- `script.js` — App logic (file handling, merging, UI)
- `styles.css` — Modern responsive styles
- `darkmode.js` — Dark mode toggle
- `about.html`, `contact.html`, `help.html`, `test.html` — Additional pages

## Dependencies

- [pdf-lib](https://pdf-lib.js.org/) (loaded via CDN)
- [Font Awesome](https://fontawesome.com/) (icons via CDN)




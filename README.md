# PDF Merger 2.0

A comprehensive, modern web application for PDF manipulation—merge, split, and manage PDF files right in your browser with no server upload required.

## 🚀 Features

### PDF Merger
- **Drag & Drop** PDF files or use the file picker
- **Reorder** files before merging (drag to rearrange)
- **Remove** individual files or clear all
- **Shows page count** and file size for each PDF
- **Progress bar** with detailed status during merging
- **Download** the merged PDF instantly
- **Compression options** (None, Low, Medium, High)
- **Preserve bookmarks** option (basic support)
- **Metadata preservation** for merged documents
- **Preview mode** to review files before merging
- **Enhanced error handling** with toast notifications
- **File status indicators** (processing, success, error)

### PDF Splitter (NEW!)
- **Split into individual pages** - Extract each page as a separate PDF
- **Page range extraction** - Extract specific page ranges (e.g., pages 5-10)
- **Custom page selection** - Extract specific pages (e.g., 1,3,5-8,10)
- **PDF metadata display** - Shows title, author, and file information
- **Batch download** for individual pages

### General Features
- **Dark mode** support with smooth transitions
- **Responsive design** - Works on desktop, tablet, and mobile
- **Toast notifications** for better user feedback
- **Enhanced animations** and hover effects
- **Keyboard shortcuts**:
  - <kbd>Delete</kbd> to clear all files
  - <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to merge/split
  - <kbd>Escape</kbd> to close preview modal
 
## 🔒 Privacy & Security

- **100% Client-Side Processing** - All operations happen in your browser
- **No Server Uploads** - Your files never leave your device
- **No Data Collection** - We don't store or track any information
- **Secure by Design** - Built with privacy as a core principle

## 🚀 Getting Started

1. **Clone or download** this repository
2. Open `index.html` for PDF merging or `splitter.html` for PDF splitting
3. **For Merging**: Drag and drop multiple PDF files, arrange them, and click **Merge**
4. **For Splitting**: Drop a single PDF file and choose your splitting options

## 🎯 Usage Tips

- Use **compression settings** to balance file size and quality
- **Preview** your merge before processing to avoid mistakes
- Try **custom page selection** in splitter (e.g., "1,3,5-8,10")
- Enable **dark mode** for comfortable viewing in low light
- Use **keyboard shortcuts** for faster workflow

## 📁 File Structure

- `index.html` — PDF Merger main interface
- `splitter.html` — PDF Splitter interface (NEW!)
- `script.js` — Enhanced merger logic with advanced features
- `splitter.js` — PDF splitting functionality (NEW!)
- `styles.css` — Modern responsive styles with dark mode
- `darkmode.js` — Shared dark mode functionality
- `about.html`, `contact.html`, `help.html`, `test.html` — Additional pages

## 🛠️ Dependencies

- [pdf-lib](https://pdf-lib.js.org/) v1.17.1 (loaded via CDN)
- [Font Awesome](https://fontawesome.com/) v6.0.0 (icons via CDN)

## ✨ What's New in 2.0

- **PDF Splitter Tool** - Complete splitting functionality
- **Enhanced UI/UX** - Better animations, hover effects, and visual feedback
- **Compression Options** - Choose compression level for output files
- **Preview Modal** - Review files and settings before processing
- **Toast Notifications** - Better error handling and user feedback
- **File Status Indicators** - Visual feedback during processing
- **Improved Dark Mode** - Smoother transitions and better contrast
- **Enhanced Accessibility** - Better keyboard navigation and screen reader support
- **Mobile Optimization** - Improved responsive design for all devices




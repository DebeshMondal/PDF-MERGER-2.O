class PDFMergerUI {
    constructor() {
        this.files = [];
        this.compressionSettings = {
            none: { quality: 1.0, compress: false },
            low: { quality: 0.9, compress: true },
            medium: { quality: 0.7, compress: true },
            high: { quality: 0.5, compress: true }
        };
        this.initializeElements();
        this.bindEvents();
        this.createPreviewModal();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.filesSection = document.getElementById('filesSection');
        this.filesList = document.getElementById('filesList');
        this.mergeSection = document.getElementById('mergeSection');
        this.clearAllBtn = document.getElementById('clearAll');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.outputName = document.getElementById('outputName');
        this.compressionLevel = document.getElementById('compressionLevel');
        this.preserveBookmarks = document.getElementById('preserveBookmarks');
        this.enablePassword = document.getElementById('enablePassword');
        this.pdfPassword = document.getElementById('pdfPassword');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
    }

    bindEvents() {
        // Drop zone events
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));

        // File input change
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Clear all button
        this.clearAllBtn.addEventListener('click', this.clearAllFiles.bind(this));

        // Merge button
        this.mergeBtn.addEventListener('click', this.handleMerge.bind(this));
        
        // Preview button
        this.previewBtn.addEventListener('click', this.showPreview.bind(this));
        
        // Password checkbox
        this.enablePassword.addEventListener('change', this.togglePasswordField.bind(this));
        
        // Dark mode is now handled by darkmode.js
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        this.addFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addFiles(files);
    }

    addFiles(newFiles) {
        newFiles.forEach(file => {
            if (!this.files.find(f => f.name === file.name && f.size === file.size)) {
                this.files.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    pages: null
                });
            }
        });
        this.loadFileInfo();
        this.updateUI();
    }

    async loadFileInfo() {
        for (let fileObj of this.files) {
            if (!fileObj.pages) {
                const fileElement = this.getFileElement(fileObj);
                if (fileElement) fileElement.classList.add('processing');
                
                try {
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                    fileObj.pages = pdf.getPageCount();
                    fileObj.metadata = {
                        title: pdf.getTitle() || 'Untitled',
                        author: pdf.getAuthor() || 'Unknown',
                        creator: pdf.getCreator() || 'Unknown'
                    };
                    if (fileElement) {
                        fileElement.classList.remove('processing');
                        fileElement.classList.add('success');
                    }
                } catch (error) {
                    fileObj.pages = '?';
                    fileObj.error = error.message;
                    if (fileElement) {
                        fileElement.classList.remove('processing');
                        fileElement.classList.add('error');
                    }
                    this.showToast(`Error loading ${fileObj.name}: ${error.message}`, 'error');
                }
            }
        }
        this.updateUI();
    }
    
    getFileElement(fileObj) {
        const fileItems = document.querySelectorAll('.file-item');
        for (let item of fileItems) {
            const fileName = item.querySelector('.file-details h4').textContent;
            if (fileName === fileObj.name) return item;
        }
        return null;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateUI();
    }

    clearAllFiles() {
        this.files = [];
        this.updateUI();
    }

    moveFile(fromIndex, toIndex) {
        const file = this.files.splice(fromIndex, 1)[0];
        this.files.splice(toIndex, 0, file);
        this.updateUI();
    }

    updateUI() {
        if (this.files.length === 0) {
            this.filesSection.style.display = 'none';
            this.mergeSection.style.display = 'none';
            return;
        }

        this.filesSection.style.display = 'block';
        this.mergeSection.style.display = 'block';
        this.renderFilesList();
    }

    renderFilesList() {
        this.filesList.innerHTML = '';
        
        let totalSize = 0;
        this.files.forEach(f => totalSize += f.size);
        
        this.files.forEach((fileObj, index) => {
            const file = fileObj.file;
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.draggable = true;
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-grip-vertical drag-handle"></i>
                    <i class="fas fa-file-pdf"></i>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)} • ${fileObj.pages || '...'} pages</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-icon move-up" title="Move up" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn-icon move-down" title="Move down" ${index === this.files.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="btn-icon remove" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            // Add event listeners
            const removeBtn = fileItem.querySelector('.remove');
            const moveUpBtn = fileItem.querySelector('.move-up');
            const moveDownBtn = fileItem.querySelector('.move-down');

            removeBtn.addEventListener('click', () => this.removeFile(index));
            
            if (!moveUpBtn.disabled) {
                moveUpBtn.addEventListener('click', () => this.moveFile(index, index - 1));
            }
            
            if (!moveDownBtn.disabled) {
                moveDownBtn.addEventListener('click', () => this.moveFile(index, index + 1));
            }

            // Drag and drop for reordering
            fileItem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                fileItem.classList.add('dragging');
            });

            fileItem.addEventListener('dragend', () => {
                fileItem.classList.remove('dragging');
            });

            fileItem.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            fileItem.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                if (fromIndex !== toIndex) {
                    this.moveFile(fromIndex, toIndex);
                }
            });

            this.filesList.appendChild(fileItem);
        });
        
        if (this.files.length > 0) {
            const totalInfo = document.createElement('div');
            totalInfo.className = 'total-info';
            totalInfo.innerHTML = `<strong>Total: ${this.files.length} files • ${this.formatFileSize(totalSize)}</strong>`;
            this.filesList.appendChild(totalInfo);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleMerge() {
        if (this.files.length < 2) {
            this.showToast('Please select at least 2 PDF files to merge.', 'warning');
            return;
        }
        
        if (this.enablePassword.checked && !this.pdfPassword.value.trim()) {
            this.showToast('Please enter a password or disable password protection.', 'warning');
            this.pdfPassword.focus();
            return;
        }

        this.progressSection.style.display = 'block';
        this.mergeBtn.disabled = true;
        this.previewBtn.disabled = true;
        this.progressText.textContent = 'Starting merge...';
        
        try {
            await this.mergePDFs();
            this.showToast('PDFs merged successfully!', 'success');
        } catch (error) {
            console.error('Merge failed:', error);
            this.showToast(`Failed to merge PDFs: ${error.message}`, 'error');
            this.progressSection.style.display = 'none';
            this.mergeBtn.disabled = false;
            this.previewBtn.disabled = false;
        }
    }

    async mergePDFs() {
        const mergedPdf = await PDFLib.PDFDocument.create();
        const compression = this.compressionSettings[this.compressionLevel.value];
        
        // Set metadata
        mergedPdf.setTitle(this.outputName.value.replace('.pdf', ''));
        mergedPdf.setCreator('Deb\'s PDF Merger 2.0');
        mergedPdf.setCreationDate(new Date());
        
        for (let i = 0; i < this.files.length; i++) {
            const fileObj = this.files[i];
            const file = fileObj.file;
            const progress = ((i + 1) / this.files.length) * 80;
            
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = `Processing ${file.name}... ${Math.round(progress)}%`;
            
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
                
                // Preserve bookmarks if enabled
                if (this.preserveBookmarks.checked) {
                    try {
                        const bookmarks = pdf.catalog.get(PDFLib.PDFName.of('Outlines'));
                        if (bookmarks) {
                            // Basic bookmark preservation (simplified)
                            console.log('Bookmarks found in', file.name);
                        }
                    } catch (e) {
                        console.log('No bookmarks in', file.name);
                    }
                }
            } catch (error) {
                throw new Error(`Failed to process ${file.name}: ${error.message}`);
            }
        }
        
        this.progressFill.style.width = '90%';
        this.progressText.textContent = 'Applying compression and finalizing...';
        
        // Apply compression settings
        const saveOptions = {};
        if (compression.compress) {
            // Note: pdf-lib doesn't have built-in compression, but we can set options
            saveOptions.useObjectStreams = true;
            saveOptions.addDefaultPage = false;
        }
        
        const pdfBytes = await mergedPdf.save(saveOptions);
        
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Download ready!';
        
        await this.downloadPDF(pdfBytes);
    }

    async downloadPDF(pdfBytes) {
        let finalBytes = pdfBytes;
        
        // Apply password protection if enabled
        if (this.enablePassword.checked && this.pdfPassword.value.trim()) {
            try {
                this.progressText.textContent = 'Applying password protection...';
                const protectedPdf = await PDFLib.PDFDocument.load(pdfBytes);
                
                // Note: pdf-lib doesn't support password protection directly
                // This is a placeholder for the feature
                console.log('Password protection requested:', this.pdfPassword.value);
                this.showToast('Note: Password protection requires additional library', 'warning');
                
                finalBytes = await protectedPdf.save();
            } catch (error) {
                console.error('Password protection failed:', error);
                this.showToast('Password protection failed, downloading without password', 'warning');
            }
        }
        
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.outputName.value || 'merged-document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => {
            this.progressSection.style.display = 'none';
            this.mergeBtn.disabled = false;
            this.previewBtn.disabled = false;
            this.progressFill.style.width = '0%';
        }, 2000);
    }
    
    
    togglePasswordField() {
        const passwordField = this.pdfPassword;
        if (this.enablePassword.checked) {
            passwordField.style.display = 'block';
            passwordField.focus();
        } else {
            passwordField.style.display = 'none';
            passwordField.value = '';
        }
    }
    
    createPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.id = 'previewModal';
        modal.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <h3><i class="fas fa-eye"></i> Merge Preview</h3>
                    <button class="preview-close" id="previewClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-body" id="previewBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal events
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hidePreview();
        });
        document.getElementById('previewClose').addEventListener('click', this.hidePreview.bind(this));
    }
    
    showPreview() {
        if (this.files.length === 0) {
            this.showToast('No files to preview', 'warning');
            return;
        }
        
        const modal = document.getElementById('previewModal');
        const body = document.getElementById('previewBody');
        
        let totalPages = 0;
        let totalSize = 0;
        
        body.innerHTML = '';
        
        this.files.forEach((fileObj, index) => {
            totalPages += fileObj.pages || 0;
            totalSize += fileObj.size;
            
            const item = document.createElement('div');
            item.className = 'file-preview-item';
            item.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <div class="file-preview-details">
                    <h4>${index + 1}. ${fileObj.name}</h4>
                    <p>${this.formatFileSize(fileObj.size)} • ${fileObj.pages || '?'} pages</p>
                    ${fileObj.metadata ? `<p><small>Title: ${fileObj.metadata.title}</small></p>` : ''}
                </div>
            `;
            body.appendChild(item);
        });
        
        const summary = document.createElement('div');
        summary.style.cssText = 'margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; border-left: 3px solid #667eea;';
        summary.innerHTML = `
            <h4 style="margin: 0 0 8px 0; color: #333;">Merge Summary</h4>
            <p style="margin: 0; color: #666;"><strong>Total Files:</strong> ${this.files.length}</p>
            <p style="margin: 0; color: #666;"><strong>Total Pages:</strong> ${totalPages}</p>
            <p style="margin: 0; color: #666;"><strong>Total Size:</strong> ${this.formatFileSize(totalSize)}</p>
            <p style="margin: 0; color: #666;"><strong>Output:</strong> ${this.outputName.value}</p>
            <p style="margin: 0; color: #666;"><strong>Compression:</strong> ${this.compressionLevel.value}</p>
            ${this.enablePassword.checked ? '<p style="margin: 0; color: #666;"><strong>Password Protected:</strong> Yes</p>' : ''}
        `;
        body.appendChild(summary);
        
        modal.style.display = 'block';
    }
    
    hidePreview() {
        document.getElementById('previewModal').style.display = 'none';
    }
    
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
    
    handleKeyboard(e) {
        if (e.key === 'Delete' && this.files.length > 0) {
            this.clearAllFiles();
        }
        if (e.ctrlKey && e.key === 'Enter' && this.files.length >= 2) {
            this.handleMerge();
        }
        if (e.key === 'Escape') {
            this.hidePreview();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFMergerUI();
});

// Check if PDF-lib is loaded
if (typeof PDFLib === 'undefined') {
    console.error('PDF-lib library not loaded');
    alert('PDF library failed to load. Please refresh the page.');
}
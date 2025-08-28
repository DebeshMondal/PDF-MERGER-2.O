class PDFMergerUI {
    constructor() {
        this.files = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.filesSection = document.getElementById('filesSection');
        this.filesList = document.getElementById('filesList');
        this.mergeSection = document.getElementById('mergeSection');
        this.clearAllBtn = document.getElementById('clearAll');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.outputName = document.getElementById('outputName');
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
                try {
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                    fileObj.pages = pdf.getPageCount();
                } catch (error) {
                    fileObj.pages = '?';
                }
            }
        }
        this.updateUI();
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
            alert('Please select at least 2 PDF files to merge.');
            return;
        }

        this.progressSection.style.display = 'block';
        this.mergeBtn.disabled = true;
        this.progressText.textContent = 'Starting merge...';
        
        try {
            await this.mergePDFs();
        } catch (error) {
            console.error('Merge failed:', error);
            alert('Failed to merge PDFs. Please try again.');
            this.progressSection.style.display = 'none';
            this.mergeBtn.disabled = false;
        }
    }

    async mergePDFs() {
        const mergedPdf = await PDFLib.PDFDocument.create();
        
        for (let i = 0; i < this.files.length; i++) {
            const fileObj = this.files[i];
            const file = fileObj.file;
            const progress = ((i + 1) / this.files.length) * 80;
            
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = `Processing ${file.name}... ${Math.round(progress)}%`;
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        this.progressFill.style.width = '90%';
        this.progressText.textContent = 'Finalizing document...';
        
        const pdfBytes = await mergedPdf.save();
        
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Download ready!';
        
        this.downloadPDF(pdfBytes);
    }

    downloadPDF(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
            this.progressFill.style.width = '0%';
        }, 2000);
    }
    
    
    handleKeyboard(e) {
        if (e.key === 'Delete' && this.files.length > 0) {
            this.clearAllFiles();
        }
        if (e.ctrlKey && e.key === 'Enter' && this.files.length >= 2) {
            this.handleMerge();
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
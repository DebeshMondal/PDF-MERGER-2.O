class PDFSplitterUI {
    constructor() {
        this.pdfFile = null;
        this.pdfDocument = null;
        this.totalPages = 0;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.splitSection = document.getElementById('splitSection');
        this.pdfInfo = document.getElementById('pdfInfo');
        this.splitBtn = document.getElementById('splitBtn');
        this.rangeInputs = document.getElementById('rangeInputs');
        this.customPages = document.getElementById('customPages');
        this.startPage = document.getElementById('startPage');
        this.endPage = document.getElementById('endPage');
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

        // Split mode radio buttons
        document.querySelectorAll('input[name="splitMode"]').forEach(radio => {
            radio.addEventListener('change', this.handleSplitModeChange.bind(this));
        });

        // Split button
        this.splitBtn.addEventListener('click', this.handleSplit.bind(this));

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
        if (files.length > 0) {
            this.loadPDF(files[0]);
        } else {
            this.showToast('Please drop a PDF file', 'warning');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadPDF(file);
        }
    }

    async loadPDF(file) {
        this.pdfFile = file;
        this.showToast('Loading PDF...', 'info');
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDocument = await PDFLib.PDFDocument.load(arrayBuffer);
            this.totalPages = this.pdfDocument.getPageCount();
            
            this.displayPDFInfo();
            this.splitSection.style.display = 'block';
            this.showToast('PDF loaded successfully!', 'success');
        } catch (error) {
            console.error('Failed to load PDF:', error);
            this.showToast(`Failed to load PDF: ${error.message}`, 'error');
        }
    }

    displayPDFInfo() {
        const fileSize = this.formatFileSize(this.pdfFile.size);
        const title = this.pdfDocument.getTitle() || 'Untitled';
        const author = this.pdfDocument.getAuthor() || 'Unknown';
        
        this.pdfInfo.innerHTML = `
            <div class="pdf-info-card">
                <div class="pdf-info-item">
                    <i class="fas fa-file-pdf"></i>
                    <div>
                        <h4>${this.pdfFile.name}</h4>
                        <p>${fileSize} • ${this.totalPages} pages</p>
                    </div>
                </div>
                <div class="pdf-metadata">
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Author:</strong> ${author}</p>
                </div>
            </div>
        `;
        
        // Update range inputs max values
        this.startPage.max = this.totalPages;
        this.endPage.max = this.totalPages;
        this.endPage.value = this.totalPages;
    }

    handleSplitModeChange(e) {
        const mode = e.target.value;
        
        // Hide all conditional inputs
        this.rangeInputs.style.display = 'none';
        this.customPages.style.display = 'none';
        
        // Show relevant inputs
        if (mode === 'range') {
            this.rangeInputs.style.display = 'flex';
        } else if (mode === 'custom') {
            this.customPages.style.display = 'block';
        }
    }

    async handleSplit() {
        if (!this.pdfDocument) {
            this.showToast('Please load a PDF file first', 'warning');
            return;
        }

        const mode = document.querySelector('input[name="splitMode"]:checked').value;
        let pagesToExtract = [];

        try {
            switch (mode) {
                case 'all':
                    pagesToExtract = Array.from({length: this.totalPages}, (_, i) => i);
                    break;
                case 'range':
                    const start = parseInt(this.startPage.value) - 1;
                    const end = parseInt(this.endPage.value) - 1;
                    if (isNaN(start) || isNaN(end) || start < 0 || end >= this.totalPages || start > end) {
                        this.showToast('Invalid page range', 'error');
                        return;
                    }
                    pagesToExtract = Array.from({length: end - start + 1}, (_, i) => start + i);
                    break;
                case 'custom':
                    pagesToExtract = this.parseCustomPages(this.customPages.value);
                    if (pagesToExtract.length === 0) {
                        this.showToast('Invalid page selection', 'error');
                        return;
                    }
                    break;
            }

            await this.splitPDF(pagesToExtract, mode);
        } catch (error) {
            console.error('Split failed:', error);
            this.showToast(`Split failed: ${error.message}`, 'error');
            this.progressSection.style.display = 'none';
            this.splitBtn.disabled = false;
        }
    }

    parseCustomPages(input) {
        const pages = [];
        const parts = input.split(',');
        
        for (let part of parts) {
            part = part.trim();
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= this.totalPages) {
                    for (let i = start - 1; i < end; i++) {
                        if (!pages.includes(i)) pages.push(i);
                    }
                }
            } else {
                const pageNum = parseInt(part);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.totalPages) {
                    if (!pages.includes(pageNum - 1)) pages.push(pageNum - 1);
                }
            }
        }
        
        return pages.sort((a, b) => a - b);
    }

    async splitPDF(pagesToExtract, mode) {
        this.progressSection.style.display = 'block';
        this.splitBtn.disabled = true;
        
        if (mode === 'all') {
            // Split into individual pages
            for (let i = 0; i < pagesToExtract.length; i++) {
                const pageIndex = pagesToExtract[i];
                const progress = ((i + 1) / pagesToExtract.length) * 100;
                
                this.progressFill.style.width = progress + '%';
                this.progressText.textContent = `Creating page ${pageIndex + 1}... ${Math.round(progress)}%`;
                
                const newPdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(this.pdfDocument, [pageIndex]);
                newPdf.addPage(copiedPage);
                
                const pdfBytes = await newPdf.save();
                const fileName = `${this.pdfFile.name.replace('.pdf', '')}_page_${pageIndex + 1}.pdf`;
                this.downloadPDF(pdfBytes, fileName);
                
                // Small delay to prevent browser from blocking downloads
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } else {
            // Create single PDF with selected pages
            this.progressText.textContent = 'Creating PDF with selected pages...';
            this.progressFill.style.width = '50%';
            
            const newPdf = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdf.copyPages(this.pdfDocument, pagesToExtract);
            
            copiedPages.forEach(page => newPdf.addPage(page));
            
            this.progressFill.style.width = '90%';
            this.progressText.textContent = 'Finalizing PDF...';
            
            const pdfBytes = await newPdf.save();
            const fileName = mode === 'range' 
                ? `${this.pdfFile.name.replace('.pdf', '')}_pages_${this.startPage.value}-${this.endPage.value}.pdf`
                : `${this.pdfFile.name.replace('.pdf', '')}_selected_pages.pdf`;
            
            this.downloadPDF(pdfBytes, fileName);
        }
        
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Split complete!';
        
        setTimeout(() => {
            this.progressSection.style.display = 'none';
            this.splitBtn.disabled = false;
            this.progressFill.style.width = '0%';
        }, 2000);
        
        this.showToast(`PDF split successfully! ${pagesToExtract.length} ${pagesToExtract.length === 1 ? 'page' : 'pages'} extracted.`, 'success');
    }

    downloadPDF(pdfBytes, fileName) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        if (e.ctrlKey && e.key === 'Enter' && this.pdfDocument) {
            this.handleSplit();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFSplitterUI();
});

// Check if PDF-lib is loaded
if (typeof PDFLib === 'undefined') {
    console.error('PDF-lib library not loaded');
    alert('PDF library failed to load. Please refresh the page.');
}
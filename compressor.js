class PDFCompressor {
    constructor() {
        this.file = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfoSection = document.getElementById('fileInfoSection');
        this.compressionSection = document.getElementById('compressionSection');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.removeFileBtn = document.getElementById('removeFile');
        this.compressionLevel = document.getElementById('compressionLevel');
        this.outputName = document.getElementById('outputName');
        this.originalSize = document.getElementById('originalSize');
        this.estimatedSize = document.getElementById('estimatedSize');
        this.reductionPercent = document.getElementById('reductionPercent');
        this.compressBtn = document.getElementById('compressBtn');
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

        // Remove file button
        this.removeFileBtn.addEventListener('click', this.removeFile.bind(this));

        // Compression level change
        this.compressionLevel.addEventListener('change', this.updateEstimates.bind(this));

        // Compress button
        this.compressBtn.addEventListener('click', this.handleCompress.bind(this));
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
            this.addFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.addFile(file);
        }
    }

    addFile(file) {
        this.file = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.originalSize.textContent = this.formatFileSize(file.size);
        
        // Update output filename
        const nameWithoutExt = file.name.replace('.pdf', '');
        this.outputName.value = `${nameWithoutExt}-compressed.pdf`;
        
        this.fileInfoSection.style.display = 'block';
        this.compressionSection.style.display = 'block';
        this.updateEstimates();
    }

    removeFile() {
        this.file = null;
        this.fileInfoSection.style.display = 'none';
        this.compressionSection.style.display = 'none';
        this.fileInput.value = '';
    }

    updateEstimates() {
        if (!this.file) return;
        
        const level = this.compressionLevel.value;
        let reductionFactor;
        
        switch (level) {
            case 'low': reductionFactor = 0.85; break;
            case 'medium': reductionFactor = 0.70; break;
            case 'high': reductionFactor = 0.55; break;
            default: reductionFactor = 0.70;
        }
        
        const estimatedSize = this.file.size * reductionFactor;
        const reduction = ((this.file.size - estimatedSize) / this.file.size * 100).toFixed(0);
        
        this.estimatedSize.textContent = this.formatFileSize(estimatedSize);
        this.reductionPercent.textContent = `${reduction}%`;
    }

    async handleCompress() {
        if (!this.file) {
            alert('Please select a PDF file to compress.');
            return;
        }

        this.progressSection.style.display = 'block';
        this.compressBtn.disabled = true;
        this.progressText.textContent = 'Loading PDF...';
        
        try {
            await this.compressPDF();
        } catch (error) {
            console.error('Compression failed:', error);
            alert('Failed to compress PDF. Please try again.');
            this.progressSection.style.display = 'none';
            this.compressBtn.disabled = false;
        }
    }

    async compressPDF() {
        this.progressFill.style.width = '20%';
        this.progressText.textContent = 'Reading PDF...';
        
        const arrayBuffer = await this.file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        
        this.progressFill.style.width = '50%';
        this.progressText.textContent = 'Compressing...';
        
        // Create new PDF with compression
        const compressedPdf = await PDFLib.PDFDocument.create();
        const pages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
        
        pages.forEach((page) => compressedPdf.addPage(page));
        
        this.progressFill.style.width = '80%';
        this.progressText.textContent = 'Finalizing...';
        
        // Save with compression options
        const pdfBytes = await compressedPdf.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectStreamsThreshold: 1,
            updateFieldAppearances: false
        });
        
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Download ready!';
        
        this.downloadPDF(pdfBytes);
    }

    downloadPDF(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.outputName.value || 'compressed-document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show actual compression results
        const originalSize = this.file.size;
        const compressedSize = pdfBytes.length;
        const actualReduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        setTimeout(() => {
            this.progressText.textContent = `Compressed! Reduced by ${actualReduction}%`;
            setTimeout(() => {
                this.progressSection.style.display = 'none';
                this.compressBtn.disabled = false;
                this.progressFill.style.width = '0%';
            }, 3000);
        }, 1000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the compressor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFCompressor();
});
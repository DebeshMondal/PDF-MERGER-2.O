class ImageToPDFConverter {
    constructor() {
        this.images = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.imagesSection = document.getElementById('imagesSection');
        this.imagesGrid = document.getElementById('imagesGrid');
        this.convertSection = document.getElementById('convertSection');
        this.clearAllBtn = document.getElementById('clearAll');
        this.pageSize = document.getElementById('pageSize');
        this.orientation = document.getElementById('orientation');
        this.quality = document.getElementById('quality');
        this.outputName = document.getElementById('outputName');
        this.convertBtn = document.getElementById('convertBtn');
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
        this.clearAllBtn.addEventListener('click', this.clearAllImages.bind(this));

        // Convert button
        this.convertBtn.addEventListener('click', this.handleConvert.bind(this));
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
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        this.addImages(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addImages(files);
    }

    addImages(newFiles) {
        newFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.images.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    url: URL.createObjectURL(file)
                });
            }
        });
        this.updateUI();
    }

    removeImage(index) {
        URL.revokeObjectURL(this.images[index].url);
        this.images.splice(index, 1);
        this.updateUI();
    }

    clearAllImages() {
        this.images.forEach(img => URL.revokeObjectURL(img.url));
        this.images = [];
        this.updateUI();
    }

    moveImage(fromIndex, toIndex) {
        const image = this.images.splice(fromIndex, 1)[0];
        this.images.splice(toIndex, 0, image);
        this.updateUI();
    }

    updateUI() {
        if (this.images.length === 0) {
            this.imagesSection.style.display = 'none';
            this.convertSection.style.display = 'none';
            return;
        }

        this.imagesSection.style.display = 'block';
        this.convertSection.style.display = 'block';
        this.renderImagesGrid();
    }

    renderImagesGrid() {
        this.imagesGrid.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.draggable = true;
            
            imageCard.innerHTML = `
                <div class="image-preview">
                    <img src="${image.url}" alt="${image.name}">
                    <div class="image-overlay">
                        <button class="btn-icon move-up" title="Move up" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn-icon move-down" title="Move down" ${index === this.images.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn-icon remove" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="image-info">
                    <h4>${image.name}</h4>
                    <p>${this.formatFileSize(image.size)}</p>
                </div>
            `;

            // Add event listeners
            const removeBtn = imageCard.querySelector('.remove');
            const moveUpBtn = imageCard.querySelector('.move-up');
            const moveDownBtn = imageCard.querySelector('.move-down');

            removeBtn.addEventListener('click', () => this.removeImage(index));
            
            if (!moveUpBtn.disabled) {
                moveUpBtn.addEventListener('click', () => this.moveImage(index, index - 1));
            }
            
            if (!moveDownBtn.disabled) {
                moveDownBtn.addEventListener('click', () => this.moveImage(index, index + 1));
            }

            // Drag and drop for reordering
            imageCard.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                imageCard.classList.add('dragging');
            });

            imageCard.addEventListener('dragend', () => {
                imageCard.classList.remove('dragging');
            });

            imageCard.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            imageCard.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;
                if (fromIndex !== toIndex) {
                    this.moveImage(fromIndex, toIndex);
                }
            });

            this.imagesGrid.appendChild(imageCard);
        });
    }

    async handleConvert() {
        if (this.images.length === 0) {
            alert('Please select at least one image to convert.');
            return;
        }

        this.progressSection.style.display = 'block';
        this.convertBtn.disabled = true;
        this.progressText.textContent = 'Starting conversion...';
        
        try {
            await this.convertToPDF();
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to convert images to PDF. Please try again.');
            this.progressSection.style.display = 'none';
            this.convertBtn.disabled = false;
        }
    }

    async convertToPDF() {
        const pdfDoc = await PDFLib.PDFDocument.create();
        
        for (let i = 0; i < this.images.length; i++) {
            const image = this.images[i];
            const progress = ((i + 1) / this.images.length) * 80;
            
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = `Processing ${image.name}... ${Math.round(progress)}%`;
            
            // Load image
            const imageBytes = await this.getImageBytes(image.file);
            let pdfImage;
            
            if (image.file.type === 'image/jpeg' || image.file.type === 'image/jpg') {
                pdfImage = await pdfDoc.embedJpg(imageBytes);
            } else {
                pdfImage = await pdfDoc.embedPng(imageBytes);
            }
            
            // Calculate page dimensions
            const { width, height } = this.calculatePageDimensions(pdfImage);
            
            // Add page and image
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(pdfImage, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });
        }
        
        this.progressFill.style.width = '90%';
        this.progressText.textContent = 'Finalizing PDF...';
        
        const pdfBytes = await pdfDoc.save();
        
        this.progressFill.style.width = '100%';
        this.progressText.textContent = 'Download ready!';
        
        this.downloadPDF(pdfBytes);
    }

    async getImageBytes(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.readAsArrayBuffer(file);
        });
    }

    calculatePageDimensions(pdfImage) {
        const pageSize = this.pageSize.value;
        const orientation = this.orientation.value;
        
        let pageWidth, pageHeight;
        
        // Standard page sizes in points (72 points = 1 inch)
        const sizes = {
            a4: { width: 595, height: 842 },
            letter: { width: 612, height: 792 },
            a3: { width: 842, height: 1191 }
        };
        
        if (pageSize === 'auto') {
            // Use image dimensions
            pageWidth = pdfImage.width;
            pageHeight = pdfImage.height;
        } else {
            const size = sizes[pageSize];
            
            if (orientation === 'landscape') {
                pageWidth = size.height;
                pageHeight = size.width;
            } else if (orientation === 'portrait') {
                pageWidth = size.width;
                pageHeight = size.height;
            } else { // auto orientation
                const imageRatio = pdfImage.width / pdfImage.height;
                const pageRatio = size.width / size.height;
                
                if (imageRatio > pageRatio) {
                    // Image is wider, use landscape
                    pageWidth = size.height;
                    pageHeight = size.width;
                } else {
                    // Image is taller, use portrait
                    pageWidth = size.width;
                    pageHeight = size.height;
                }
            }
        }
        
        return { width: pageWidth, height: pageHeight };
    }

    downloadPDF(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.outputName.value || 'images-to-pdf.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => {
            this.progressSection.style.display = 'none';
            this.convertBtn.disabled = false;
            this.progressFill.style.width = '0%';
        }, 2000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the converter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageToPDFConverter();
});
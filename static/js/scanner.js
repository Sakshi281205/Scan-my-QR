// Global variables
let stream = null;
let scanning = false;
let scanInterval = null;
let lastScannedData = null;

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const stopCameraBtn = document.getElementById('stopCamera');
const cameraStatus = document.getElementById('cameraStatus');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const scanImageBtn = document.getElementById('scanImage');
const resultsContainer = document.getElementById('resultsContainer');
const clearResultsBtn = document.getElementById('clearResults');
const loadingOverlay = document.getElementById('loadingOverlay');
const scanAnotherBtn = document.getElementById('scanAnother');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkCameraSupport();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Camera controls
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    
    // File upload
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    scanImageBtn.addEventListener('click', scanUploadedImage);
    
    // Results
    clearResultsBtn.addEventListener('click', clearResults);
    scanAnotherBtn.addEventListener('click', scanAnother);
}

// Check if camera is supported
function checkCameraSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Camera is not supported in this browser', 'error');
        startCameraBtn.disabled = true;
        cameraStatus.textContent = 'Camera not supported';
    }
}

// Start camera
async function startCamera() {
    try {
        showLoading(true);
        
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment' // Use back camera on mobile
            }
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        video.addEventListener('loadedmetadata', () => {
            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'inline-flex';
            cameraStatus.textContent = 'Camera active - scanning for QR codes...';
            startScanning();
        });
        
        showNotification('Camera started successfully', 'success');
        
    } catch (error) {
        console.error('Error starting camera:', error);
        showNotification('Failed to start camera: ' + error.message, 'error');
        cameraStatus.textContent = 'Camera failed to start';
    } finally {
        showLoading(false);
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    scanning = false;
    video.srcObject = null;
    
    startCameraBtn.style.display = 'inline-flex';
    stopCameraBtn.style.display = 'none';
    cameraStatus.textContent = 'Camera stopped';
    
    showNotification('Camera stopped', 'warning');
}

// Start scanning for QR codes
function startScanning() {
    if (scanning) return;
    
    scanning = true;
    scanInterval = setInterval(captureAndScan, 1000); // Scan every second
}

// Capture video frame and scan for QR codes
function captureAndScan() {
    if (!video.videoWidth || !video.videoHeight) return;
    
    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Send to server for scanning
    scanFrame(imageData);
}

// Send frame to server for QR scanning
async function scanFrame(imageData) {
    try {
        const response = await fetch('/scan_frame', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });
        
        const result = await response.json();
        
        if (result.success && result.results.length > 0) {
            // Check if this is a new QR code
            const newData = result.results[0].data;
            if (newData !== lastScannedData) {
                lastScannedData = newData;
                addResult(result.results[0]);
                showNotification('QR code detected!', 'success');
                
                // Optional: Stop scanning after successful detection
                // stopCamera();
            }
        }
        
    } catch (error) {
        console.error('Error scanning frame:', error);
    }
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        displayImagePreview(file);
    }
}

// Handle drag and drop
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            fileInput.files = files;
            displayImagePreview(file);
        } else {
            showNotification('Please select an image file', 'error');
        }
    }
}

// Display image preview
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        uploadArea.style.display = 'none';
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Scan uploaded image
async function scanUploadedImage() {
    const file = fileInput.files[0];
    if (!file) {
        showNotification('Please select an image first', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success && result.results.length > 0) {
            result.results.forEach(qrCode => {
                addResult(qrCode);
            });
            showNotification(`Found ${result.results.length} QR code(s)`, 'success');
        } else {
            showNotification(result.message || 'No QR codes found', 'warning');
        }
        
    } catch (error) {
        console.error('Error scanning image:', error);
        showNotification('Error scanning image: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Add result to results container
function addResult(qrCode) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    const timestamp = new Date().toLocaleTimeString();
    // Check if data is a URL
    let isUrl = false;
    try {
        const url = new URL(qrCode.data);
        isUrl = url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) { isUrl = false; }
    resultItem.innerHTML = `
        <div class="result-header">
            <span class="result-type">${qrCode.type}</span>
            <span class="result-time">${timestamp}</span>
        </div>
        <div class="result-data">
            ${isUrl ? `<a href="${qrCode.data}" target="_blank" rel="noopener noreferrer">${qrCode.data}</a>` : qrCode.data}
            <button class="btn btn-outline btn-copy" title="Copy" data-copy="${qrCode.data}"><i class="fas fa-copy"></i></button>
            ${isUrl ? `<button class="btn btn-outline btn-open-link" title="Open Link" data-link="${qrCode.data}"><i class="fas fa-external-link-alt"></i></button>` : ''}
        </div>
    `;
    // Remove no-results message if it exists
    const noResults = resultsContainer.querySelector('.no-results');
    if (noResults) {
        noResults.remove();
    }
    resultsContainer.insertBefore(resultItem, resultsContainer.firstChild);
    // Show scan another button
    scanAnotherBtn.style.display = 'inline-flex';
}

// Scan Another feature
function scanAnother() {
    resetUploadArea();
    clearResults();
    scanAnotherBtn.style.display = 'none';
    // If camera is active, keep scanning
    if (stream) {
        startScanning();
        cameraStatus.textContent = 'Camera active - scanning for QR codes...';
    }
}

// Copy and open link handlers
document.addEventListener('click', function(event) {
    if (event.target.closest('.btn-copy')) {
        const btn = event.target.closest('.btn-copy');
        const text = btn.getAttribute('data-copy');
        copyToClipboard(text);
    }
    if (event.target.closest('.btn-open-link')) {
        const btn = event.target.closest('.btn-open-link');
        const link = btn.getAttribute('data-link');
        window.open(link, '_blank', 'noopener');
    }
    if (event.target.classList.contains('result-data')) {
        copyToClipboard(event.target.textContent);
    }
});

// Clear all results
function clearResults() {
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-info-circle"></i>
            <p>No QR codes scanned yet. Use the camera or upload an image to get started.</p>
        </div>
    `;
    lastScannedData = null;
    scanAnotherBtn.style.display = 'none';
    showNotification('Results cleared', 'warning');
}

// Show loading overlay
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    notification.className = `notification ${type}`;
    notificationMessage.textContent = message;
    notification.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
}

// Reset upload area
function resetUploadArea() {
    uploadArea.style.display = 'block';
    previewContainer.style.display = 'none';
    imagePreview.src = '';
    fileInput.value = '';
}

// Handle page visibility change (pause scanning when tab is not visible)
document.addEventListener('visibilitychange', function() {
    if (document.hidden && scanning) {
        // Pause scanning when tab is not visible
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
    } else if (!document.hidden && stream && !scanning) {
        // Resume scanning when tab becomes visible
        startScanning();
    }
});

// Handle page unload (clean up camera)
window.addEventListener('beforeunload', function() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Spacebar to start/stop camera
    if (event.code === 'Space' && !event.target.matches('input, textarea')) {
        event.preventDefault();
        if (stream) {
            stopCamera();
        } else {
            startCamera();
        }
    }
    
    // Escape to stop camera
    if (event.code === 'Escape' && stream) {
        stopCamera();
    }
    
    // C to clear results
    if (event.code === 'KeyC' && event.ctrlKey) {
        event.preventDefault();
        clearResults();
    }
});

// Copy QR code data to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
    });
} 
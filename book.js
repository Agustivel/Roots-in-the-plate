// Configure PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global variables
let pageFlip;
let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
let pageImages = [];

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    showLoading(true);
    await convertPDFToImages();
    await initPageFlip();
    setupEventListeners();
    generateThumbnails();
    showLoading(false);
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  }
}

// Convert PDF to images
async function convertPDFToImages() {
  try {
    updateProgress('טוען את הספר...');
    
    const loadingTask = pdfjsLib.getDocument('book.pdf');
    const pdf = await loadingTask.promise;
    
    const totalPages = pdf.numPages;
    document.getElementById('total-pages').textContent = totalPages;
    
    updateProgress(`ממיר ${totalPages} דפים לתמונות...`);
    
    for (let i = 1; i <= totalPages; i++) {
      updateProgress(`מעבד עמוד ${i} מתוך ${totalPages}...`);
      
      const page = await pdf.getPage(i);
      const scale = 4;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const imageUrl = canvas.toDataURL('image/jpeg', 0.98);
      pageImages.push(imageUrl);
    }
    
    updateProgress('סיים המרה! מכין את הספר...');
  } catch (error) {
    throw new Error('לא ניתן לטעון את ה-PDF. ודא שהקובץ book.pdf קיים בתיקייה');
  }
}

// Initialize PageFlip
function initPageFlip() {
  const bookElement = document.getElementById('book');
  
  pageFlip = new St.PageFlip(bookElement, {
    width: 550,
    height: 733,
    size: 'stretch',
    minWidth: 315,
    maxWidth: 1000,
    minHeight: 400,
    maxHeight: 1350,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false,
    useMouseEvents: true,
    swipeDistance: 30,
    clickEventForward: true,
    flippingTime: 1000,
    autoSize: true,
    rtl: true,
    startPage: 0,
    drawShadow: true,
    usePortrait: true,
  });

  pageFlip.loadFromImages(pageImages);

  pageFlip.on('flip', (e) => {
    updatePageIndicator(e.data);
    updateActiveThumbnail(e.data);
  });

  pageFlip.on('changeState', () => {
    updateNavigationButtons();
  });
}

// Generate thumbnails
function generateThumbnails() {
  const thumbnailsGrid = document.getElementById('thumbnails-grid');
  thumbnailsGrid.innerHTML = '';
  
  pageImages.forEach((imageUrl, index) => {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    if (index === 0) thumbnailItem.classList.add('active');
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = `עמוד ${index + 1}`;
    
    const pageNumber = document.createElement('div');
    pageNumber.className = 'thumbnail-page-number';
    pageNumber.textContent = `עמוד ${index + 1}`;
    
    thumbnailItem.appendChild(img);
    thumbnailItem.appendChild(pageNumber);
    
    thumbnailItem.addEventListener('click', () => {
      pageFlip.turnToPage(index);
      if (window.innerWidth < 768) {
        toggleThumbnails();
      }
    });
    
    thumbnailsGrid.appendChild(thumbnailItem);
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('first-page').addEventListener('click', () => pageFlip.turnToPage(0));
  document.getElementById('prev-page').addEventListener('click', () => pageFlip.flipPrev());
  document.getElementById('next-page').addEventListener('click', () => pageFlip.flipNext());
  document.getElementById('last-page').addEventListener('click', () => pageFlip.turnToPage(pageFlip.getPageCount() - 1));
  
  document.getElementById('zoom-in').addEventListener('click', zoomIn);
  document.getElementById('zoom-out').addEventListener('click', zoomOut);
  document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);
  document.getElementById('thumbnails-btn').addEventListener('click', toggleThumbnails);
  document.getElementById('close-thumbnails').addEventListener('click', toggleThumbnails);
  document.getElementById('download-btn').addEventListener('click', downloadPDF);
  
  // Help modal
  document.getElementById('help-btn').addEventListener('click', showHelp);
  document.querySelector('.modal-close').addEventListener('click', hideHelp);
  document.querySelector('.modal-overlay').addEventListener('click', hideHelp);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key) {
      case 'ArrowLeft':
        pageFlip.flipNext();
        e.preventDefault();
        break;
      case 'ArrowRight':
        pageFlip.flipPrev();
        e.preventDefault();
        break;
      case 'Home':
        pageFlip.turnToPage(0);
        e.preventDefault();
        break;
      case 'End':
        pageFlip.turnToPage(pageFlip.getPageCount() - 1);
        e.preventDefault();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 't':
      case 'T':
        toggleThumbnails();
        break;
      case '+':
      case '=':
        zoomIn();
        e.preventDefault();
        break;
      case '-':
      case '_':
        zoomOut();
        e.preventDefault();
        break;
    }
  });
  
  // Resize handler
  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      if (pageFlip) pageFlip.updateState();
    }, 200);
  });
}

// Update page indicator
function updatePageIndicator(pageNum) {
  document.getElementById('current-page').textContent = pageNum + 1;
}

// Update navigation buttons
function updateNavigationButtons() {
  const currentPage = pageFlip.getCurrentPageIndex();
  const totalPages = pageFlip.getPageCount();
  
  document.getElementById('first-page').disabled = currentPage === 0;
  document.getElementById('prev-page').disabled = currentPage === 0;
  document.getElementById('next-page').disabled = currentPage >= totalPages - 1;
  document.getElementById('last-page').disabled = currentPage >= totalPages - 1;
  document.getElementById('zoom-in').disabled = currentZoom >= MAX_ZOOM;
  document.getElementById('zoom-out').disabled = currentZoom <= MIN_ZOOM;
}

// Update active thumbnail
function updateActiveThumbnail(pageNum) {
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === pageNum);
  });
}

// Zoom functions
function zoomIn() {
  if (currentZoom < MAX_ZOOM) {
    currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    applyZoom();
  }
}

function zoomOut() {
  if (currentZoom > MIN_ZOOM) {
    currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    applyZoom();
  }
}

function applyZoom() {
  document.querySelector('.book-wrapper').style.transform = `scale(${currentZoom})`;
  document.querySelector('.book-wrapper').style.transformOrigin = 'center top';
  updateNavigationButtons();
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.querySelector('.book-page').requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Toggle thumbnails
function toggleThumbnails() {
  document.getElementById('thumbnails-panel').classList.toggle('hidden');
}

// Download PDF
function downloadPDF() {
  const link = document.createElement('a');
  link.href = 'book.pdf';
  link.download = 'שורשים_בצלחת.pdf';
  link.click();
}

// Help modal
function showHelp() {
  document.getElementById('help-modal').classList.remove('hidden');
}

function hideHelp() {
  document.getElementById('help-modal').classList.add('hidden');
}

// Loading functions
function showLoading(show) {
  const loading = document.getElementById('loading-overlay');
  if (show) {
    loading.classList.remove('hidden');
  } else {
    setTimeout(() => loading.classList.add('hidden'), 500);
  }
}

function updateProgress(text) {
  document.getElementById('loading-progress').textContent = text;
}

function showError(message) {
  const loading = document.getElementById('loading-overlay');
  loading.innerHTML = `
    <div class="loading-content">
      <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">שגיאה בטעינת הספר</h2>
      <p style="font-size: 1.2rem; margin-bottom: 2rem;">${message}</p>
      <button onclick="location.reload()" class="btn btn-primary">
        נסה שוב
      </button>
    </div>
  `;
}

// Touch gestures
let touchStartX = 0;
document.getElementById('book').addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

document.getElementById('book').addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      pageFlip.flipPrev();
    } else {
      pageFlip.flipNext();
    }
  }
});

console.log('ספר "שורשים בצלחת" טעון בהצלחה!');

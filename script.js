// Global variables
let pageFlip;
let currentZoom = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    // Show loading
    showLoading(true);

    // Initialize PageFlip
    await initPageFlip();

    // Try to load PDF, if fails create demo pages
    try {
      await loadPDF();
    } catch (error) {
      console.warn('PDF not found or CORS issue. Creating demo pages:', error);
      showCorsError();
      // Wait 3 seconds then show demo
      setTimeout(() => {
        createDemoPages();
        showLoading(false);
      }, 3000);
      return;
    }

    // Setup event listeners
    setupEventListeners();

    // Hide loading
    showLoading(false);

  } catch (error) {
    console.error('Initialization error:', error);
    showError(error);
  }
}

// Initialize PageFlip library
function initPageFlip() {
  const bookElement = document.getElementById('book');
  
  pageFlip = new St.PageFlip(bookElement, {
    width: 550,
    height: 750,
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
    flippingTime: 700,
    autoSize: true,
    rtl: true,
    startPage: 0,
    drawShadow: true,
    usePortrait: true,
  });

  // Handle page flip events
  pageFlip.on('flip', (e) => {
    updatePageIndicator(e.data);
    updateActiveThumbnail(e.data);
  });

  pageFlip.on('changeState', (e) => {
    updateNavigationButtons(e.data);
  });
}

// Load PDF and render pages
async function loadPDF() {
  // Try to load PDF using PageFlip's built-in loader
  await pageFlip.loadFromPDF('book.pdf');
  
  // Update total pages
  const totalPages = pageFlip.getPageCount();
  document.getElementById('total-pages').textContent = totalPages;
  document.getElementById('current-page').textContent = '1';

  // Generate thumbnails
  await generateThumbnails();
  
  // Setup event listeners after successful load
  setupEventListeners();
}

// Show CORS error with helpful message
function showCorsError() {
  const loading = document.getElementById('loading');
  loading.innerHTML = `
    <div style="text-align: center; color: white; max-width: 700px; margin: 0 auto;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">בעיית CORS - צריך שרת מקומי!</h2>
      
      <div style="background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin-bottom: 2rem;">
        <p style="font-size: 1.2rem; margin-bottom: 1.5rem;">
          <strong>הבעיה:</strong> אתה פותח את הקובץ ישירות מהדיסק<br>
          הדפדפן חוסם את זה מסיבות אבטחה
        </p>
        
        <div style="text-align: right; background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 10px; margin: 1rem 0;">
          <p style="margin-bottom: 1rem;"><strong>🚀 הפתרון הכי קל:</strong></p>
          <p style="font-family: monospace; background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 5px; direction: ltr; text-align: left;">
            cd /Users/agustivel/Desktop/recipe_book<br>
            python3 -m http.server 8000
          </p>
          <p style="margin-top: 1rem;">ואז פתח: <code style="background: rgba(0,0,0,0.5); padding: 0.3rem 0.6rem; border-radius: 5px;">http://localhost:8000</code></p>
        </div>

        <p style="font-size: 0.9rem; opacity: 0.9; margin-top: 1.5rem;">
          או אם יש לך VS Code:<br>
          התקן "Live Server" ולחץ ימני על index.html
        </p>
      </div>

      <p style="font-size: 1rem; opacity: 0.8;">
        בינתיים, מציג דוגמה להמחשה...<br>
        <span style="font-size: 0.9rem;">(הדמו ייטען בעוד 3 שניות)</span>
      </p>
    </div>
  `;
}

// Create demo pages when PDF is not available
function createDemoPages() {
  const demoContent = [
    {
      title: '📖 ספר המתכונים',
      subtitle: 'מבשלים מסלול מחדש',
      text: 'ברוכים הבאים!\n\nכדי לראות את הספר האמיתי:\n1. הרץ שרת מקומי\n2. רענן את הדף\n\nזו רק דוגמה'
    },
    {
      title: '⚠️ הערה חשובה',
      subtitle: 'בעיית CORS',
      text: 'הדפדפן חוסם טעינת PDF\nמהדיסק מסיבות אבטחה\n\nצריך להריץ שרת מקומי:\npython3 -m http.server 8000'
    },
    {
      title: '🎨 תכונות',
      subtitle: '',
      text: '• הפיכת עמודים אמיתית\n• זום פנימה וחוצה\n• מסך מלא\n• תמונות ממוזערות\n• קיצורי מקלדת\n• תמיכה במובייל'
    },
    {
      title: '⌨️ קיצורים',
      subtitle: 'מקלדת',
      text: '→ ← דפדוף עמודים\nHome/End קפיצה\nF מסך מלא\nT תמונות ממוזערות\n+ - זום'
    },
    {
      title: '📱 מובייל',
      subtitle: '',
      text: 'החלק שמאלה וימינה\nלדפדוף בין העמודים\n\nהאתר מותאם לחלוטין\nלמכשירים ניידים'
    },
    {
      title: '🚀 להתחיל',
      subtitle: 'פשוט!',
      text: '1. סגור את הדפדפן\n2. פתח Terminal\n3. cd לתיקייה\n4. python3 -m http.server 8000\n5. פתח localhost:8000'
    }
  ];

  const pages = [];
  
  demoContent.forEach((content, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 550;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 550, 750);
    if (index % 2 === 0) {
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
    } else {
      gradient.addColorStop(0, '#f093fb');
      gradient.addColorStop(1, '#f5576c');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 550, 750);
    
    // White content box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(40, 80, 470, 590);
    
    // Title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(content.title, 275, 160);
    
    // Subtitle
    if (content.subtitle) {
      ctx.fillStyle = '#718096';
      ctx.font = '24px Arial';
      ctx.fillText(content.subtitle, 275, 200);
    }
    
    // Text content
    ctx.fillStyle = '#4a5568';
    ctx.font = '24px Arial';
    ctx.textAlign = 'right';
    const lines = content.text.split('\n');
    const startY = content.subtitle ? 260 : 240;
    lines.forEach((line, i) => {
      ctx.fillText(line, 490, startY + (i * 40));
    });
    
    // Page number
    ctx.fillStyle = '#a0aec0';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`עמוד ${index + 1}`, 275, 700);
    
    pages.push(canvas);
  });

  // Load pages into PageFlip
  pageFlip.loadFromImages(pages);
  
  // Update page count
  document.getElementById('total-pages').textContent = demoContent.length;
  document.getElementById('current-page').textContent = '1';
  
  // Generate thumbnails
  generateDemoThumbnails(demoContent.length);
  
  // Setup event listeners
  setupEventListeners();
  
  // Disable download button for demo
  document.getElementById('download').disabled = true;
  document.getElementById('download').title = 'הורדה זמינה רק עם PDF אמיתי';
}

// Generate thumbnail previews
async function generateThumbnails() {
  const thumbnailsGrid = document.getElementById('thumbnails-grid');
  thumbnailsGrid.innerHTML = '';
  
  const totalPages = pageFlip.getPageCount();
  
  for (let i = 0; i < totalPages; i++) {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    if (i === 0) thumbnailItem.classList.add('active');
    
    thumbnailItem.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: #cbd5e0;
      ">
        📄
      </div>
      <div class="thumbnail-page-number">עמוד ${i + 1}</div>
    `;
    
    thumbnailItem.addEventListener('click', () => {
      pageFlip.turnToPage(i);
      if (window.innerWidth < 768) {
        toggleThumbnails();
      }
    });
    
    thumbnailsGrid.appendChild(thumbnailItem);
  }
}

// Generate demo thumbnails
function generateDemoThumbnails(count) {
  const thumbnailsGrid = document.getElementById('thumbnails-grid');
  thumbnailsGrid.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    if (i === 0) thumbnailItem.classList.add('active');
    
    const colors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#43e97b', '#38f9d7']
    ];
    const colorPair = colors[i % colors.length];
    
    thumbnailItem.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, ${colorPair[0]} 0%, ${colorPair[1]} 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
      ">
        ${i + 1}
      </div>
      <div class="thumbnail-page-number">עמוד ${i + 1}</div>
    `;
    
    thumbnailItem.addEventListener('click', () => {
      pageFlip.turnToPage(i);
      if (window.innerWidth < 768) {
        toggleThumbnails();
      }
    });
    
    thumbnailsGrid.appendChild(thumbnailItem);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation buttons
  document.getElementById('first').addEventListener('click', () => {
    pageFlip.turnToPage(0);
  });

  document.getElementById('prev').addEventListener('click', () => {
    pageFlip.flipPrev();
  });

  document.getElementById('next').addEventListener('click', () => {
    pageFlip.flipNext();
  });

  document.getElementById('last').addEventListener('click', () => {
    pageFlip.turnToPage(pageFlip.getPageCount() - 1);
  });

  // Zoom buttons
  document.getElementById('zoom-in').addEventListener('click', zoomIn);
  document.getElementById('zoom-out').addEventListener('click', zoomOut);

  // Fullscreen button
  document.getElementById('fullscreen').addEventListener('click', toggleFullscreen);

  // Thumbnails button
  document.getElementById('thumbnails').addEventListener('click', toggleThumbnails);
  document.getElementById('close-thumbnails').addEventListener('click', toggleThumbnails);

  // Download button
  document.getElementById('download').addEventListener('click', downloadPDF);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Handle resize
  window.addEventListener('resize', handleResize);
}

// Update page indicator
function updatePageIndicator(pageNum) {
  const currentPage = document.getElementById('current-page');
  currentPage.textContent = pageNum + 1;
}

// Update navigation buttons state
function updateNavigationButtons(state) {
  const firstBtn = document.getElementById('first');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const lastBtn = document.getElementById('last');

  const currentPage = pageFlip.getCurrentPageIndex();
  const totalPages = pageFlip.getPageCount();

  firstBtn.disabled = currentPage === 0;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= totalPages - 1;
  lastBtn.disabled = currentPage >= totalPages - 1;
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
  const bookContainer = document.querySelector('.book-container');
  bookContainer.style.transform = `scale(${currentZoom})`;
  bookContainer.style.transformOrigin = 'center top';
  
  document.getElementById('zoom-in').disabled = currentZoom >= MAX_ZOOM;
  document.getElementById('zoom-out').disabled = currentZoom <= MIN_ZOOM;
}

// Toggle fullscreen
function toggleFullscreen() {
  const container = document.querySelector('.app-container');
  
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Toggle thumbnails panel
function toggleThumbnails() {
  const panel = document.getElementById('thumbnails-panel');
  panel.classList.toggle('hidden');
}

// Download PDF
function downloadPDF() {
  const link = document.createElement('a');
  link.href = 'book.pdf';
  link.download = 'ספר_המתכונים_מבשלים_מסלול_מחדש.pdf';
  link.click();
}

// Keyboard shortcuts
function handleKeyboard(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }

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
}

// Handle window resize
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (pageFlip) {
      pageFlip.updateState();
    }
  }, 200);
}

// Show/hide loading overlay
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.remove('hidden');
  } else {
    setTimeout(() => {
      loading.classList.add('hidden');
    }, 500);
  }
}

// Show error message
function showError(error) {
  const loading = document.getElementById('loading');
  loading.innerHTML = `
    <div style="text-align: center; color: white;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">שגיאה בטעינת הספר</h2>
      <p style="font-size: 1.2rem; margin-bottom: 2rem;">
        ${error.message || 'שגיאה לא ידועה'}
      </p>
      <button onclick="location.reload()" style="
        background: white;
        color: #667eea;
        border: none;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
      ">
        נסה שוב
      </button>
    </div>
  `;
  showLoading(false);
}

// Prevent context menu
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'CANVAS' || e.target.closest('#book')) {
    e.preventDefault();
  }
});

// Prevent text selection on book
document.addEventListener('selectstart', (e) => {
  if (e.target.closest('#book')) {
    e.preventDefault();
  }
});

// Touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.getElementById('book').addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.getElementById('book').addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      pageFlip.flipNext();
    } else {
      pageFlip.flipPrev();
    }
  }
});
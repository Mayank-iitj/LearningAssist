// Popup UI Management
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI components
  initializeTabs();
  initializeThemeToggle();
  initializeBookmarksModal();
  initializeConnectionStatus();
  initializeActionButtons();
  initializeKeyboardNavigation();
  initializeAccessibility();
  
  // Check for activated feature from keyboard shortcut
  checkActivatedFeature();
  
  // Initialize feature functionality
  initializeSummarizer();
  initializeRewriter();
  initializeTranslator();
  initializeProofreader();
  initializePrompter();
  initializeMultimodalInput();
});

// Initialize keyboard navigation
function initializeKeyboardNavigation() {
  // Add tab navigation support
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, index) => {
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('role', 'tab');
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tab.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextTab = tabs[(index + 1) % tabs.length];
        nextTab.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevTab = tabs[(index - 1 + tabs.length) % tabs.length];
        prevTab.focus();
      }
    });
  });
  
  // Add button keyboard support
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });
}

// Initialize accessibility features
function initializeAccessibility() {
  // Set ARIA labels and roles
  document.querySelector('.feature-tabs').setAttribute('role', 'tablist');
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.setAttribute('role', 'tabpanel');
  });
  
  // Add live region for status updates
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.id = 'status-live-region';
  document.body.appendChild(liveRegion);
  
  // Add screen reader only class
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  document.head.appendChild(style);
}

// Check if a feature should be activated (from keyboard shortcut)
function checkActivatedFeature() {
  chrome.storage.local.get(['activateFeature', 'tempSelectedText'], function(result) {
    if (result.activateFeature) {
      // Activate the specified tab
      const targetTab = document.querySelector(`[data-tab="${result.activateFeature}"]`);
      if (targetTab) {
        targetTab.click();
        
        // If there's selected text, populate it
        if (result.tempSelectedText) {
          announceToScreenReader(`Selected text loaded for ${result.activateFeature}`);
        }
      }
      
      // Clear the activation flags
      chrome.storage.local.remove(['activateFeature', 'tempSelectedText']);
    }
  });
}

// Announce messages to screen readers
function announceToScreenReader(message) {
  const liveRegion = document.getElementById('status-live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

// Tab Navigation
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and panes
      tabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding pane
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Theme Toggle
function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  
  // Check if user previously set dark mode
  chrome.storage.local.get(['darkMode'], function(result) {
    if (result.darkMode) {
      document.body.classList.add('dark-theme');
      themeToggle.checked = true;
    }
  });
  
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.body.classList.add('dark-theme');
      chrome.storage.local.set({ darkMode: true });
    } else {
      document.body.classList.remove('dark-theme');
      chrome.storage.local.set({ darkMode: false });
    }
  });
}

// Bookmarks Modal
function initializeBookmarksModal() {
  const openBookmarksBtn = document.getElementById('openBookmarksBtn');
  const feedbackBtn = document.getElementById('feedbackBtn');
  const bookmarksModal = document.getElementById('bookmarksModal');
  const closeModal = document.querySelector('.close-modal');
  
  openBookmarksBtn.addEventListener('click', () => {
    bookmarksModal.style.display = 'block';
    loadBookmarks();
  });
  
  feedbackBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('feedback.html') });
    window.close();
  });
  
  closeModal.addEventListener('click', () => {
    bookmarksModal.style.display = 'none';
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === bookmarksModal) {
      bookmarksModal.style.display = 'none';
    }
  });
}

// Load saved bookmarks
function loadBookmarks() {
  const bookmarksList = document.querySelector('.bookmarks-list');
  
  chrome.storage.local.get(['bookmarks'], function(result) {
    bookmarksList.innerHTML = '';
    
    if (result.bookmarks && result.bookmarks.length > 0) {
      result.bookmarks.forEach(bookmark => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.className = 'bookmark-item';
        
        bookmarkItem.innerHTML = `
          <div class="bookmark-header">
            <span class="bookmark-title">${bookmark.title}</span>
            <span class="bookmark-date">${bookmark.date}</span>
          </div>
          <div class="bookmark-content">${bookmark.content}</div>
        `;
        
        bookmarksList.appendChild(bookmarkItem);
      });
    } else {
      bookmarksList.innerHTML = '<p class="placeholder-text">No bookmarks saved yet.</p>';
    }
  });
}

// Connection Status
function initializeConnectionStatus() {
  const connectionIcon = document.getElementById('connectionIcon');
  const connectionText = document.getElementById('connectionText');
  
  // Check online status
  if (navigator.onLine) {
    connectionIcon.className = 'online';
    connectionText.textContent = 'Online';
  } else {
    connectionIcon.className = 'offline';
    connectionText.textContent = 'Offline';
  }
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    connectionIcon.className = 'online';
    connectionText.textContent = 'Online';
  });
  
  window.addEventListener('offline', () => {
    connectionIcon.className = 'offline';
    connectionText.textContent = 'Offline';
  });
}

// Action Buttons (Copy, Save)
function initializeActionButtons() {
  // Copy buttons
  document.querySelectorAll('[id^="copy"]').forEach(button => {
    button.addEventListener('click', function() {
      const resultId = this.id.replace('copy', '') + 'Result';
      const resultText = document.getElementById(resultId).innerText;
      
      if (resultText && !resultText.includes('will appear here')) {
        navigator.clipboard.writeText(resultText).then(() => {
          showNotification('Copied to clipboard!');
        });
      }
    });
  });
  
  // Save buttons
  document.querySelectorAll('[id^="save"]').forEach(button => {
    button.addEventListener('click', function() {
      const featureType = this.id.replace('save', '').toLowerCase();
      const resultId = featureType + 'Result';
      const content = document.getElementById(resultId).innerText;
      
      if (content && !content.includes('will appear here')) {
        saveBookmark(featureType, content);
      }
    });
  });
}

// Save a bookmark
function saveBookmark(title, content) {
  chrome.storage.local.get(['bookmarks'], function(result) {
    const bookmarks = result.bookmarks || [];
    const date = new Date().toLocaleDateString();
    
    bookmarks.push({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      content: content,
      date: date
    });
    
    chrome.storage.local.set({ bookmarks: bookmarks }, function() {
      showNotification('Saved to bookmarks!');
    });
  });
}

// Show notification
function showNotification(message) {
  // Announce to screen readers
  announceToScreenReader(message);
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  
  // Add notification styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: var(--primary-color);
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    box-shadow: 0 2px 4px var(--shadow-color);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 2000);
}

// Get selected text from the active tab or temp storage
async function getSelectedText() {
  try {
    // First check if there's temp selected text from keyboard shortcut
    const result = await new Promise(resolve => {
      chrome.storage.local.get(['tempSelectedText'], resolve);
    });
    
    if (result.tempSelectedText) {
      // Clear temp text after using it
      chrome.storage.local.remove(['tempSelectedText']);
      return result.tempSelectedText;
    }
    
    // Otherwise get from current selection
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const [scriptResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });
    
    return scriptResult.result;
  } catch (error) {
    console.error('Error getting selected text:', error);
    return '';
  }
}

// Summarizer Feature
function initializeSummarizer() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryResult = document.getElementById('summaryResult');
  
  summarizeBtn.addEventListener('click', async () => {
    const selectedText = await getSelectedText();
    
    if (!selectedText) {
      summaryResult.innerHTML = '<p class="error-text">No text selected. Please select text on the page to summarize.</p>';
      return;
    }
    
    // Get settings
    const summaryLength = document.getElementById('summaryLength').value;
    const detailLevel = document.getElementById('detailLevel').value;
    
    // Show loading state
    summaryResult.innerHTML = '<p class="loading-text">Summarizing...</p>';
    
    try {
      // Call Chrome's Summarizer API
      const summary = await chrome.runtime.sendMessage({
        action: 'summarize',
        text: selectedText,
        options: {
          length: summaryLength,
          detailLevel: detailLevel
        }
      });
      
      summaryResult.innerText = summary;
    } catch (error) {
      summaryResult.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
  });
}

// Rewriter Feature
function initializeRewriter() {
  const rewriteBtn = document.getElementById('rewriteBtn');
  const rewriteResult = document.getElementById('rewriteResult');
  
  rewriteBtn.addEventListener('click', async () => {
    const selectedText = await getSelectedText();
    
    if (!selectedText) {
      rewriteResult.innerHTML = '<p class="error-text">No text selected. Please select text on the page to rewrite.</p>';
      return;
    }
    
    // Get settings
    const rewriteStyle = document.getElementById('rewriteStyle').value;
    const readingLevel = document.getElementById('readingLevel').value;
    
    // Show loading state
    rewriteResult.innerHTML = '<p class="loading-text">Rewriting...</p>';
    
    try {
      // Call Chrome's Rewriter API
      const rewrittenText = await chrome.runtime.sendMessage({
        action: 'rewrite',
        text: selectedText,
        options: {
          style: rewriteStyle,
          readingLevel: readingLevel
        }
      });
      
      rewriteResult.innerText = rewrittenText;
    } catch (error) {
      rewriteResult.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
  });
}

// Translator Feature
function initializeTranslator() {
  const translateBtn = document.getElementById('translateBtn');
  const translationResult = document.getElementById('translationResult');
  
  translateBtn.addEventListener('click', async () => {
    const selectedText = await getSelectedText();
    
    if (!selectedText) {
      translationResult.innerHTML = '<p class="error-text">No text selected. Please select text on the page to translate.</p>';
      return;
    }
    
    // Get target language
    const targetLanguage = document.getElementById('targetLanguage').value;
    
    // Show loading state
    translationResult.innerHTML = '<p class="loading-text">Translating...</p>';
    
    try {
      // Call Chrome's Translator API
      const translatedText = await chrome.runtime.sendMessage({
        action: 'translate',
        text: selectedText,
        options: {
          targetLanguage: targetLanguage
        }
      });
      
      translationResult.innerText = translatedText;
    } catch (error) {
      translationResult.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
  });
}

// Proofreader Feature
function initializeProofreader() {
  const proofreadBtn = document.getElementById('proofreadBtn');
  const proofreadResult = document.getElementById('proofreadResult');
  
  proofreadBtn.addEventListener('click', async () => {
    const inputText = document.getElementById('proofreadInput').value.trim();
    
    if (!inputText) {
      proofreadResult.innerHTML = '<p class="error-text">Please enter text to proofread.</p>';
      return;
    }
    
    // Show loading state
    proofreadResult.innerHTML = '<p class="loading-text">Proofreading...</p>';
    
    try {
      // Call Chrome's Proofreader API
      const proofreadData = await chrome.runtime.sendMessage({
        action: 'proofread',
        text: inputText
      });
      
      // Display results with highlighted corrections
      if (proofreadData.corrections && proofreadData.corrections.length > 0) {
        let textWithCorrections = inputText;
        let offsetAdjustment = 0;
        
        // Sort corrections by position to avoid issues with overlapping replacements
        proofreadData.corrections.sort((a, b) => a.start - b.start);
        
        // Apply corrections with HTML markup
        proofreadData.corrections.forEach(correction => {
          const start = correction.start + offsetAdjustment;
          const end = correction.end + offsetAdjustment;
          
          const before = textWithCorrections.substring(0, start);
          const errorText = textWithCorrections.substring(start, end);
          const after = textWithCorrections.substring(end);
          
          const correctionHTML = `<span class="correction">${errorText}<span class="correction-tooltip">${correction.message}: "${correction.suggestion}"</span></span>`;
          
          textWithCorrections = before + correctionHTML + after;
          
          // Adjust offset for next correction
          offsetAdjustment += (correctionHTML.length - errorText.length);
        });
        
        proofreadResult.innerHTML = textWithCorrections;
      } else {
        proofreadResult.innerHTML = '<p>No issues found. The text looks good!</p>';
      }
    } catch (error) {
      proofreadResult.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
  });
}

// Prompter/Questions Feature
function initializePrompter() {
  const generateQuestionsBtn = document.getElementById('generateQuestionsBtn');
  const questionsResult = document.getElementById('questionsResult');
  
  generateQuestionsBtn.addEventListener('click', async () => {
    const selectedText = await getSelectedText();
    
    if (!selectedText) {
      questionsResult.innerHTML = '<p class="error-text">No text selected. Please select text on the page to generate content.</p>';
      return;
    }
    
    // Get question type
    const questionType = document.getElementById('questionType').value;
    
    // Show loading state
    questionsResult.innerHTML = '<p class="loading-text">Generating...</p>';
    
    try {
      // Call Chrome's Prompt/Writer API
      const generatedContent = await chrome.runtime.sendMessage({
        action: 'generateContent',
        text: selectedText,
        options: {
          type: questionType
        }
      });
      
      // Format the generated content based on type
      if (questionType === 'quiz') {
        let formattedQuestions = '<ol>';
        generatedContent.forEach(item => {
          formattedQuestions += `
            <li>
              <p><strong>${item.question}</strong></p>
              <ul>
                ${item.options.map(option => `<li>${option}</li>`).join('')}
              </ul>
              <p><em>Answer: ${item.answer}</em></p>
            </li>
          `;
        });
        formattedQuestions += '</ol>';
        
        questionsResult.innerHTML = formattedQuestions;
      } else if (questionType === 'flashcards') {
        let formattedFlashcards = '';
        generatedContent.forEach((card, index) => {
          formattedFlashcards += `
            <div class="flashcard">
              <p><strong>Card ${index + 1}:</strong></p>
              <p><strong>Front:</strong> ${card.front}</p>
              <p><strong>Back:</strong> ${card.back}</p>
            </div>
          `;
        });
        
        questionsResult.innerHTML = formattedFlashcards;
      } else {
        questionsResult.innerText = generatedContent;
      }
    } catch (error) {
      questionsResult.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
    }
  });
}

// Multimodal Input
function initializeMultimodalInput() {
  const screenshotBtn = document.getElementById('screenshotBtn');
  const imageUpload = document.getElementById('imageUpload');
  
  // Screenshot button
  screenshotBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'takeScreenshot' });
    } catch (error) {
      showNotification('Error taking screenshot: ' + error.message);
    }
  });
  
  // Image upload
  imageUpload.addEventListener('change', async (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await chrome.runtime.sendMessage({
            action: 'processImage',
            imageData: e.target.result
          });
        } catch (error) {
          showNotification('Error processing image: ' + error.message);
        }
      };
      reader.readAsDataURL(file);
    }
  });
}
// Feedback form functionality
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeRatingSystem();
  initializeFeedbackForm();
});

function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  
  // Check for saved theme preference
  chrome.storage.local.get(['darkMode'], function(result) {
    if (result.darkMode) {
      document.body.classList.add('dark-theme');
      themeToggle.checked = true;
    }
  });
  
  // Theme toggle event listener
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

function initializeRatingSystem() {
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('rating');
  
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      const rating = index + 1;
      ratingInput.value = rating;
      
      // Update star display
      stars.forEach((s, i) => {
        if (i < rating) {
          s.classList.add('selected');
        } else {
          s.classList.remove('selected');
        }
      });
    });
    
    star.addEventListener('mouseover', () => {
      stars.forEach((s, i) => {
        if (i <= index) {
          s.style.color = '#ffd700';
        } else {
          s.style.color = '#ddd';
        }
      });
    });
  });
  
  // Reset on mouse leave
  document.querySelector('.rating-group').addEventListener('mouseleave', () => {
    const currentRating = parseInt(ratingInput.value) || 0;
    stars.forEach((s, i) => {
      if (i < currentRating) {
        s.style.color = '#ffd700';
      } else {
        s.style.color = '#ddd';
      }
    });
  });
}

function initializeFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  const cancelBtn = document.getElementById('cancelBtn');
  
  form.addEventListener('submit', handleFormSubmit);
  cancelBtn.addEventListener('click', () => window.close());
}

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const feedbackData = {
    feature: document.getElementById('featureUsed').value,
    rating: parseInt(document.getElementById('rating').value),
    feedback: document.getElementById('feedback').value,
    types: Array.from(document.querySelectorAll('input[name="feedbackType"]:checked'))
                 .map(cb => cb.value),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    extensionVersion: chrome.runtime.getManifest().version
  };
  
  // Validate required fields
  if (!feedbackData.feature || !feedbackData.rating) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }
  
  try {
    // Save feedback locally
    await saveFeedback(feedbackData);
    
    // Show success message
    showMessage('Thank you for your feedback!', 'success');
    
    // Close window after a delay
    setTimeout(() => {
      window.close();
    }, 2000);
    
  } catch (error) {
    console.error('Error saving feedback:', error);
    showMessage('Error saving feedback. Please try again.', 'error');
  }
}

async function saveFeedback(feedbackData) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userFeedback'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      
      const existingFeedback = result.userFeedback || [];
      existingFeedback.push(feedbackData);
      
      // Keep only the latest 50 feedback entries
      if (existingFeedback.length > 50) {
        existingFeedback.splice(0, existingFeedback.length - 50);
      }
      
      chrome.storage.local.set({ userFeedback: existingFeedback }, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          // Update usage statistics
          updateUsageStats(feedbackData.feature, feedbackData.rating);
          resolve();
        }
      });
    });
  });
}

function updateUsageStats(feature, rating) {
  chrome.storage.local.get(['usageStats'], function(result) {
    const stats = result.usageStats || {
      totalFeedback: 0,
      averageRating: 0,
      featureUsage: {},
      lastUpdated: null
    };
    
    stats.totalFeedback += 1;
    stats.averageRating = ((stats.averageRating * (stats.totalFeedback - 1)) + rating) / stats.totalFeedback;
    stats.featureUsage[feature] = (stats.featureUsage[feature] || 0) + 1;
    stats.lastUpdated = new Date().toISOString();
    
    chrome.storage.local.set({ usageStats: stats });
  });
}

function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMessage = document.querySelector('.feedback-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `feedback-message ${type}`;
  messageDiv.textContent = message;
  
  const colors = {
    success: '#4caf50',
    error: '#f44336',
    info: '#2196f3'
  };
  
  messageDiv.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${colors[type] || colors.info};
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(messageDiv);
  
  // Remove message after 3 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 3000);
}
// Chrome AI Learning Assistant - Content Script

// Initialize when content script is loaded
(() => {
  console.log('AI Learning Assistant content script loaded');
  
  // Add selection listeners
  document.addEventListener('mouseup', handleTextSelection);
  
  // Add message listener for communication with background script
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Add custom styles
  injectStyles();
})();

// Handle text selection
function handleTextSelection(event) {
  const selectedText = window.getSelection().toString().trim();
  
  // If text is selected, store it temporarily
  if (selectedText.length > 0) {
    chrome.storage.local.set({ lastSelectedText: selectedText });
  }
}

// Handle messages from background script
function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'getSelectedText':
      sendResponse({ text: window.getSelection().toString().trim() });
      break;
      
    case 'showFloatingButton':
      showFloatingButton(message.selectionRect);
      break;
      
    case 'showResultModal':
      showResultModal(message.type, message.result);
      break;
      
    case 'highlightCorrections':
      highlightCorrections(message.text, message.corrections);
      break;
      
    case 'displayImageResults':
      displayImageResults(message.description, message.imageData);
      break;
  }
  
  return true;
}

// Show floating action button near text selection
function showFloatingButton(selectionRect) {
  // Remove existing button if any
  removeFloatingButton();
  
  // Create floating button
  const button = document.createElement('div');
  button.id = 'ai-assistant-floating-button';
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
  
  // Position the button near the selection
  button.style.cssText = `
    position: absolute;
    top: ${selectionRect.bottom + window.scrollY + 10}px;
    left: ${selectionRect.left + window.scrollX}px;
    background-color: #4285f4;
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    transition: transform 0.2s;
  `;
  
  // Add hover effect
  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
  });
  
  // Add click handler
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup' });
    removeFloatingButton();
  });
  
  // Add button to the page
  document.body.appendChild(button);
  
  // Remove the button after 3 seconds
  setTimeout(removeFloatingButton, 3000);
}

// Remove floating button
function removeFloatingButton() {
  const button = document.getElementById('ai-assistant-floating-button');
  if (button) {
    button.parentNode.removeChild(button);
  }
}

// Show result modal
function showResultModal(type, result) {
  // Remove existing modal if any
  const existingModal = document.getElementById('ai-assistant-result-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'ai-assistant-result-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #dadce0;
  `;
  
  const title = document.createElement('h2');
  title.textContent = getModalTitle(type);
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    color: #4285f4;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  `;
  closeButton.onclick = () => {
    document.body.removeChild(modal);
  };
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create content
  const content = document.createElement('div');
  content.style.cssText = `
    font-size: 16px;
    line-height: 1.5;
  `;
  
  if (typeof result === 'string') {
    content.textContent = result;
  } else {
    content.innerHTML = formatResult(type, result);
  }
  
  // Create action buttons
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    gap: 8px;
  `;
  
  const copyButton = document.createElement('button');
  copyButton.textContent = 'Copy';
  copyButton.style.cssText = `
    padding: 6px 12px;
    background-color: #f8f9fa;
    border: 1px solid #dadce0;
    border-radius: 4px;
    cursor: pointer;
  `;
  copyButton.onclick = () => {
    const textToCopy = typeof result === 'string' ? result : JSON.stringify(result);
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyButton.textContent = 'Copied!';
      setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
    });
  };
  
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.style.cssText = `
    padding: 6px 12px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  saveButton.onclick = () => {
    saveResult(type, result);
    saveButton.textContent = 'Saved!';
    setTimeout(() => { saveButton.textContent = 'Save'; }, 2000);
  };
  
  actions.appendChild(copyButton);
  actions.appendChild(saveButton);
  
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(content);
  modalContent.appendChild(actions);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Get modal title based on type
function getModalTitle(type) {
  switch (type) {
    case 'summarizer': return 'Summary';
    case 'rewriter': return 'Rewritten Text';
    case 'translator': return 'Translation';
    case 'proofreader': return 'Proofread Result';
    case 'prompter': return 'Generated Content';
    case 'image': return 'Image Analysis';
    default: return 'AI Assistant Result';
  }
}

// Format result based on type
function formatResult(type, result) {
  switch (type) {
    case 'proofreader':
      return formatProofreadResult(result);
    case 'prompter':
      return formatGeneratedContent(result);
    case 'image':
      return `<img src="${result.imageData}" style="max-width: 100%; margin-bottom: 16px;"><p>${result.description}</p>`;
    default:
      return result;
  }
}

// Format proofread result
function formatProofreadResult(result) {
  if (!result.corrections || result.corrections.length === 0) {
    return '<p>No issues found. The text looks good!</p>';
  }
  
  let formattedText = result.text;
  let offsetAdjustment = 0;
  
  // Sort corrections by position to avoid issues with overlapping replacements
  const sortedCorrections = [...result.corrections].sort((a, b) => a.start - b.start);
  
  // Apply corrections with HTML markup
  sortedCorrections.forEach(correction => {
    const start = correction.start + offsetAdjustment;
    const end = correction.end + offsetAdjustment;
    
    const before = formattedText.substring(0, start);
    const errorText = formattedText.substring(start, end);
    const after = formattedText.substring(end);
    
    const correctionHTML = `<span class="ai-assistant-correction" title="${correction.message}: ${correction.suggestion}">${errorText}</span>`;
    
    formattedText = before + correctionHTML + after;
    
    // Adjust offset for next correction
    offsetAdjustment += (correctionHTML.length - errorText.length);
  });
  
  return formattedText;
}

// Format generated content
function formatGeneratedContent(result) {
  if (Array.isArray(result)) {
    if (result[0] && result[0].question) {
      // Quiz questions
      let html = '<ol>';
      result.forEach(item => {
        html += `
          <li>
            <p><strong>${item.question}</strong></p>
            <ul>
              ${item.options.map(option => `<li>${option}</li>`).join('')}
            </ul>
            <p><em>Answer: ${item.answer}</em></p>
          </li>
        `;
      });
      html += '</ol>';
      return html;
    } else if (result[0] && result[0].front) {
      // Flashcards
      let html = '';
      result.forEach((card, index) => {
        html += `
          <div class="ai-assistant-flashcard">
            <p><strong>Card ${index + 1}:</strong></p>
            <p><strong>Front:</strong> ${card.front}</p>
            <p><strong>Back:</strong> ${card.back}</p>
          </div>
        `;
      });
      return html;
    }
  }
  
  // Default: plain text
  return result;
}

// Save result to bookmarks
function saveResult(type, result) {
  chrome.storage.local.get(['bookmarks'], function(data) {
    const bookmarks = data.bookmarks || [];
    const date = new Date().toLocaleDateString();
    
    bookmarks.push({
      type: type,
      title: getModalTitle(type),
      content: typeof result === 'string' ? result : JSON.stringify(result),
      date: date
    });
    
    chrome.storage.local.set({ bookmarks: bookmarks });
  });
}

// Highlight corrections in text
function highlightCorrections(text, corrections) {
  // Find the selected element
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const selectedElement = range.commonAncestorContainer.parentElement;
  
  // Store original text
  const originalText = selectedElement.innerText;
  
  // Apply corrections
  let formattedText = text;
  let offsetAdjustment = 0;
  
  corrections.sort((a, b) => a.start - b.start);
  
  corrections.forEach(correction => {
    const start = correction.start + offsetAdjustment;
    const end = correction.end + offsetAdjustment;
    
    const before = formattedText.substring(0, start);
    const errorText = formattedText.substring(start, end);
    const after = formattedText.substring(end);
    
    const correctionHTML = `<span class="ai-assistant-correction" title="${correction.message}: ${correction.suggestion}">${errorText}</span>`;
    
    formattedText = before + correctionHTML + after;
    
    offsetAdjustment += (correctionHTML.length - errorText.length);
  });
  
  // Replace content
  selectedElement.innerHTML = formattedText;
  
  // Restore original text after 5 seconds
  setTimeout(() => {
    selectedElement.innerText = originalText;
  }, 5000);
}

// Display image analysis results
function displayImageResults(description, imageData) {
  // This function is used in image results page
  const imageContainer = document.getElementById('image-container');
  const descriptionContainer = document.getElementById('description-container');
  
  if (imageContainer && descriptionContainer) {
    imageContainer.innerHTML = `<img src="${imageData}" alt="Analyzed image" style="max-width: 100%;">`;
    descriptionContainer.textContent = description;
  }
}

// Inject custom styles
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .ai-assistant-correction {
      text-decoration: underline;
      text-decoration-style: wavy;
      text-decoration-color: #ea4335;
      position: relative;
      cursor: help;
    }
    
    .ai-assistant-correction:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 0;
      background-color: white;
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: 8px;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      white-space: nowrap;
    }
    
    .ai-assistant-flashcard {
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #dadce0;
      border-radius: 4px;
    }
  `;
  
  document.head.appendChild(style);
}
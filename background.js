// Chrome AI Learning Assistant - Background Script

// Track AI API availability
let aiApiAvailable = false;

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log('AI Learning Assistant extension installed');
  
  // Check AI API availability
  await checkAIApiAvailability();
  
  // Initialize storage with default settings
  chrome.storage.local.set({
    darkMode: false,
    bookmarks: [],
    aiApiAvailable: aiApiAvailable,
    preferences: {
      defaultSummaryLength: 'medium',
      defaultDetailLevel: 'medium',
      defaultRewriteStyle: 'casual',
      defaultReadingLevel: 'college',
      defaultTargetLanguage: 'es'
    }
  });
  
  // Create context menu items
  createContextMenuItems();
});

// Check if Chrome's AI APIs are available
async function checkAIApiAvailability() {
  try {
    // Try to access the experimental AI APIs
    if (typeof chrome.aiOriginTrial !== 'undefined' && chrome.aiOriginTrial.languageModel) {
      // Check if we can create a language model session
      const session = await chrome.aiOriginTrial.languageModel.create();
      if (session) {
        aiApiAvailable = true;
        session.destroy();
        console.log('Chrome AI APIs are available');
      }
    } else if (typeof window.ai !== 'undefined') {
      // Check for the newer AI API
      const capabilities = await window.ai.canCreateTextSession();
      if (capabilities === 'readily') {
        aiApiAvailable = true;
        console.log('Window AI API is available');
      }
    } else {
      console.log('Chrome AI APIs are not available - using fallback methods');
      aiApiAvailable = false;
    }
  } catch (error) {
    console.log('AI API check failed:', error);
    aiApiAvailable = false;
  }
}

// Create context menu items
function createContextMenuItems() {
  // Remove existing items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Parent menu
    chrome.contextMenus.create({
      id: 'aiLearningAssistant',
      title: 'AI Learning Assistant',
      contexts: ['selection']
    });
    
    // Summarize submenu
    chrome.contextMenus.create({
      id: 'summarize',
      parentId: 'aiLearningAssistant',
      title: 'Summarize Selected Text',
      contexts: ['selection']
    });
    
    // Rewrite submenu
    chrome.contextMenus.create({
      id: 'rewrite',
      parentId: 'aiLearningAssistant',
      title: 'Rewrite Selected Text',
      contexts: ['selection']
    });
    
    // Translate submenu
    chrome.contextMenus.create({
      id: 'translate',
      parentId: 'aiLearningAssistant',
      title: 'Translate Selected Text',
      contexts: ['selection']
    });
    
    // Generate questions submenu
    chrome.contextMenus.create({
      id: 'generateQuestions',
      parentId: 'aiLearningAssistant',
      title: 'Generate Questions',
      contexts: ['selection']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  
  switch (info.menuItemId) {
    case 'summarize':
      handleSummarize(info.selectionText, tab);
      break;
    case 'rewrite':
      handleRewrite(info.selectionText, tab);
      break;
    case 'translate':
      handleTranslate(info.selectionText, tab);
      break;
    case 'generateQuestions':
      handleGenerateQuestions(info.selectionText, tab);
      break;
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'summarize':
      handleSummarizeRequest(request, sendResponse);
      return true; // Keep the message channel open for async response
      
    case 'rewrite':
      handleRewriteRequest(request, sendResponse);
      return true;
      
    case 'translate':
      handleTranslateRequest(request, sendResponse);
      return true;
      
    case 'proofread':
      handleProofreadRequest(request, sendResponse);
      return true;
      
    case 'generateContent':
      handleGenerateContentRequest(request, sendResponse);
      return true;
      
    case 'takeScreenshot':
      handleTakeScreenshot(sendResponse);
      return true;
      
    case 'processImage':
      handleProcessImage(request, sendResponse);
      return true;
  }
});

// Summarize text using Chrome's AI APIs or fallback methods
async function handleSummarizeRequest(request, sendResponse) {
  try {
    const text = request.text;
    const options = request.options || { length: 'medium', detailLevel: 'medium' };
    
    // Check if offline and use cached model if necessary
    if (!navigator.onLine && await isModelCached('summarizer')) {
      const summary = await summarizeTextOffline(text, options);
      sendResponse(summary);
      return;
    }
    
    let result;
    
    if (aiApiAvailable) {
      // Try Chrome's experimental AI APIs
      result = await summarizeWithChromeAI(text, options);
    } else {
      // Use rule-based fallback
      result = await summarizeWithFallback(text, options);
    }
    
    sendResponse(result);
    
    // Cache the result for offline use
    cacheModelAndResult('summarizer', text, result);
  } catch (error) {
    console.error('Summarization error:', error);
    
    // Try fallback method if AI API fails
    try {
      const fallbackResult = await summarizeWithFallback(request.text, request.options);
      sendResponse(fallbackResult);
    } catch (fallbackError) {
      sendResponse({ error: 'Summarization failed: ' + error.message });
    }
  }
}

// Summarize using Chrome AI APIs
async function summarizeWithChromeAI(text, options) {
  try {
    if (typeof chrome.aiOriginTrial !== 'undefined' && chrome.aiOriginTrial.languageModel) {
      const session = await chrome.aiOriginTrial.languageModel.create();
      const prompt = `Please summarize the following text in a ${options.length} summary with ${options.detailLevel} detail level:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      return result;
    } else if (typeof window.ai !== 'undefined') {
      const session = await window.ai.createTextSession();
      const prompt = `Please summarize the following text in a ${options.length} summary with ${options.detailLevel} detail level:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      return result;
    }
  } catch (error) {
    throw new Error('Chrome AI summarization failed: ' + error.message);
  }
}

// Fallback summarization using rule-based approach
async function summarizeWithFallback(text, options) {
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
  
  // Simple extractive summarization
  let summaryLength;
  switch (options.length) {
    case 'short':
      summaryLength = Math.max(1, Math.floor(sentences.length * 0.2));
      break;
    case 'long':
      summaryLength = Math.max(1, Math.floor(sentences.length * 0.6));
      break;
    default: // medium
      summaryLength = Math.max(1, Math.floor(sentences.length * 0.4));
  }
  
  // Score sentences based on word frequency
  const wordFreq = {};
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  words.forEach(word => {
    if (word.length > 3) { // Ignore short words
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Score sentences
  const sentenceScores = sentences.map(sentence => {
    const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || [];
    const score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);
    return { sentence: sentence.trim(), score };
  });
  
  // Get top sentences
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, summaryLength)
    .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
    .map(item => item.sentence);
  
  return topSentences.join(' ');
}

// Rewrite text using Chrome's AI APIs or fallback methods
async function handleRewriteRequest(request, sendResponse) {
  try {
    const text = request.text;
    const options = request.options || { style: 'casual', readingLevel: 'college' };
    
    // Check if offline and use cached model if necessary
    if (!navigator.onLine && await isModelCached('rewriter')) {
      const rewrittenText = await rewriteTextOffline(text, options);
      sendResponse(rewrittenText);
      return;
    }
    
    let result;
    
    if (aiApiAvailable) {
      // Try Chrome's experimental AI APIs
      result = await rewriteWithChromeAI(text, options);
    } else {
      // Use rule-based fallback
      result = await rewriteWithFallback(text, options);
    }
    
    sendResponse(result);
    
    // Cache the result for offline use
    cacheModelAndResult('rewriter', text, result);
  } catch (error) {
    console.error('Rewriting error:', error);
    
    // Try fallback method if AI API fails
    try {
      const fallbackResult = await rewriteWithFallback(request.text, request.options);
      sendResponse(fallbackResult);
    } catch (fallbackError) {
      sendResponse({ error: 'Rewriting failed: ' + error.message });
    }
  }
}

// Rewrite using Chrome AI APIs
async function rewriteWithChromeAI(text, options) {
  try {
    if (typeof chrome.aiOriginTrial !== 'undefined' && chrome.aiOriginTrial.languageModel) {
      const session = await chrome.aiOriginTrial.languageModel.create();
      const prompt = `Please rewrite the following text in a ${options.style} style for a ${options.readingLevel} reading level:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      return result;
    } else if (typeof window.ai !== 'undefined') {
      const session = await window.ai.createTextSession();
      const prompt = `Please rewrite the following text in a ${options.style} style for a ${options.readingLevel} reading level:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      return result;
    }
  } catch (error) {
    throw new Error('Chrome AI rewriting failed: ' + error.message);
  }
}

// Fallback rewriting using simple text transformations
async function rewriteWithFallback(text, options) {
  let result = text;
  
  // Simple style transformations
  if (options.style === 'formal') {
    result = result.replace(/don't/g, 'do not')
                   .replace(/can't/g, 'cannot')
                   .replace(/won't/g, 'will not')
                   .replace(/I'm/g, 'I am')
                   .replace(/you're/g, 'you are')
                   .replace(/it's/g, 'it is');
  } else if (options.style === 'simple') {
    result = result.replace(/utilize/g, 'use')
                   .replace(/demonstrate/g, 'show')
                   .replace(/facilitate/g, 'help')
                   .replace(/subsequently/g, 'then')
                   .replace(/approximately/g, 'about');
  }
  
  // Reading level adjustments
  if (options.readingLevel === 'elementary') {
    result = result.replace(/however/g, 'but')
                   .replace(/therefore/g, 'so')
                   .replace(/consequently/g, 'so')
                   .replace(/furthermore/g, 'also');
  }
  
  return result + '\n\n[Note: This is a basic rewrite. For advanced rewriting, Chrome\'s AI APIs are required.]';
}

// Translate text using Chrome's AI APIs or fallback methods
async function handleTranslateRequest(request, sendResponse) {
  try {
    const text = request.text;
    const options = request.options || { targetLanguage: 'es' };
    
    // Check if offline and use cached model if necessary
    if (!navigator.onLine && await isModelCached('translator')) {
      const translatedText = await translateTextOffline(text, options);
      sendResponse(translatedText);
      return;
    }
    
    let result;
    
    if (aiApiAvailable) {
      // Try Chrome's experimental AI APIs
      result = await translateWithChromeAI(text, options);
    } else {
      // Use external translation service fallback
      result = await translateWithFallback(text, options);
    }
    
    sendResponse(result);
    
    // Cache the result for offline use
    cacheModelAndResult('translator', text, result);
  } catch (error) {
    console.error('Translation error:', error);
    
    // Try fallback method if AI API fails
    try {
      const fallbackResult = await translateWithFallback(request.text, request.options);
      sendResponse(fallbackResult);
    } catch (fallbackError) {
      sendResponse({ error: 'Translation failed: ' + error.message });
    }
  }
}

// Translate using Chrome AI APIs
async function translateWithChromeAI(text, options) {
  try {
    const languageNames = {
      'es': 'Spanish',
      'fr': 'French',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi'
    };
    
    const targetLanguage = languageNames[options.targetLanguage] || options.targetLanguage;
    
    if (typeof chrome.aiOriginTrial !== 'undefined' && chrome.aiOriginTrial.languageModel) {
      const session = await chrome.aiOriginTrial.languageModel.create();
      const prompt = `Please translate the following text to ${targetLanguage}:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      return result;
    } else if (typeof window.ai !== 'undefined') {
      const session = await window.ai.createTextSession();
      const prompt = `Please translate the following text to ${targetLanguage}:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      return result;
    }
  } catch (error) {
    throw new Error('Chrome AI translation failed: ' + error.message);
  }
}

// Fallback translation using Google Translate API (requires API key)
async function translateWithFallback(text, options) {
  const languageNames = {
    'es': 'Spanish',
    'fr': 'French',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  const targetLanguage = languageNames[options.targetLanguage] || options.targetLanguage;
  
  // Note: This is a placeholder. In a real implementation, you would either:
  // 1. Use a translation API service
  // 2. Implement a basic word-by-word dictionary lookup
  // 3. Direct user to Google Translate
  
  return `[Translation to ${targetLanguage} not available - Chrome AI APIs required]\n\nOriginal text: ${text}\n\nPlease use Google Translate or enable Chrome's AI features for translation.`;
}

// Proofread text using Chrome's AI APIs or fallback methods
async function handleProofreadRequest(request, sendResponse) {
  try {
    const text = request.text;
    
    // Check if offline and use cached model if necessary
    if (!navigator.onLine && await isModelCached('proofreader')) {
      const proofreadResult = await proofreadTextOffline(text);
      sendResponse(proofreadResult);
      return;
    }
    
    let result;
    
    if (aiApiAvailable) {
      // Try Chrome's experimental AI APIs
      result = await proofreadWithChromeAI(text);
    } else {
      // Use rule-based fallback
      result = await proofreadWithFallback(text);
    }
    
    sendResponse(result);
    
    // Cache the result for offline use
    cacheModelAndResult('proofreader', text, result);
  } catch (error) {
    console.error('Proofreading error:', error);
    
    // Try fallback method if AI API fails
    try {
      const fallbackResult = await proofreadWithFallback(request.text);
      sendResponse(fallbackResult);
    } catch (fallbackError) {
      sendResponse({ error: 'Proofreading failed: ' + error.message });
    }
  }
}

// Proofread using Chrome AI APIs
async function proofreadWithChromeAI(text) {
  try {
    if (typeof chrome.aiOriginTrial !== 'undefined' && chrome.aiOriginTrial.languageModel) {
      const session = await chrome.aiOriginTrial.languageModel.create();
      const prompt = `Please proofread the following text and identify any grammar, spelling, or style issues. Format your response as a corrected version followed by a list of specific corrections:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      
      // Parse the result into corrections format
      return {
        correctedText: result,
        corrections: [] // Would need to parse the AI response for specific corrections
      };
    } else if (typeof window.ai !== 'undefined') {
      const session = await window.ai.createTextSession();
      const prompt = `Please proofread the following text and identify any grammar, spelling, or style issues:\n\n${text}`;
      const result = await session.prompt(prompt);
      session.destroy();
      
      return {
        correctedText: result,
        corrections: []
      };
    }
  } catch (error) {
    throw new Error('Chrome AI proofreading failed: ' + error.message);
  }
}

// Fallback proofreading using basic checks
async function proofreadWithFallback(text) {
  const corrections = [];
  let correctedText = text;
  
  // Basic spell checking patterns
  const commonMistakes = {
    'teh': 'the',
    'adn': 'and',
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'neccessary': 'necessary'
  };
  
  // Check for common mistakes
  for (const [mistake, correction] of Object.entries(commonMistakes)) {
    const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
    if (regex.test(correctedText)) {
      corrections.push({
        start: correctedText.search(regex),
        end: correctedText.search(regex) + mistake.length,
        message: 'Spelling error',
        suggestion: correction
      });
      correctedText = correctedText.replace(regex, correction);
    }
  }
  
  // Check for double spaces
  if (correctedText.includes('  ')) {
    corrections.push({
      start: correctedText.indexOf('  '),
      end: correctedText.indexOf('  ') + 2,
      message: 'Extra space',
      suggestion: ' '
    });
    correctedText = correctedText.replace(/  +/g, ' ');
  }
  
  if (corrections.length === 0) {
    return {
      correctedText: text,
      corrections: [],
      message: 'No obvious errors found. For comprehensive proofreading, Chrome\'s AI APIs are recommended.'
    };
  }
  
  return {
    correctedText,
    corrections
  };
}

// Generate content using Chrome's Prompt & Writer APIs
async function handleGenerateContentRequest(request, sendResponse) {
  try {
    // Check if offline and use cached model if necessary
    if (!navigator.onLine && await isModelCached('prompter')) {
      const generatedContent = await generateContentOffline(request.text, request.options);
      sendResponse(generatedContent);
      return;
    }
    
    // Call Chrome's Prompt & Writer APIs
    const text = request.text;
    const options = request.options || { type: 'quiz' };
    
    let result;
    
    if (options.type === 'quiz') {
      const prompter = await chrome.ai.getClient('prompter');
      result = await prompter.generateQuestions({
        text: text,
        numQuestions: 5,
        includeAnswers: true
      });
    } else if (options.type === 'flashcards') {
      const prompter = await chrome.ai.getClient('prompter');
      result = await prompter.generateFlashcards({
        text: text,
        numCards: 5
      });
    } else {
      const writer = await chrome.ai.getClient('writer');
      result = await writer.generateText({
        prompt: `Create ${options.type} based on the following text: ${text}`,
        maxTokens: 500
      });
    }
    
    sendResponse(result.content);
    
    // Cache the model and result for offline use
    cacheModelAndResult('prompter', text, result.content);
  } catch (error) {
    console.error('Content generation error:', error);
    sendResponse({ error: error.message });
  }
}

// Take screenshot and process with Prompt API
async function handleTakeScreenshot(sendResponse) {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Capture visible area of the tab
    const screenshot = await chrome.tabs.captureVisibleTab();
    
    // Process the screenshot
    await processScreenshot(screenshot, tab.id);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Screenshot error:', error);
    sendResponse({ error: error.message });
  }
}

// Process screenshot with Prompt API
async function processScreenshot(screenshot, tabId) {
  try {
    // Create a modal to display results in the tab
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: createResultModal
    });
    
    // Process image with Prompt API
    const prompter = await chrome.ai.getClient('prompter');
    const result = await prompter.describeImage({
      image: screenshot
    });
    
    // Send results to the tab
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: (description) => {
        const resultContent = document.getElementById('ai-assistant-result-content');
        if (resultContent) {
          resultContent.textContent = description;
        }
      },
      args: [result.description]
    });
  } catch (error) {
    console.error('Image processing error:', error);
    
    // Show error in the modal
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: (errorMsg) => {
        const resultContent = document.getElementById('ai-assistant-result-content');
        if (resultContent) {
          resultContent.textContent = 'Error: ' + errorMsg;
        }
      },
      args: [error.message]
    });
  }
}

// Process uploaded image with Prompt API
async function handleProcessImage(request, sendResponse) {
  try {
    // Get image data
    const imageData = request.imageData;
    
    // Process image with Prompt API
    const prompter = await chrome.ai.getClient('prompter');
    const result = await prompter.describeImage({
      image: imageData
    });
    
    // Create a new tab to display results
    const tab = await chrome.tabs.create({ url: 'imageResults.html' });
    
    // Wait for the tab to be ready
    setTimeout(async () => {
      // Send results to the tab
      await chrome.tabs.sendMessage(tab.id, {
        action: 'displayImageResults',
        description: result.description,
        imageData: imageData
      });
    }, 500);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Image processing error:', error);
    sendResponse({ error: error.message });
  }
}

// Create a modal to display results in the active tab
function createResultModal() {
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
  title.textContent = 'AI Learning Assistant';
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
  content.id = 'ai-assistant-result-content';
  content.style.cssText = `
    font-size: 16px;
    line-height: 1.5;
  `;
  content.textContent = 'Processing...';
  
  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(content);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Cache model and result for offline use
function cacheModelAndResult(modelType, input, output) {
  chrome.storage.local.get(['cachedResults'], (result) => {
    const cachedResults = result.cachedResults || {};
    
    if (!cachedResults[modelType]) {
      cachedResults[modelType] = {};
    }
    
    // Create a hash of the input
    const inputHash = hashString(input);
    
    // Store the result
    cachedResults[modelType][inputHash] = {
      input: input,
      output: output,
      timestamp: Date.now()
    };
    
    // Limit cache size (keep latest 50 entries)
    const entries = Object.entries(cachedResults[modelType]);
    if (entries.length > 50) {
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Create new object with only the latest 50 entries
      const newCache = {};
      entries.slice(-50).forEach(([key, value]) => {
        newCache[key] = value;
      });
      
      cachedResults[modelType] = newCache;
    }
    
    chrome.storage.local.set({ cachedResults });
  });
}

// Check if model is cached
async function isModelCached(modelType) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['cachedResults'], (result) => {
      resolve(!!(result.cachedResults && result.cachedResults[modelType]));
    });
  });
}

// Offline fallbacks
async function summarizeTextOffline(text, options) {
  return fetchFromCache('summarizer', text);
}

async function rewriteTextOffline(text, options) {
  return fetchFromCache('rewriter', text);
}

async function translateTextOffline(text, options) {
  return fetchFromCache('translator', text);
}

async function proofreadTextOffline(text) {
  return fetchFromCache('proofreader', text);
}

async function generateContentOffline(text, options) {
  return fetchFromCache('prompter', text);
}

// Fetch result from cache
async function fetchFromCache(modelType, input) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['cachedResults'], (result) => {
      const cachedResults = result.cachedResults || {};
      
      if (!cachedResults[modelType]) {
        reject(new Error('No cached data available for offline use'));
        return;
      }
      
      // Create a hash of the input
      const inputHash = hashString(input);
      
      // Check for exact match
      if (cachedResults[modelType][inputHash]) {
        resolve(cachedResults[modelType][inputHash].output);
        return;
      }
      
      // Try to find similar input
      for (const [hash, data] of Object.entries(cachedResults[modelType])) {
        if (isSimilarInput(input, data.input)) {
          resolve(data.output);
          return;
        }
      }
      
      reject(new Error('No matching cached data found for offline use'));
    });
  });
}

// Simple string hashing function
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Check if inputs are similar (for fallback when exact match isn't found)
function isSimilarInput(input1, input2) {
  // Simple check for substring
  if (input1.length > 100 && input2.length > 100) {
    return input1.includes(input2.substring(0, 50)) || input2.includes(input1.substring(0, 50));
  }
  
  // For shorter texts, check if they share a significant portion of words
  const words1 = new Set(input1.toLowerCase().split(/\s+/));
  const words2 = new Set(input2.toLowerCase().split(/\s+/));
  
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      intersection++;
    }
  }
  
  const similarity = intersection / Math.min(words1.size, words2.size);
  return similarity > 0.7; // 70% similarity threshold
}

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'summarize':
      handleKeyboardSummarize();
      break;
    case '_execute_action':
      // This opens the popup automatically
      break;
  }
});

// Handle summarize keyboard shortcut
async function handleKeyboardSummarize() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get selected text from the active tab
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });
    
    if (result.result && result.result.trim()) {
      // Store the selected text and open popup with summarizer active
      chrome.storage.local.set({ 
        tempSelectedText: result.result,
        activateFeature: 'summarizer'
      }, () => {
        chrome.action.openPopup();
      });
    } else {
      // Show notification if no text is selected
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Learning Assistant',
        message: 'Please select some text to summarize.'
      });
    }
  } catch (error) {
    console.error('Keyboard shortcut error:', error);
  }
}

function handleRewrite(selectionText, tab) {
  openActionPopup(tab.id, 'rewriter', selectionText);
}

function handleTranslate(selectionText, tab) {
  openActionPopup(tab.id, 'translator', selectionText);
}

function handleGenerateQuestions(selectionText, tab) {
  openActionPopup(tab.id, 'prompter', selectionText);
}

// Open popup with specific tab activated
function openActionPopup(tabId, feature, selectedText) {
  chrome.storage.local.set({ 
    tempSelectedText: selectedText,
    activateFeature: feature
  }, () => {
    chrome.action.openPopup();
  });
}
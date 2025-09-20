# AI Learning Assistant - Installation & Testing Guide

## Prerequisites

1. **Chrome Browser**: Version 89 or later
2. **Developer Mode**: Enabled in Chrome extensions
3. **PNG Icons**: Convert SVG icons to PNG format (use the included icon-generator.html)

## Installation Steps

### 1. Prepare the Icons
1. Open `icon-generator.html` in Chrome
2. Download each PNG icon (icon16.png, icon32.png, icon48.png, icon128.png)
3. Place the PNG files in the `/icons/` directory, replacing the SVG files

### 2. Load the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle in the top-right corner
3. Click "Load unpacked" button
4. Select the `LearningAssistant` folder
5. The extension icon should appear in your browser toolbar

### 3. Grant Permissions
When you first use the extension, Chrome may prompt for permissions:
- **Active Tab**: To read selected text on web pages
- **Storage**: To save bookmarks and settings
- **Context Menus**: For right-click functionality
- **Scripting**: To interact with web page content
- **Notifications**: For keyboard shortcut feedback

## Testing the Extension

### 1. Basic Functionality Test
1. Open `test-page.html` in a new tab
2. Follow the testing instructions on that page
3. Try each feature with the provided text samples

### 2. Feature Tests

#### Text Selection Features
- **Summarization**: Select long text → Extension popup → Summarize tab
- **Rewriting**: Select complex text → Try different styles and reading levels
- **Translation**: Select English text → Translate to Spanish/French/Chinese/Arabic/Hindi
- **Proofreading**: Enter text with errors → Check for corrections

#### Context Menu
- Right-click on selected text → Look for "AI Learning Assistant" menu
- Test direct access to features from context menu

#### Keyboard Shortcuts
- `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac): Open extension popup
- `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac): Quick summarize selected text

#### Image Analysis
- Click extension icon → Use "Take Screenshot" or "Upload Image"
- Test with various types of images (charts, diagrams, text images)

#### Bookmarks & Settings
- Save results from different features
- Open "My Bookmarks" to view saved content
- Toggle dark mode
- Submit feedback through the feedback form

### 3. Offline Testing
1. Disconnect from the internet
2. Try using features with previously processed text
3. Verify cached results are available
4. Check fallback functionality when AI APIs aren't available

## Troubleshooting

### Extension Won't Load
- Check console for errors in `chrome://extensions/`
- Verify all files are present in the extension directory
- Ensure manifest.json is valid JSON
- Try reloading the extension

### Features Not Working
- Check if text is properly selected
- Look for error messages in the extension popup
- Open browser console (F12) to check for JavaScript errors
- Verify permissions are granted

### AI Features Unavailable
- The extension includes fallback methods when Chrome's AI APIs aren't available
- Some features may show "[Note: Advanced features require Chrome AI APIs]"
- This is normal behavior and doesn't indicate an error

### Performance Issues
- Check if the extension is using too much memory in Chrome Task Manager
- Clear cached data through the extension if needed
- Reload the extension if it becomes unresponsive

## Known Limitations

1. **Chrome AI APIs**: Still experimental and may not be available in all Chrome versions
2. **Translation**: Fallback translation is limited without AI APIs
3. **Image Analysis**: Requires internet connection and compatible AI models
4. **Context Menu**: May not appear on some protected pages (chrome://, extension pages)

## Development Notes

### File Structure
```
LearningAssistant/
├── manifest.json           # Extension configuration
├── popup.html             # Main popup interface
├── background.js          # Background service worker
├── content.js             # Content script for web pages
├── feedback.html          # User feedback form
├── imageResults.html      # Image analysis results page
├── test-page.html         # Testing and demo page
├── icon-generator.html    # Icon conversion utility
├── styles/
│   └── popup.css          # Main stylesheet
├── scripts/
│   ├── popup.js           # Popup functionality
│   └── feedback.js        # Feedback form logic
└── icons/
    ├── icon16.png         # 16x16 extension icon
    ├── icon32.png         # 32x32 extension icon
    ├── icon48.png         # 48x48 extension icon
    └── icon128.png        # 128x128 extension icon
```

### Key Features Implemented
- ✅ Text summarization with fallback
- ✅ Text rewriting with style options
- ✅ Multi-language translation
- ✅ Grammar and spell checking
- ✅ Question and flashcard generation
- ✅ Image analysis and screenshot processing
- ✅ Offline caching and fallback methods
- ✅ Dark mode and accessibility features
- ✅ Keyboard shortcuts and navigation
- ✅ User feedback and analytics system
- ✅ Privacy-first local processing

## Support & Feedback

Use the built-in feedback system (Feedback button in the extension popup) to report issues, request features, or share your experience. All feedback is stored locally and helps improve the extension.

## License

This project is open source and available under the MIT License.
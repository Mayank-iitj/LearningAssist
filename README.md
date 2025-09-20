# AI Learning Assistant Chrome Extension

A Chrome Extension that serves as an intelligent learning assistant using Chrome's built-in AI models and APIs. This extension helps users digest, understand, and interact with web content more efficiently through real-time, client-side AI-powered capabilities.

## Features

### Text Processing
- **Summarizer**: Automatically summarize lengthy articles or selected text with configurable length and detail level
- **Rewriter**: Rephrase complex text for different reading levels with style/tone toggles
- **Translator**: Translate selected text into multiple languages (Spanish, French, Chinese, Arabic, Hindi)
- **Proofreader**: Check grammar, spelling, and style with suggested fixes

### Content Generation
- **Questions & Flashcards**: Generate interactive learning questions or flashcards from selected text
- **Dynamic Explanations**: Create summaries and explanations tailored to user queries

### Multimodal Processing
- **Image Analysis**: Upload or screenshot images for AI-powered analysis
- **Offline Support**: Work without internet connection using cached AI models

### User Experience
- **Personalized Learning**: Bookmark and organize content in custom folders
- **Privacy-First**: Perform all AI computations locally on the client device
- **Accessibility**: Keyboard navigation, screen-reader support, and dark mode

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your browser toolbar

## Usage

### Basic Text Processing
1. Select text on any webpage
2. Click the extension icon or use the context menu
3. Choose the desired function (Summarize, Rewrite, Translate, Proofread)
4. Configure options if needed
5. View and interact with the results

### Image Analysis
1. Click the extension icon
2. Use "Take Screenshot" or "Upload Image"
3. View the AI-generated description and analysis

### Saving and Organization
1. Use the "Save" button to bookmark any result
2. Access your saved content via "My Bookmarks"
3. Organize and review your saved materials

## Privacy

This extension uses Chrome's built-in AI models that run locally on your device. By default, no data is sent to external servers. All processing happens client-side to ensure your privacy.

## Requirements

- Chrome browser (version 89 or later)
- Chrome's built-in AI models enabled

## Development

### Project Structure
- `manifest.json`: Extension configuration
- `popup.html/css/js`: UI for the extension popup
- `background.js`: Handles background processes and API calls
- `content.js`: Interacts with web page content
- `imageResults.html`: Display page for image analysis

### Built With
- HTML/CSS/JavaScript
- Chrome Extension APIs
- Chrome AI APIs (Summarizer, Rewriter, Translator, Proofreader, Prompt, Writer)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
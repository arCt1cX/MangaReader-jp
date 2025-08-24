# Manga Reader PWA

A Progressive Web App for reading manga with integrated Japanese learning features including OCR, dictionary lookup, and translation.

## Features

- 📚 **Multi-source manga reading** - Browse manga from multiple sites
- 🔍 **OCR text extraction** - Extract Japanese text from manga images using Tesseract.js
- 📖 **Dictionary lookup** - Instant word and kanji definitions via Jisho API
- 🌐 **Translation** - DeepL-powered translations for learning
- 💾 **Library management** - Save and track reading progress locally
- 📱 **PWA support** - Install as native app on mobile and desktop
- 🎨 **Clean UI** - Mobile-first design optimized for tablets

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Configuration

Update the API base URL in `src/config/api.js` to point to your backend server.

## Backend Integration

This frontend requires the Node.js backend server with manga and translation API routes. See the Server-arct1cx folder for backend code.

## PWA Installation

- **Mobile**: Open in browser and tap "Add to Home Screen"
- **Desktop**: Look for install icon in browser address bar

## Japanese Learning Features

- **OCR**: Click on manga images to extract Japanese text
- **Dictionary**: Click on words for instant definitions
- **Translation**: Translate phrases with DeepL
- **Progress tracking**: Keep track of reading progress

## Tech Stack

- React 18
- React Router
- Tailwind CSS
- Tesseract.js (OCR)
- Kuromoji.js (Japanese tokenizer)
- Workbox (Service Worker)

## Deployment

This app is configured for GitHub Pages deployment. After building, deploy the `build` folder to your GitHub Pages repository.

See `SETUP_INSTRUCTIONS.txt` for detailed deployment instructions.

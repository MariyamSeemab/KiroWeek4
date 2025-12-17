# 🎨 Retro AI Paint

A nostalgic MS Paint-style application with modern AI image generation capabilities. Draw simple sketches and transform them into detailed artwork using AI!

## ✨ Features

- **Classic MS Paint Interface**: Authentic Windows 95/98 retro styling
- **Drawing Tools**: Pencil, Brush, Eraser, Line, Fill Bucket with pixelated rendering
- **16-Color Palette**: Classic MS Paint color selection
- **🆓 FREE AI Generation**: Multiple free AI providers - no API keys needed!
- **Multiple AI Providers**: Hugging Face Free, Local AI, Replicate, OpenAI, Gemini
- **Real-time Progress**: WebSocket-powered generation updates
- **Smart Caching**: Reduces costs and improves performance
- **File Operations**: Save generated images as PNG
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works on desktop and tablet devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- **No API keys needed** for free AI generation! 🎉
- (Optional) API keys for premium providers (Replicate, OpenAI, Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd retro-ai-paint
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Frontend (.env)
   VITE_API_BASE_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3001
   
   # Backend (backend/.env) - FREE AI SETUP
   PORT=3001
   AI_MOCK_MODE=false
   DEFAULT_AI_PROVIDER=huggingface-free  # FREE!
   HF_FREE_MODEL=runwayml/stable-diffusion-v1-5
   
   # Optional: Premium providers
   REPLICATE_API_TOKEN=your_token_here
   OPENAI_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend && npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🤖 AI Providers

### 🆓 Free Options (No API Keys!)
- **Hugging Face Free**: Best free option, good quality, 10 req/min
- **Local AI**: Run completely offline on your machine (unlimited!)

### 💰 Premium Options
- **Replicate**: $0.002/image, excellent quality, fast
- **OpenAI DALL-E**: $0.04/image, highest quality
- **Google Gemini**: $0.002/image, multimodal capabilities

**👉 See [FREE_AI_SETUP.md](FREE_AI_SETUP.md) for detailed free AI setup!**

## 🎮 How to Use

### Basic Drawing
1. Select a tool from the toolbar (Pencil, Brush, Eraser, Line, Fill)
2. Choose colors from the 16-color palette
3. Draw on the canvas with your mouse
4. Use File menu to create new canvas or save your work

### AI Generation
1. Draw a simple sketch on the canvas
2. Click "AI Magic" in the menu or press `Ctrl+G`
3. Enter a descriptive prompt (e.g., "A photorealistic portrait of an astronaut")
4. Choose a style preset (Oil Painting, Cyberpunk, 8-bit Art, Photorealistic)
5. Click "Generate" and watch the magic happen!

### Keyboard Shortcuts
- `Ctrl+N`: New canvas
- `Ctrl+S`: Save image
- `Ctrl+G`: AI generation
- `P`: Pencil tool
- `B`: Brush tool
- `E`: Eraser tool
- `L`: Line tool
- `F`: Fill tool

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Components**: Modular UI components with retro styling
- **Services**: AI communication, file operations, session management
- **Hooks**: Custom hooks for AI generation and accessibility
- **Utils**: Drawing tools, canvas utilities, performance optimization

### Backend (Node.js + Express)
- **AI Integration**: Replicate API for image generation
- **WebSocket**: Real-time progress updates
- **Image Processing**: Canvas data conversion and optimization
- **Error Handling**: Comprehensive error management

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/components/RetroCanvas.test.tsx
```

The project includes:
- Unit tests for all components and utilities
- Integration tests for AI pipeline
- Property-based testing with fast-check
- Accessibility testing

## 🚀 Deployment

### Frontend Only (Static Hosting)
```bash
npm run deploy:frontend
# Deploy dist/ folder to Netlify, Vercel, or GitHub Pages
```

### Full Stack Deployment
```bash
npm run deploy:prepare
# Follow deployment guide in deploy.md
```

See [deploy.md](./deploy.md) for detailed deployment instructions.

## 🎯 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires HTML5 Canvas, WebSocket, and ES2020 support.

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support with ARIA labels
- High contrast mode compatible
- Focus management for modals and dialogs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Maintain retro styling consistency
- Ensure accessibility compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by classic MS Paint
- Built with modern web technologies
- AI generation powered by Replicate
- Retro styling inspired by Windows 95/98

## 🐛 Troubleshooting

### Common Issues

**Canvas not rendering**
- Check browser compatibility
- Ensure JavaScript is enabled

**AI generation not working**
- Verify backend is running
- Check API key configuration
- Ensure WebSocket connection

**Performance issues**
- Try smaller canvas sizes
- Close other browser tabs
- Check system memory usage

For more help, see the [troubleshooting guide](./deploy.md#troubleshooting) or open an issue.

---

Made with ❤️ and nostalgia for the golden age of MS Paint!
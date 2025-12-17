# Deployment Guide for Retro AI Paint

## Prerequisites

- Node.js 18+ and npm
- Backend AI service (Replicate API key or similar)
- Web server for hosting static files

## Environment Setup

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### Backend (.env)
```
PORT=3001
REPLICATE_API_TOKEN=your_replicate_token_here
CORS_ORIGIN=http://localhost:5173
NODE_ENV=production
```

## Build Process

### Frontend Build
```bash
cd retro-ai-paint
npm install
npm run build
```

### Backend Build
```bash
cd retro-ai-paint/backend
npm install
npm run build
```

## Deployment Options

### Option 1: Static Hosting (Frontend Only)
Deploy the `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

**Note**: AI features will be disabled without backend.

### Option 2: Full Stack Deployment

#### Heroku
1. Create Heroku app
2. Set environment variables
3. Deploy backend and frontend together

#### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy frontend build
COPY dist ./frontend/

# Copy backend source
COPY backend/dist ./backend/dist/

EXPOSE 3001

CMD ["node", "backend/dist/server.js"]
```

#### AWS/GCP/Azure
- Deploy backend as serverless functions or containers
- Host frontend on CDN
- Configure CORS and environment variables

## Performance Optimizations

### Frontend
- Enable gzip compression
- Set proper cache headers for static assets
- Use CDN for faster global delivery
- Optimize images and fonts

### Backend
- Enable response compression
- Implement rate limiting
- Add request caching for AI generations
- Use connection pooling for databases

## Security Considerations

### Frontend
- Validate all user inputs
- Sanitize file uploads
- Implement CSP headers
- Use HTTPS only

### Backend
- Validate API requests
- Implement authentication if needed
- Rate limit AI generation requests
- Secure API keys and tokens
- Enable CORS properly

## Monitoring

### Recommended Tools
- Frontend: Google Analytics, Sentry
- Backend: New Relic, DataDog, CloudWatch
- Uptime: Pingdom, UptimeRobot

### Key Metrics
- Page load times
- AI generation success rates
- Error rates and types
- User engagement metrics

## Scaling Considerations

### Frontend
- Use CDN for global distribution
- Implement service worker for offline support
- Optimize bundle size with code splitting

### Backend
- Horizontal scaling with load balancers
- Queue system for AI generation requests
- Caching layer (Redis) for frequent requests
- Database optimization for user sessions

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS_ORIGIN environment variable
2. **WebSocket connection fails**: Verify WS_URL configuration
3. **AI generation timeout**: Increase timeout limits
4. **Canvas rendering issues**: Check browser compatibility

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed error messages
- Request/response logging
- Development tools integration

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- HTML5 Canvas
- WebSocket support
- ES2020 features
- CSS Grid and Flexbox

## Accessibility Compliance

The application includes:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals

## Backup and Recovery

### Data to Backup
- User session data (localStorage)
- Generated images (if stored server-side)
- Application configuration
- AI generation history

### Recovery Procedures
- Database restoration from backups
- Static asset recovery from CDN
- Configuration rollback procedures
- User data migration scripts
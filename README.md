# 🌍 Tripply - AI Travel Research Assistant

<div align="center">

![Tripply](https://img.shields.io/badge/Tripply-AI%20Travel%20Assistant-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

**An intelligent travel planning assistant powered by OpenAI GPT-4 with real-time data from Google Places API**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Deployment](#-deployment)

</div>

---

## 📸 Demo

**Search-Style Interface with AI-Powered Responses**
- Clean, modern UI with hero section at top
- Real-time streaming AI responses
- Beautiful image cards for locations, restaurants, and hotels

**Interactive Place Cards**
- Click any card to view full details in modal
- Image galleries with navigation
- "Add to Trip" functionality with localStorage persistence
- External links to Google Maps

---

## ✨ Features

### ✅ Implemented Features

#### **1. AI-Powered Chat Interface**
- ✅ Streaming AI responses with OpenAI GPT-4 Turbo
- ✅ Context-aware conversations (remembers previous messages)
- ✅ Intent detection for smart tool selection
- ✅ Markdown rendering with custom travel-focused styling
- ✅ Sample prompt suggestions for quick start
- ✅ Auto-scrolling to latest messages

#### **2. Rich Visual Place Cards** 🎨
- ✅ **4 Card Types:**
  - 🏨 Hotels - with amenities, price ranges
  - 🍽️ Restaurants - with cuisine, price levels ($-$$$$)
  - 📍 Locations/Attractions - with ratings, photos
  - 🎯 Activities - with duration, pricing
  
- ✅ **Card Features:**
  - Hero images with hover zoom effects
  - Star ratings and review counts
  - Quick save/bookmark functionality
  - "Add to Trip" button with success animation
  - External link to Google Maps
  - Responsive grid layout (1→2→3 columns)

#### **3. Detailed Modal View**
- ✅ Click cards to open full-screen modal
- ✅ Image gallery with arrow navigation
- ✅ Swipe through multiple photos
- ✅ Complete place information
- ✅ Close with Escape key or X button
- ✅ Beautiful animations (Framer Motion)

#### **4. Trip Management**
- ✅ "Add to Trip" functionality
- ✅ "Save for Later" bookmarking
- ✅ localStorage persistence (survives page refresh)
- ✅ Separate lists for trip places vs saved places

#### **5. AI Tools Integration** 🔧
- ✅ **Google Places API** - Search locations, restaurants, hotels
- ✅ **Weather API** (Open-Meteo) - Get forecasts
- ✅ **Web Search** - General travel information
- ✅ **Events Search** - Find local events
- ✅ **Travel Time Calculator** - Distance/duration between places
- ✅ Smart tool selection based on user queries

#### **6. Advanced Markdown Rendering**
- ✅ Tables for comparisons (hotels, prices, schedules)
- ✅ Auto-emoji detection (🏨 hotels, 🍽️ restaurants, etc.)
- ✅ Syntax highlighting for code
- ✅ Custom styling for travel content
- ✅ Blockquotes, lists, and headers

#### **7. Production-Ready Infrastructure**
- ✅ Error handling & logging system
- ✅ Rate limiting middleware (60 req/min default)
- ✅ Security headers (CORS, XSS protection, etc.)
- ✅ Image optimization (WebP, AVIF)
- ✅ Environment variable management
- ✅ Docker containerization
- ✅ Vercel deployment configuration

#### **8. Beautiful UI/UX** 🎨
- ✅ Search-style layout (input at top, not chat bubbles)
- ✅ Flat, document-style responses
- ✅ Smooth animations (Framer Motion)
- ✅ Gradient accents and shadows
- ✅ Dark mode support
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states and skeletons
- ✅ Toast notifications

---

### 🚧 Remaining Features / Roadmap

#### **Phase 1: Enhanced Trip Planning**
- [ ] Multi-day itinerary builder with drag-and-drop
- [ ] Interactive map view with pins
- [ ] Travel timeline visualization
- [ ] Budget calculator and tracker
- [ ] Export itinerary to PDF/Calendar

#### **Phase 2: User Accounts & Persistence**
- [ ] Supabase authentication (sign up, login)
- [ ] Save trips to database
- [ ] Share trips with friends (share links)
- [ ] Collaborative trip planning
- [ ] User preferences and profile

#### **Phase 3: Advanced Features**
- [ ] Flight search integration
- [ ] Hotel booking integration
- [ ] Real-time price tracking
- [ ] Visa requirements checker
- [ ] Packing list generator
- [ ] Currency converter
- [ ] Local safety information

#### **Phase 4: Social Features**
- [ ] User reviews and ratings
- [ ] Trip recommendations based on preferences
- [ ] Follow other travelers
- [ ] Share travel photos
- [ ] Community forums

#### **Phase 5: Mobile & Offline**
- [ ] Progressive Web App (PWA)
- [ ] Offline mode
- [ ] Native mobile apps (React Native)
- [ ] Push notifications for travel updates

#### **Phase 6: AI Enhancements**
- [ ] Voice input/output
- [ ] Image recognition (upload photos, get recommendations)
- [ ] Personalized recommendations (ML-based)
- [ ] Multi-language support
- [ ] AR features for navigation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Google Places API key ([Get one here](https://console.cloud.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tripply-ai.git
   cd tripply-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   ```bash
   # REQUIRED
   OPENAI_API_KEY=sk-proj-your-openai-key-here
   GOOGLE_PLACES_API_KEY=AIzaSy-your-google-places-key-here
   
   # OPTIONAL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

6. **Try these queries to see the image cards:**
   - "Find romantic restaurants in Paris"
   - "Show me hotels in Tokyo under $200/night"
   - "What are the top attractions in Barcelona?"

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15.5.5** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Styling with OKLCH colors
- **Framer Motion** - Animations
- **React Markdown** - Markdown rendering
- **Lucide React** - Icon library

### **Backend**
- **Next.js API Routes** - Serverless functions
- **OpenAI GPT-4 Turbo** - AI chat & tool calling
- **Server-Sent Events (SSE)** - Real-time streaming

### **APIs & Services**
- **Google Places API** - Location data & photos
- **Google Geocoding API** - Address → Coordinates
- **Google Distance Matrix** - Travel time calculation
- **Open-Meteo API** - Weather forecasts (free)
- **Ticketmaster API** (optional) - Event search

### **Infrastructure**
- **Vercel** - Hosting & deployment
- **Docker** - Containerization
- **Supabase** (optional) - Database & auth

---

## 📁 Project Structure

```
tripply-ai/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/
│   │   │   └── chat/stream/         # Streaming chat API
│   │   ├── page.tsx                 # Home page
│   │   └── layout.tsx               # Root layout
│   │
│   ├── components/
│   │   ├── cards/                   # Visual card components
│   │   │   ├── LocationCard.tsx    # Tourist attractions
│   │   │   ├── RestaurantCard.tsx  # Restaurants/cafes
│   │   │   ├── HotelCard.tsx       # Accommodations
│   │   │   ├── ActivityCard.tsx    # Activities/events
│   │   │   ├── CardGrid.tsx        # Grid layout
│   │   │   └── CardModal.tsx       # Detail modal
│   │   │
│   │   └── chat/                    # Chat interface
│   │       ├── ChatInterface.tsx   # Main chat container
│   │       ├── ChatMessage.tsx     # Message display
│   │       ├── ChatInput.tsx       # Input component
│   │       └── MarkdownRenderer.tsx # Custom markdown
│   │
│   ├── lib/
│   │   ├── ai/                      # AI orchestration
│   │   │   ├── openai.ts           # OpenAI client & prompts
│   │   │   ├── orchestrator.ts     # Tool calling logic
│   │   │   ├── tools.ts            # Tool definitions
│   │   │   └── cardExtractor.ts    # Extract cards from API
│   │   │
│   │   ├── tools/                   # External API integrations
│   │   │   ├── places.ts           # Google Places API
│   │   │   ├── weather.ts          # Weather API
│   │   │   ├── search.ts           # Web search
│   │   │   └── events.ts           # Event search
│   │   │
│   │   ├── utils/
│   │   │   └── errorHandler.ts     # Error handling
│   │   │
│   │   ├── logger.ts                # Production logging
│   │   └── utils.ts                 # Utility functions
│   │
│   ├── hooks/
│   │   └── useTripList.ts           # Trip management hook
│   │
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   │
│   └── middleware.ts                # Rate limiting & security
│
├── public/                           # Static assets
├── .env.local                        # Local environment vars (gitignored)
├── .env.example                      # Environment template
├── .env.production.example           # Production template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── Dockerfile                        # Docker container
├── docker-compose.yml                # Docker Compose
├── vercel.json                       # Vercel deployment
├── DEPLOYMENT.md                     # Deployment guide
└── README.md                         # This file
```

---

## 🔑 Environment Variables

### **Required Variables**

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-proj-your-key-here

# Google Places API Key (Required for image cards)
GOOGLE_PLACES_API_KEY=AIzaSy-your-key-here
```

### **Optional Variables**

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase (for user accounts & database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google APIs (additional features)
GOOGLE_SEARCH_API_KEY=AIzaSy-your-search-key
GOOGLE_SEARCH_ENGINE_ID=your-engine-id
GOOGLE_MAPS_API_KEY=AIzaSy-your-maps-key

# Weather API
WEATHER_PROVIDER=open-meteo
OPENWEATHER_API_KEY=your-key (if using OpenWeather)

# Events API
TICKETMASTER_API_KEY=your-key

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Production Settings
RATE_LIMIT_RPM=60
MAX_CONCURRENT_REQUESTS=10
DEBUG=false
```

See `.env.example` for complete list with descriptions.

---

## 🚢 Deployment

### **Deploy to Vercel (Recommended)**

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/tripply-ai.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - In Vercel dashboard: Settings → Environment Variables
   - Add `OPENAI_API_KEY`
   - Add `GOOGLE_PLACES_API_KEY`
   - Add other optional variables

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-project.vercel.app`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🧪 Testing

### **Test Locally**

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Run on different port
PORT=3001 npm start
```

### **Test with Docker**

```bash
# Build image
docker build -t tripply-ai .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your-key \
  -e GOOGLE_PLACES_API_KEY=your-key \
  tripply-ai

# Or use docker-compose
docker-compose up
```

### **Test Queries**

Try these to verify everything works:

1. **Restaurants:** "Find the best Italian restaurants in Rome"
2. **Hotels:** "Show me luxury hotels in Dubai"
3. **Attractions:** "What are the top 5 things to do in New York?"
4. **Weather:** "What's the weather like in London next week?"
5. **Activities:** "Find family-friendly activities in Orlando"

---

## 🔒 Security

### **Best Practices Implemented**

- ✅ All API keys in environment variables (never hardcoded)
- ✅ `.env.local` is gitignored
- ✅ Rate limiting (60 requests/min per IP)
- ✅ Security headers (XSS, CORS, etc.)
- ✅ Input validation and sanitization
- ✅ Error messages don't leak sensitive data
- ✅ HTTPS required in production
- ✅ CSP headers configured

### **Security Checklist**

- [ ] Rotate API keys regularly
- [ ] Enable 2FA on all accounts
- [ ] Monitor API usage and costs
- [ ] Set up alerts for unusual activity
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Use Vercel's built-in DDoS protection

---

## 📊 Performance

### **Optimizations**

- ⚡ Server-side rendering (SSR)
- ⚡ Image optimization (WebP, AVIF)
- ⚡ Code splitting
- ⚡ Streaming responses
- ⚡ CDN delivery (Vercel Edge Network)
- ⚡ Lazy loading components
- ⚡ Response caching

### **Metrics**

- Lighthouse Score: 95+ (Performance)
- First Contentful Paint: < 1s
- Time to Interactive: < 2s

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**

- Use TypeScript for all new code
- Follow existing code style
- Add comments for complex logic
- Test locally before submitting PR
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 Turbo API
- **Google** - Places API, Geocoding API, Maps
- **Open-Meteo** - Free weather API
- **Vercel** - Hosting and deployment
- **Next.js** - React framework
- **Tailwind CSS** - Utility-first CSS

---

## 📞 Support

- **Documentation:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues:** [GitHub Issues](https://github.com/your-username/tripply-ai/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/tripply-ai/discussions)

---

<div align="center">

**Built with ❤️ for travelers worldwide**

[⬆ Back to Top](#-tripply---ai-travel-research-assistant)

</div>

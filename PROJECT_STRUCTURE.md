# Tripply Project Structure

## Overview
This document outlines the structure and organization of the Tripply codebase.

## Directory Structure

```
tripply-ai/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── trips/           # Trip CRUD endpoints
│   │   │   ├── chat/            # Chat endpoint with AI
│   │   │   ├── cards/           # Card CRUD endpoints
│   │   │   └── auth/            # Authentication endpoints
│   │   ├── trips/               # Trip pages
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   └── globals.css          # Global styles
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layouts/             # 7 dynamic layout patterns
│   │   │   ├── Overview.tsx
│   │   │   ├── Stays.tsx
│   │   │   ├── Itinerary.tsx
│   │   │   ├── Nearby.tsx
│   │   │   ├── Transport.tsx
│   │   │   ├── Briefing.tsx
│   │   │   └── General.tsx
│   │   │
│   │   ├── shared/              # Reusable components
│   │   │   ├── SummaryBanner.tsx
│   │   │   ├── FactsGrid.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── CompareTable.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── WeatherStrip.tsx
│   │   │   ├── EventsList.tsx
│   │   │   └── AdvisoryCard.tsx
│   │   │
│   │   ├── chat/                # Chat-related components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── CitationPopover.tsx
│   │   │
│   │   └── trip-board/          # Trip board components
│   │       ├── TripBoard.tsx
│   │       ├── Card.tsx
│   │       ├── CardGrid.tsx
│   │       └── CompareDrawer.tsx
│   │
│   ├── lib/
│   │   ├── ai/                  # AI orchestration
│   │   │   ├── openai.ts       # OpenAI client setup
│   │   │   ├── tools.ts        # Tool definitions for function calling
│   │   │   └── orchestrator.ts # Main AI orchestration logic
│   │   │
│   │   ├── tools/               # Individual tool implementations
│   │   │   ├── weather.ts      # Weather API integration
│   │   │   ├── places.ts       # Google Places integration
│   │   │   ├── search.ts       # Google Search integration
│   │   │   └── events.ts       # Events API integration
│   │   │
│   │   ├── db/                  # Database utilities
│   │   │   ├── supabase.ts     # Supabase client
│   │   │   ├── queries.ts      # Database queries
│   │   │   └── migrations/     # SQL migration files
│   │   │
│   │   ├── layouts.ts           # Layout registry and intent detection
│   │   └── utils.ts             # Utility functions
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useLayoutState.ts   # Layout state management
│   │   ├── useChat.ts          # Chat management
│   │   └── useTripBoard.ts     # Trip board management
│   │
│   ├── stores/                  # State management (Zustand/Context)
│   │   ├── tripStore.ts
│   │   ├── chatStore.ts
│   │   └── layoutStore.ts
│   │
│   └── types/
│       └── index.ts             # TypeScript type definitions
│
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── components.json              # shadcn/ui configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Key Concepts

### 1. Layout System
The app uses a dynamic layout system that adapts to user intent:
- **7 layout patterns**: Overview, Stays, Itinerary, Nearby, Transport, Briefing, General
- Each layout is composed of reusable components
- Intent detection routes to the appropriate layout

### 2. AI Orchestration
- **OpenAI Function Calling**: Tools are defined and called based on user queries
- **Tool System**: Modular tools for weather, places, search, events
- **Citation System**: All responses include sources and timestamps

### 3. Trip Board
- **Cards**: Hotels, Spots, Food, Activities, Notes
- **Actions**: Favorite, Compare, Label, Pin
- **Smart Compare**: Auto-generated comparison tables

### 4. Chat Interface
- **Landing Mode**: Centered chat like ChatGPT
- **Active Mode**: Chat docked to top with results below
- **Focus Mode**: Return to centered chat

### 5. Data Flow
```
User Query → Intent Detection → Layout Selection → Tool Orchestration
    ↓                                                    ↓
  Chat UI  ←  Citation System  ←  Tool Results  ←  External APIs
    ↓
Trip Board (Save, Compare, Export)
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **State**: React Context / Zustand
- **Animation**: Framer Motion
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis
- **AI**: OpenAI GPT-4
- **APIs**: Google Search, Places, Maps; Open-Meteo; Ticketmaster

## Development Workflow

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Add shadcn/ui Components**:
   ```bash
   npx shadcn@latest add button card dialog
   ```

3. **Database Migrations**:
   - Write migrations in `src/lib/db/migrations/`
   - Run via Supabase CLI

4. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Fill in API keys and credentials

## MVP Scope

### Phase 1: Foundation (Week 1-2)
- ✅ Project setup
- ✅ Type definitions
- ✅ Layout system
- ⏳ Database schema
- ⏳ Basic auth
- ⏳ API routes structure

### Phase 2: AI & Tools (Week 2-3)
- OpenAI integration
- Tool system (Weather, Places, Search)
- Chat UI with transitions
- Intent detection

### Phase 3: Layouts & Components (Week 3-4)
- 7 dynamic layouts
- Reusable components
- Google Maps integration

### Phase 4: Trip Board (Week 4-5)
- Card CRUD
- Favorites & Compare
- Trip board UI

### Phase 5: Itinerary & Export (Week 5-6)
- Itinerary generator
- PDF export
- ICS calendar export

### Phase 6: Collaboration & Polish (Week 6)
- Sharing system
- Comments
- Responsive design
- Deployment

## Next Steps

See PRODUCT_SPEC.md for detailed feature requirements and roadmap.

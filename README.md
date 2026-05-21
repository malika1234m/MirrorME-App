# MirrorME — AI Fashion Social & Commerce App

MirrorME is a full-stack mobile app where users share outfits, get instant AI style analysis, rate each other's looks, follow fashion brands, and find where to buy any outfit they see.

---

## Tech Stack

**Mobile** — React Native, Expo, TypeScript, Expo Router, Zustand  
**Backend** — Node.js, Express, TypeScript, PostgreSQL, Prisma  
**AI** — OpenAI GPT-4o Vision (outfit analysis), text-embedding-3-small (product matching)  
**Cloud** — Cloudinary (image storage), JWT authentication

---

## Features

- **AI Outfit Analysis** — GPT-4o detects clothing types, colors, fashion style, season, and generates stylist tips
- **Social Feed** — Post outfits, like, comment, save, stories, follow system
- **Rate My Fit** — Swipe cards to rate community outfits 1–10
- **Find This Look** — Upload any photo, AI matches it to brand products using vector embeddings
- **Brand Pages** — Brands register, upload products, and get discovered through AI matching
- **Style DNA** — AI analyses your posts and shows your top style categories and color palette
- **Admin Panel** — In-app brand verification dashboard for the MirrorME team

---

## Project Structure

```
mirrorme/
├── backend/          # Express API (47 endpoints, 12 controllers)
│   ├── prisma/       # PostgreSQL schema (14 models) + migrations
│   └── src/          # Controllers, routes, middleware, services
└── mobile/           # Expo React Native app (21 screens)
    └── src/
        ├── app/      # File-based routing (auth, tabs, modals)
        ├── components/
        ├── services/ # API layer
        └── store/    # Zustand state
```

---

## Getting Started

### Prerequisites
- Node.js 18+, PostgreSQL 15, Cloudinary account, OpenAI API key, Expo Go app

### 1. Install dependencies

```bash
cd backend && npm install
cd ../mobile && npm install
```

### 2. Configure environment

**backend/.env**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mirrorme_db"
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=sk-your_openai_key
```

**mobile/.env**
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

### 3. Set up database

```bash
cd backend
npx prisma migrate dev
npm run db:seed
```

### 4. Run

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd mobile && npx expo start
```



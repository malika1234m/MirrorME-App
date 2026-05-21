# MirrorME — AI Fashion Social + Commerce Platform

> An AI-powered fashion social media app where users share outfits, get instant GPT-4o style analysis, rate each other's looks, follow brands, and find where to buy any outfit they see — all in a dark, modern mobile experience.

---

## Overview

MirrorME combines a fashion social network with an AI-driven commerce discovery engine. Users post outfits and receive real-time analysis from GPT-4o Vision — clothing types, color palette, style category, season, occasion, and stylist tips. Brands list their products and get matched to users searching for similar styles through vector embeddings and cosine similarity.

---

## Features

### For Users
- **Social Feed** — Infinite-scroll feed of followed creators, pull-to-refresh, load more
- **AI Outfit Analysis** — GPT-4o Vision detects clothing types, colors, fashion styles, season, occasion, and generates stylist tips on every post
- **Stories** — 24-hour stories with progress bars, pause/resume, view counts, and reply bar
- **Rate My Fit** — Swipe-card rating system (1–10). Swipe right = Fire, left = Pass, up = Iconic. Tap a number to submit instantly
- **Explore** — Mixed grid layout (featured + trio), filter by style category, switch to Brands tab, search creators and brands
- **Find This Look** — Upload any photo, AI describes the garment and matches it against brand product embeddings using cosine similarity
- **Style DNA** — AI analyses all your posts and shows your top style categories as a bar chart with percentages and your signature color palette
- **Post Detail** — Full AI tags, average rating, comments, similar outfit recommendations
- **Follow System** — Follow users, personalized feed, followers/following modals
- **Saved Outfits** — Bookmark any post, view all saved in profile
- **Notifications** — Notification centre (real-time system ready for integration)
- **Profile Editing** — Avatar, display name, username, bio

### For Brands
- **Brand Registration** — Register a brand page with category, bio, website, Instagram, location
- **Product Catalog** — Upload products with photo, title, price, shop link, sizes, fashion styles, season, occasion
- **AI Match Embedding** — Each product gets a text-embedding-3-small vector on upload, surfacing it in "Find This Look" results
- **Verification System** — Request verification from the MirrorME team, get a verified badge and PRO tier
- **Brand Discovery** — Brands appear in Explore, searchable by name, category, bio, location

### For Admins (MirrorME Team)
- **Admin Panel** — In-app dashboard with stats, pending verification queue, approve/reject/revoke controls
- **User Management** — View all users, grant admin access
- **Protected Routes** — All admin endpoints protected by `requireAdmin` middleware

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native · Expo SDK 51 · TypeScript |
| Navigation | Expo Router v3 (file-based routing) |
| State | Zustand |
| Backend | Node.js · Express · TypeScript |
| Database | PostgreSQL 15 · Prisma ORM |
| Auth | JWT · Expo SecureStore |
| Images | Cloudinary (outfits, avatars, stories, products) |
| AI Vision | OpenAI GPT-4o Vision API |
| AI Embeddings | OpenAI text-embedding-3-small (512 dimensions) |
| Similarity | Cosine similarity in application layer (JS) |
| UI | Custom dark theme · Expo LinearGradient · Expo BlurView · Expo Haptics |

---

## Architecture

```
mirrorme/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 14 models
│   │   └── seed.ts                # Sample data
│   └── src/
│       ├── config/                # Database, Cloudinary
│       ├── controllers/           # 12 controllers
│       │   ├── authController
│       │   ├── postController
│       │   ├── likeController
│       │   ├── commentController
│       │   ├── ratingController
│       │   ├── followController
│       │   ├── aiController
│       │   ├── recommendationController
│       │   ├── storyController
│       │   ├── businessController
│       │   ├── productController
│       │   ├── matchController
│       │   └── adminController
│       ├── middleware/             # auth, admin, upload, error
│       ├── routes/                 # 11 route modules
│       ├── services/               # openai, cloudinary, embedding
│       └── scripts/               # generateEmbeddings.ts
│
└── mobile/
    └── src/
        ├── app/
        │   ├── (auth)/            # Onboarding, Login, Register
        │   ├── (tabs)/            # Home, Explore, Upload, Rate, Profile
        │   ├── post/[id]          # Post detail
        │   ├── profile/[id]       # User profile
        │   ├── profile/edit       # Edit profile
        │   ├── stories/viewer     # Full-screen story viewer
        │   ├── stories/create     # Story creator
        │   ├── business/[id]      # Brand page
        │   ├── business/register  # Brand registration
        │   ├── business/edit      # Brand management
        │   ├── business/product-new # Add product
        │   ├── match/             # Find This Look
        │   ├── notifications      # Notifications screen
        │   └── admin/             # Admin panel
        ├── components/
        │   ├── ui/                # Button, Input, Avatar, Tag, LoadingSpinner, SkeletonCard
        │   ├── feed/              # PostCard, StoriesBar, TrendingSection, OutfitOfTheDay
        │   ├── outfit/            # OutfitAnalysisCard, RatingWidget, SimilarOutfits
        │   ├── profile/           # ProfileHeader, PostGrid, StyleDNA
        │   └── business/          # BrandCard, ProductCard
        ├── hooks/                 # useFeed, useProfile, useImagePicker
        ├── services/              # api, auth, post, ai, user, story, business, admin
        ├── store/                 # authStore, feedStore, postStore, storyStore
        ├── types/                 # Shared TypeScript interfaces
        └── utils/                 # formatters, validators
```

---

## Database Schema

14 models: `User`, `Post`, `OutfitAnalysis`, `Comment`, `Like`, `Rating`, `Follow`, `SavedOutfit`, `Story`, `StoryView`, `BusinessAccount`, `BusinessFollow`, `Product`, `SavedProduct`, `MatchSearch`

Key design decisions:
- `OutfitAnalysis` is 1-to-1 with `Post` — AI results stored separately so posts load instantly without waiting for AI
- `Product.embedding Float[]` stores 512-dimensional text embeddings for cosine similarity matching
- `Like` and `Rating` use compound unique constraints (`postId + userId`) for O(1) duplicate prevention
- All tag arrays (clothingTypes, colors, fashionStyles) use PostgreSQL native arrays
- Stories have a 24-hour TTL via `expiresAt` field, filtered server-side

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user (includes isAdmin) |
| PATCH | `/api/auth/profile` | Update profile |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/posts/feed` | Personalized feed (paginated) |
| GET | `/api/posts/explore` | Explore (filterable by style) |
| GET | `/api/posts/user/:userId` | User's posts |
| POST | `/api/posts` | Create post (multipart) |
| GET | `/api/posts/:id` | Post detail |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:postId/like` | Toggle like |

### Comments & Ratings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/comments/:postId` | Get comments |
| POST | `/api/comments/:postId` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/ratings/:postId` | Rate post (1–10) |
| GET | `/api/ratings/:postId` | Get rating |

### AI
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/analysis/:postId` | Outfit analysis |
| POST | `/api/ai/analyze/:postId` | Re-run AI analysis |
| GET | `/api/ai/stylist/:postId` | Stylist tips |
| GET | `/api/ai/similar/:postId` | Similar outfits |
| GET | `/api/ai/trending` | Trending posts |
| POST | `/api/ai/save/:postId` | Toggle save |
| GET | `/api/ai/saved` | Saved outfits |

### Stories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stories` | Active stories (grouped by user) |
| POST | `/api/stories` | Create story |
| POST | `/api/stories/:id/view` | Mark viewed |
| GET | `/api/stories/:id/viewers` | Viewer list |
| DELETE | `/api/stories/:id` | Delete story |

### Social
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/profile/:userId` | User profile |
| POST | `/api/users/:userId/toggle` | Follow / Unfollow |
| GET | `/api/users/:userId/followers` | Followers |
| GET | `/api/users/:userId/following` | Following |

### Business & Products
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/business` | List brands |
| GET | `/api/business/featured` | Featured brands |
| GET | `/api/business/me` | My brand |
| POST | `/api/business/register` | Register brand |
| PATCH | `/api/business/me` | Update brand |
| POST | `/api/business/me/request-verification` | Request verification |
| GET | `/api/business/:id` | Brand profile |
| POST | `/api/business/:id/follow` | Follow brand |
| GET | `/api/business/:id/products` | Brand products |
| POST | `/api/products` | Add product |
| GET | `/api/products/my` | My products |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/:id/save` | Save product |

### Match
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/match` | Find This Look (image → ranked products) |
| GET | `/api/match/history` | Search history |

### Admin (protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/brands` | All brands (filterable by status) |
| POST | `/api/admin/brands/:id/verify` | Verify brand |
| POST | `/api/admin/brands/:id/reject` | Reject verification |
| POST | `/api/admin/brands/:id/revoke` | Revoke verification |
| GET | `/api/admin/users` | All users |
| POST | `/api/admin/users/:id/grant-admin` | Grant admin |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15
- Cloudinary account
- OpenAI API key (GPT-4o access)
- Expo Go app (iOS / Android) or Xcode simulator

### 1. Clone and install

```bash
git clone https://github.com/yourusername/mirrorme.git
cd mirrorme

# Install backend dependencies
cd backend && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 2. Configure environment

**backend/.env**
```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://user:password@localhost:5432/mirrorme_db"

JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

OPENAI_API_KEY=sk-your_openai_key

ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

**mobile/.env**
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

> For physical device testing, replace `YOUR_LOCAL_IP` with your machine's LAN IP (`ipconfig getifaddr en0` on Mac).

### 3. Set up the database

```bash
cd backend

# Run migrations
npx prisma migrate dev

# Seed sample data (5 users, 4 brands, 8 posts, 8 products, 8 stories)
npm run db:seed
```

### 4. Run the backend

```bash
cd backend
npm run dev
# API running at http://localhost:3000
```

### 5. Run the mobile app

```bash
cd mobile
npx expo start
# Press i for iOS simulator, or scan QR with Expo Go
```

### 6. Generate product embeddings (requires OpenAI credits)

```bash
cd backend
npx ts-node src/scripts/generateEmbeddings.ts
```

---

## Sample Accounts

After seeding, these accounts are available:

| Type | Email | Password |
|---|---|---|
| User | aria@mirrorme.app | Password123! |
| User | noah@mirrorme.app | Password123! |
| Brand | studio.nomo@mirrorme.app | Password123! |
| Brand | hype.era@mirrorme.app | Password123! |

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0A0A0A` | App background |
| `card` | `#141414` | Cards, inputs |
| `primary` | `#C8FF00` | Buttons, accents |
| `accent` | `#FF3CAC` | Likes, hearts |
| `accentBlue` | `#784BA0` | Tags, badges |
| `warning` | `#FFB800` | Stars, ratings |

---

## License

MIT

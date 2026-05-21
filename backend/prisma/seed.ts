import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Real Unsplash fashion images (stable CDN URLs)
const OUTFIT_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
    publicId: "mirrorme/sample_1",
  },
  {
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
    publicId: "mirrorme/sample_2",
  },
  {
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80",
    publicId: "mirrorme/sample_3",
  },
  {
    url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
    publicId: "mirrorme/sample_4",
  },
  {
    url: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&q=80",
    publicId: "mirrorme/sample_5",
  },
  {
    url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
    publicId: "mirrorme/sample_6",
  },
  {
    url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80",
    publicId: "mirrorme/sample_7",
  },
  {
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    publicId: "mirrorme/sample_8",
  },
];

const AVATAR_IMAGES = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
];

const SEED_USERS = [
  {
    email: "aria@mirrorme.app",
    username: "aria.fits",
    displayName: "Aria Chen",
    bio: "Minimal aesthetics. Thrifted finds. Seoul-inspired street style 🇰🇷",
    avatarUrl: AVATAR_IMAGES[0],
  },
  {
    email: "noah@mirrorme.app",
    username: "noahwears",
    displayName: "Noah Williams",
    bio: "Menswear enthusiast. Tailoring > trends. Based in NYC 🗽",
    avatarUrl: AVATAR_IMAGES[1],
  },
  {
    email: "zoe@mirrorme.app",
    username: "zoe.style",
    displayName: "Zoë Laurent",
    bio: "Parisian casual. Effortless chic. Vintage collector 🥐",
    avatarUrl: AVATAR_IMAGES[2],
  },
  {
    email: "kai@mirrorme.app",
    username: "kylooks",
    displayName: "Kai Park",
    bio: "Streetwear + high fashion. Sneaker rotation always fresh 👟",
    avatarUrl: AVATAR_IMAGES[3],
  },
  {
    email: "mia@mirrorme.app",
    username: "miala",
    displayName: "Mia Adeyemi",
    bio: "Bold prints, bold statements. Lagos → London 🌍",
    avatarUrl: AVATAR_IMAGES[4],
  },
];

const POST_DATA = [
  {
    caption: "Sunday market haul — thrifted linen set for under $30 ✨ #ThriftedFashion #MinimalStyle",
    tags: ["thrifted", "linen", "minimal", "sustainable"],
    analysis: {
      clothingTypes: ["Linen blazer", "Wide-leg trousers"],
      colors: ["Cream", "Off-white", "Beige"],
      fashionStyles: ["Minimalist", "Business Casual"],
      stylistTips: ["Roll the sleeves for a relaxed look", "Add a leather belt to define the waist", "Pair with white sneakers for a modern edge"],
      season: "Spring/Summer",
      occasion: "Casual",
      overallStyle: "Effortless minimalism with a focus on clean lines and neutral tones.",
      confidence: 0.91,
    },
  },
  {
    caption: "Bringing the tailored look to the streets 🖤 #MenswearStyle #Tailored",
    tags: ["menswear", "tailored", "streetstyle", "monochrome"],
    analysis: {
      clothingTypes: ["Structured blazer", "Slim trousers", "Chelsea boots"],
      colors: ["Charcoal", "Black", "Dark navy"],
      fashionStyles: ["Smart Casual", "Classic"],
      stylistTips: ["No-tie look keeps it modern", "Pocket square adds a finishing touch", "Opt for a slim fit to avoid a boxy silhouette"],
      season: "Autumn/Winter",
      occasion: "Business",
      overallStyle: "Sharp and intentional — a refined take on classic menswear.",
      confidence: 0.88,
    },
  },
  {
    caption: "Parisian Sunday energy ☕ Trench + ballet flats forever #ParisianStyle",
    tags: ["parisian", "trench", "effortlesschic", "classic"],
    analysis: {
      clothingTypes: ["Trench coat", "Striped top", "High-waist jeans", "Ballet flats"],
      colors: ["Camel", "Navy stripe", "Pale blue"],
      fashionStyles: ["French Chic", "Classic", "Casual"],
      stylistTips: ["Keep accessories minimal for authentic Parisian feel", "Tuck the top halfway for a relaxed silhouette", "A structured bag elevates the whole look"],
      season: "Spring",
      occasion: "Casual",
      overallStyle: "Classic French elegance — understated and eternally chic.",
      confidence: 0.94,
    },
  },
  {
    caption: "Dropped my latest rotation — what do you think? 👟 #Streetwear #SneakerHead",
    tags: ["streetwear", "sneakers", "hype", "urban"],
    analysis: {
      clothingTypes: ["Oversized hoodie", "Cargo pants", "High-top sneakers"],
      colors: ["Sage green", "Cream", "Triple white"],
      fashionStyles: ["Streetwear", "Urban"],
      stylistTips: ["Taper the cargo pant cuff to show off the sneaker", "Layer a longline tee under the hoodie", "Keep the colour palette tight — 2-3 max"],
      season: "Year-round",
      occasion: "Casual",
      overallStyle: "Clean streetwear with thoughtful proportions and a muted palette.",
      confidence: 0.87,
    },
  },
  {
    caption: "Ankara power 🧡 Wearing my heritage, always. #AfricanFashion #BoldPrints",
    tags: ["ankara", "africanfashion", "boldprints", "culture"],
    analysis: {
      clothingTypes: ["Ankara co-ord set", "Structured top", "Wide skirt"],
      colors: ["Orange", "Gold", "Deep brown", "Cream"],
      fashionStyles: ["Afrocentric", "Bold"],
      stylistTips: ["Gold jewellery complements Ankara perfectly", "Keep hair and makeup clean to let the fabric speak", "Block heel sandals balance the wide silhouette"],
      season: "Spring/Summer",
      occasion: "Event",
      overallStyle: "Vibrant cultural expression — confident, joyful, and unmistakably bold.",
      confidence: 0.92,
    },
  },
  {
    caption: "Quiet luxury edit this week 🤍 Less is more. #QuietLuxury #Elevated",
    tags: ["quietluxury", "neutral", "elevated", "minimal"],
    analysis: {
      clothingTypes: ["Cashmere turtleneck", "Straight-cut trousers", "Loafers"],
      colors: ["Ivory", "Taupe", "Warm white"],
      fashionStyles: ["Quiet Luxury", "Minimalist"],
      stylistTips: ["Invest in fabric quality — it shows in photos", "Tuck the turtleneck fully for a sleek line", "A simple gold watch is the only accessory needed"],
      season: "Autumn/Winter",
      occasion: "Smart Casual",
      overallStyle: "Understated elegance — the uniform of effortless sophistication.",
      confidence: 0.95,
    },
  },
  {
    caption: "Thrift flip reveal 🔄 Vintage blazer restyled for 2024 #ThriftFlip #Vintage",
    tags: ["thriftflip", "vintage", "upcycled", "sustainable"],
    analysis: {
      clothingTypes: ["Vintage oversized blazer", "Crop top", "Straight jeans"],
      colors: ["Mustard yellow", "White", "Light blue denim"],
      fashionStyles: ["Vintage", "Eclectic", "Casual"],
      stylistTips: ["Cinch the blazer with a thin belt for shape", "Roll up sleeves to show contrast lining", "Chunky boots ground the oversized proportions"],
      season: "Autumn",
      occasion: "Casual",
      overallStyle: "Playful vintage revival with a modern street-style sensibility.",
      confidence: 0.85,
    },
  },
  {
    caption: "Summer evening look 🌅 Garden party ready #SummerFashion #GoldenHour",
    tags: ["summer", "eveningwear", "floral", "feminine"],
    analysis: {
      clothingTypes: ["Floral midi dress", "Strappy sandals", "Linen blazer"],
      colors: ["Blush pink", "Sage green", "Cream"],
      fashionStyles: ["Feminine", "Romantic", "Smart Casual"],
      stylistTips: ["Layer the linen blazer for cooler evenings", "Delicate gold jewellery enhances the feminine silhouette", "A mini bag keeps the look light and airy"],
      season: "Summer",
      occasion: "Event",
      overallStyle: "Romantic summer dressing — light, fresh, and garden-party perfect.",
      confidence: 0.89,
    },
  },
];

const COMMENTS = [
  "This look is everything 🔥",
  "Obsessed with the colour combo!",
  "Where's the blazer from?",
  "Major inspo, saving this 💾",
  "You always nail the proportions",
  "The thrifted life is the best life ♻️",
  "Rating this a 10/10 no notes",
  "Can you do a breakdown of this outfit?",
  "This is so your vibe 👏",
  "Goals honestly",
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data in correct order
  await prisma.savedOutfit.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.outfitAnalysis.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // Create users
  const users = await Promise.all(
    SEED_USERS.map((u) =>
      prisma.user.create({
        data: { ...u, password: hashedPassword, isVerified: true },
      })
    )
  );
  console.log(`✅ Created ${users.length} users`);

  // Everyone follows everyone else
  const followPairs: { followerId: string; followingId: string }[] = [];
  for (const follower of users) {
    for (const following of users) {
      if (follower.id !== following.id) {
        followPairs.push({ followerId: follower.id, followingId: following.id });
      }
    }
  }
  await prisma.follow.createMany({ data: followPairs });
  console.log(`✅ Created ${followPairs.length} follows`);

  // Create posts — distribute among users
  const posts = await Promise.all(
    POST_DATA.map((pd, i) => {
      const author = users[i % users.length];
      const img = OUTFIT_IMAGES[i % OUTFIT_IMAGES.length];
      return prisma.post.create({
        data: {
          userId: author.id,
          imageUrl: img.url,
          publicId: img.publicId,
          caption: pd.caption,
          tags: pd.tags,
          isPublic: true,
          viewCount: Math.floor(Math.random() * 800) + 100,
          outfitAnalysis: { create: pd.analysis },
        },
      });
    })
  );
  console.log(`✅ Created ${posts.length} posts with outfit analyses`);

  // Likes — each user likes most posts (skip their own)
  const likePairs: { postId: string; userId: string }[] = [];
  for (const post of posts) {
    for (const user of users) {
      if (user.id !== post.userId && Math.random() > 0.2) {
        likePairs.push({ postId: post.id, userId: user.id });
      }
    }
  }
  await prisma.like.createMany({ data: likePairs });
  console.log(`✅ Created ${likePairs.length} likes`);

  // Comments — 2-3 per post from random other users
  for (const post of posts) {
    const commenters = users.filter((u) => u.id !== post.userId).slice(0, 3);
    for (const commenter of commenters) {
      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: commenter.id,
          content: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
        },
      });
    }
  }
  console.log(`✅ Created comments`);

  // Ratings — 1–5 stars, most users rate most posts
  const ratingPairs: { postId: string; userId: string; score: number }[] = [];
  for (const post of posts) {
    for (const user of users) {
      if (user.id !== post.userId && Math.random() > 0.3) {
        ratingPairs.push({
          postId: post.id,
          userId: user.id,
          score: Math.floor(Math.random() * 3) + 3, // 3–5 stars
        });
      }
    }
  }
  await prisma.rating.createMany({ data: ratingPairs });
  console.log(`✅ Created ${ratingPairs.length} ratings`);

  // Stories — 1-2 stories per user using outfit images, expiry 24h from now
  const STORY_IMAGES = [
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1080&q=80",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1080&q=80",
    "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1080&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1080&q=80",
    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1080&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&q=80",
  ];
  const STORY_CAPTIONS = [
    "GRWM: Sunday thrift haul 🛍️",
    "POV: perfect autumn fit check ☕",
    "Today's palette 🎨",
    "Minimal morning look ✨",
    "NYC streets, always ⚡",
    "Ankara season never ends 🧡",
    "Quiet luxury Sunday 🤍",
    null,
  ];
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const storyData: { userId: string; imageUrl: string; publicId: string; caption: string | null; expiresAt: Date }[] = [];
  users.forEach((user, ui) => {
    const count = Math.floor(Math.random() * 2) + 1;
    for (let s = 0; s < count; s++) {
      const imgIdx = (ui * 2 + s) % STORY_IMAGES.length;
      storyData.push({
        userId: user.id,
        imageUrl: STORY_IMAGES[imgIdx],
        publicId: `mirrorme/stories/seed_${ui}_${s}`,
        caption: STORY_CAPTIONS[imgIdx] ?? null,
        expiresAt,
      });
    }
  });
  await prisma.story.createMany({ data: storyData });
  console.log(`✅ Created ${storyData.length} stories`);

  console.log("\n🎉 Seed complete! Test account credentials:");
  console.log("   Email: aria@mirrorme.app");
  console.log("   Password: Password123!");
  console.log("\n   All 5 accounts use the same password: Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

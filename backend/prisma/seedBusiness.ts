import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BUSINESSES = [
  {
    email: "studio.nomo@mirrorme.app",
    username: "studionomo",
    displayName: "Studio NOMO",
    business: {
      brandName: "Studio NOMO",
      slug: "studio-nomo",
      category: "Minimalist",
      bio: "Clean lines. Considered materials. Designed to last forever.",
      website: "https://studionomo.com",
      instagram: "@studionomo",
      location: "Copenhagen, DK",
      isVerified: true,
    },
  },
  {
    email: "hype.era@mirrorme.app",
    username: "hypeera",
    displayName: "HYPE ERA",
    business: {
      brandName: "HYPE ERA",
      slug: "hype-era",
      category: "Streetwear",
      bio: "Street culture. Drop culture. Your era.",
      website: "https://hypeera.co",
      instagram: "@hypeera",
      location: "Los Angeles, US",
      isVerified: true,
    },
  },
  {
    email: "velour.atelier@mirrorme.app",
    username: "velouratelier",
    displayName: "Velour Atelier",
    business: {
      brandName: "Velour Atelier",
      slug: "velour-atelier",
      category: "Old Money",
      bio: "Heritage tailoring for the modern wardrobe. Quiet luxury, always.",
      website: "https://velouratelier.com",
      instagram: "@velouratelier",
      location: "Milan, IT",
      isVerified: true,
    },
  },
  {
    email: "threadroot@mirrorme.app",
    username: "threadroot",
    displayName: "ThreadRoot",
    business: {
      brandName: "ThreadRoot",
      slug: "threadroot",
      category: "Sustainable",
      bio: "Organic, recycled, circular. Fashion that doesn't cost the planet.",
      website: "https://threadroot.earth",
      instagram: "@threadroot",
      location: "Amsterdam, NL",
      isVerified: false,
    },
  },
];

const PRODUCTS = [
  // Studio NOMO — Minimalist
  {
    bizSlug: "studio-nomo",
    products: [
      {
        title: "Linen Oversized Blazer",
        description: "Unstructured linen blazer in sand. Drop shoulder, two patch pockets. Slightly oversized fit.",
        price: 285, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
        shopLink: "https://studionomo.com/linen-blazer",
        fashionStyles: ["Minimalist", "Business Casual"],
        colors: ["Sand", "Cream"],
        clothingTypes: ["Blazer"],
        sizes: ["XS", "S", "M", "L", "XL"],
        season: "Spring/Summer",
        occasion: "Smart Casual",
      },
      {
        title: "Wide Leg Trousers – Ivory",
        description: "High-waisted wide-leg trousers in ivory crepe. Invisible zip, full lining.",
        price: 195, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
        shopLink: "https://studionomo.com/wide-leg",
        fashionStyles: ["Minimalist", "Quiet Luxury"],
        colors: ["Ivory", "Off-White"],
        clothingTypes: ["Trousers"],
        sizes: ["XS", "S", "M", "L"],
        season: "All-Season",
        occasion: "Work",
      },
      {
        title: "Cashmere Turtleneck",
        description: "100% grade-A cashmere turtleneck in camel. Ribbed cuffs and hem.",
        price: 320, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80",
        shopLink: "https://studionomo.com/cashmere-turtle",
        fashionStyles: ["Minimalist", "Old Money"],
        colors: ["Camel", "Warm Beige"],
        clothingTypes: ["Knitwear", "Turtleneck"],
        sizes: ["S", "M", "L"],
        season: "Autumn/Winter",
        occasion: "Smart Casual",
      },
    ],
  },
  // HYPE ERA — Streetwear
  {
    bizSlug: "hype-era",
    products: [
      {
        title: "Cargo Jogger – Sage",
        description: "Technical cargo jogger with six pockets. Adjustable ankle, drawstring waist.",
        price: 145, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80",
        shopLink: "https://hypeera.co/cargo-jogger",
        fashionStyles: ["Streetwear", "Athleisure"],
        colors: ["Sage Green", "Olive"],
        clothingTypes: ["Cargo Pants", "Joggers"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        season: "All-Season",
        occasion: "Casual",
      },
      {
        title: "Washed Graphic Hoodie",
        description: "Heavyweight 400gsm hoodie with vintage wash. Embroidered chest logo.",
        price: 120, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80",
        shopLink: "https://hypeera.co/hoodie",
        fashionStyles: ["Streetwear", "Grunge"],
        colors: ["Washed Black", "Charcoal"],
        clothingTypes: ["Hoodie", "Sweatshirt"],
        sizes: ["S", "M", "L", "XL"],
        season: "Autumn/Winter",
        occasion: "Casual",
      },
    ],
  },
  // Velour Atelier — Old Money
  {
    bizSlug: "velour-atelier",
    products: [
      {
        title: "Tailored Wool Coat",
        description: "Double-breasted wool coat. Peak lapel, structured shoulders, full canvas construction.",
        price: 890, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80",
        shopLink: "https://velouratelier.com/wool-coat",
        fashionStyles: ["Old Money", "Classic", "Quiet Luxury"],
        colors: ["Charcoal", "Dark Navy"],
        clothingTypes: ["Coat", "Outerwear"],
        sizes: ["36", "38", "40", "42", "44"],
        season: "Autumn/Winter",
        occasion: "Business",
      },
      {
        title: "Silk Blouse – Champagne",
        description: "Silk charmeuse blouse with pussy bow. Relaxed fit, French seams.",
        price: 340, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&q=80",
        shopLink: "https://velouratelier.com/silk-blouse",
        fashionStyles: ["Old Money", "Feminine", "Business Casual"],
        colors: ["Champagne", "Ivory", "Gold"],
        clothingTypes: ["Blouse", "Top"],
        sizes: ["XS", "S", "M", "L"],
        season: "All-Season",
        occasion: "Work",
      },
    ],
  },
  // ThreadRoot — Sustainable
  {
    bizSlug: "threadroot",
    products: [
      {
        title: "Organic Linen Shirt Dress",
        description: "100% organic linen. Relaxed midi length, button front, patch pockets.",
        price: 165, currency: "USD",
        imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
        shopLink: "https://threadroot.earth/shirt-dress",
        fashionStyles: ["Cottagecore", "Minimalist", "Boho"],
        colors: ["Natural", "Undyed Linen"],
        clothingTypes: ["Dress", "Shirt Dress"],
        sizes: ["XS", "S", "M", "L", "XL"],
        season: "Spring/Summer",
        occasion: "Casual",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding business accounts...");
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  for (const biz of BUSINESSES) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: biz.email },
      update: {},
      create: {
        email: biz.email,
        username: biz.username,
        displayName: biz.displayName,
        password: hashedPassword,
        isVerified: true,
      },
    });

    // Upsert business account
    await prisma.businessAccount.upsert({
      where: { userId: user.id },
      update: biz.business,
      create: { userId: user.id, ...biz.business },
    });

    console.log(`✅ Business: ${biz.business.brandName}`);
  }

  console.log("🌱 Seeding products...");
  for (const group of PRODUCTS) {
    const business = await prisma.businessAccount.findUnique({ where: { slug: group.bizSlug } });
    if (!business) { console.log(`⚠️ Business ${group.bizSlug} not found`); continue; }

    for (const p of group.products) {
      const existing = await prisma.product.findFirst({
        where: { businessId: business.id, title: p.title },
      });
      if (!existing) {
        await prisma.product.create({
          data: {
            businessId: business.id,
            publicId: `mirrorme/products/seed_${Date.now()}`,
            embedding: [],
            ...p,
          },
        });
      }
    }
    console.log(`✅ Products for ${group.bizSlug}`);
  }

  console.log("\n🎉 Business seed complete!");
  console.log("   Business login: studio.nomo@mirrorme.app / Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * One-time script: generate embeddings for all products that have empty embedding arrays.
 * Run with: npx ts-node src/scripts/generateEmbeddings.ts
 */
import { PrismaClient } from "@prisma/client";
import { embedImage } from "../services/embeddingService";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, title: true, imageUrl: true, embedding: true },
  });

  const toEmbed = products.filter((p) => !p.embedding || p.embedding.length === 0);
  console.log(`Found ${toEmbed.length} products without embeddings out of ${products.length} total.`);

  if (toEmbed.length === 0) {
    console.log("All products already have embeddings. Done.");
    return;
  }

  let success = 0;
  let failed = 0;

  for (const product of toEmbed) {
    process.stdout.write(`  Embedding "${product.title}"... `);
    try {
      const embedding = await embedImage(product.imageUrl);
      await prisma.product.update({
        where: { id: product.id },
        data: { embedding },
      });
      console.log(`✓ (${embedding.length} dims)`);
      success++;
    } catch (err) {
      console.log(`✗ FAILED: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
    // Small delay to avoid OpenAI rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const PRODUCT_IMAGES = {
  "SHREE-TOY-001": [
    { url: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=800&auto=format&fit=crop&q=80", alt: "Chintu Soft Teddy Bear 60cm", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80", alt: "Chintu Soft Teddy Bear Detail", isPrimary: false }
  ],
  "SHREE-TOY-002": [
    { url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80", alt: "Guddu Bunny Plush with Bow", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80", alt: "Guddu Bunny Plush Side", isPrimary: false }
  ],
  "SHREE-TOY-003": [
    { url: "https://images.unsplash.com/photo-1530041539828-114de669390e?w=800&auto=format&fit=crop&q=80", alt: "Sheru Lion Soft Toy", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=800&auto=format&fit=crop&q=80", alt: "Sheru Lion Soft Toy Detail", isPrimary: false }
  ],
  "SHREE-TOY-004": [
    { url: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&auto=format&fit=crop&q=80", alt: "Vyapaar Junior Board Game", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&auto=format&fit=crop&q=80", alt: "Vyapaar Junior Board Game Board", isPrimary: false }
  ],
  "SHREE-TOY-005": [
    { url: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80", alt: "Shabdkosh Hindi Scrabble-Style Game", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1585504198199-20277593b94f?w=800&auto=format&fit=crop&q=80", alt: "Shabdkosh Game Tiles", isPrimary: false }
  ],
  "SHREE-TOY-006": [
    { url: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80", alt: "Dhoom RC Stunt Car (Rechargeable)", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop&q=80", alt: "Dhoom RC Stunt Car Action", isPrimary: false }
  ],
  "SHREE-TOY-007": [
    { url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80", alt: "Chhota Racer RC Buggy", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80", alt: "Chhota Racer RC Buggy Remote", isPrimary: false }
  ],
  "SHREE-TOY-008": [
    { url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80", alt: "Ganit Blocks 100pc Educational Set", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1576723417715-6b408c988c23?w=800&auto=format&fit=crop&q=80", alt: "Ganit Blocks Set Built", isPrimary: false }
  ],
  "SHREE-TOY-009": [
    { url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80", alt: "Tara Science Kit: Volcano & Crystals", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=80", alt: "Tara Science Kit Experiment", isPrimary: false }
  ],
  "SHREE-TOY-010": [
    { url: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&auto=format&fit=crop&q=80", alt: "Akshar Puzzle Mat (Hindi+English)", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80", alt: "Akshar Puzzle Mat Assembled", isPrimary: false }
  ],
  "SHREE-JWL-001": [
    { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80", alt: "Rani Gold-Plated Pearl Necklace Set", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80", alt: "Rani Gold Pearl Necklace Closeup", isPrimary: false }
  ],
  "SHREE-JWL-002": [
    { url: "https://images.unsplash.com/photo-1611591475152-4735d4910b8b?w=800&auto=format&fit=crop&q=80", alt: "Meena Kundan Choker Necklace", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80", alt: "Meena Kundan Choker Detail", isPrimary: false }
  ],
  "SHREE-JWL-003": [
    { url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80", alt: "Chandbali Silver-925 Jhumka Earrings", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=800&auto=format&fit=crop&q=80", alt: "Chandbali Silver Jhumka Pair", isPrimary: false }
  ],
  "SHREE-JWL-004": [
    { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80", alt: "Gulnaar Rose-Gold Stud Earrings", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80", alt: "Gulnaar Rose-Gold Studs Closeup", isPrimary: false }
  ],
  "SHREE-JWL-005": [
    { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", alt: "Bandhan Gold-Plated Couple Rings (Set of 2)", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80", alt: "Bandhan Couple Rings Detail", isPrimary: false }
  ],
  "SHREE-JWL-006": [
    { url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80", alt: "Neelam American Diamond Ring", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80", alt: "Neelam American Diamond Ring Side", isPrimary: false }
  ],
  "SHREE-JWL-007": [
    { url: "https://images.unsplash.com/photo-1611591475152-4735d4910b8b?w=800&auto=format&fit=crop&q=80", alt: "Suhagan Red-Gold Bangle Set (4pc)", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80", alt: "Suhagan Bangle Set Detail", isPrimary: false }
  ],
  "SHREE-JWL-008": [
    { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80", alt: "Payal Silver-925 Anklet Pair with Ghungroo", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80", alt: "Payal Silver Anklet Pair Closeup", isPrimary: false }
  ],
  "SHREE-JWL-009": [
    { url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80", alt: "Morni Oxidised Anklet Pair", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80", alt: "Morni Oxidised Anklet Charms", isPrimary: false }
  ],
  "SHREE-JWL-010": [
    { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80", alt: "Kamarbandh Gold-Plated Waist Chain", isPrimary: true },
    { url: "https://images.unsplash.com/photo-1611591475152-4735d4910b8b?w=800&auto=format&fit=crop&q=80", alt: "Kamarbandh Waist Chain Detail", isPrimary: false }
  ]
};

async function updateImages() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const db = mongoose.connection.db;
  const productsCollection = db.collection("products");

  let updatedCount = 0;
  for (const [sku, images] of Object.entries(PRODUCT_IMAGES)) {
    const res = await productsCollection.updateOne(
      { sku },
      { $set: { images } }
    );
    if (res.matchedCount > 0) {
      console.log(`Updated images for SKU: ${sku}`);
      updatedCount++;
    } else {
      console.log(`SKU not found: ${sku}`);
    }
  }

  console.log(`Successfully updated ${updatedCount} products with high-res images in database.`);
  await mongoose.disconnect();
}

updateImages().catch(err => {
  console.error("Error updating images:", err);
  process.exit(1);
});

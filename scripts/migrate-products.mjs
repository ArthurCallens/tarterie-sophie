// One-time seed: uploads the current hardcoded product photos to Supabase Storage
// and inserts the matching rows into `products` / `product_images` / `custom_cake_offer` /
// `custom_cake_gallery_images`. Not idempotent — re-running without truncating first will
// create duplicate rows (Storage uploads will fail on the second run since paths collide).
//
// Usage: npm run migrate:products
// Requires .env.local with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.join(__dirname, "..", "src", "assets", "photos");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const PRODUCTS = [
  {
    file: "rolcake-frambozen.jpg",
    name: "Verticale rolcake met creamcheesefrosting en frambozencoulis",
    description: null,
    price: 5,
    category: "klassieker",
    allergens: ["gluten", "ei", "melk"],
    alt: "Verticale rolcake met een spiraal van cake en frambozencoulis, afgewerkt met creamcheesefrosting",
    featured: true,
    sort_order: 0,
  },
  {
    file: "cheesecake-citroen-limoen.jpg",
    name: "Citroen/limoen cheesecake met mango coulis",
    description: "of frambozen of bosbessen coulis",
    price: 3,
    category: "klassieker",
    allergens: ["gluten", "ei", "melk"],
    alt: "Citroen-limoen cheesecake met een glanzende mango coulis erover uitgegoten",
    featured: true,
    sort_order: 1,
  },
  {
    file: "citroen-meringue.jpg",
    name: "Citroen meringue",
    description: null,
    price: 3,
    category: "klassieker",
    allergens: ["gluten", "ei"],
    alt: "Individuele citroenmeringuetaartjes met een geschroeide meringuetop",
    featured: true,
    sort_order: 2,
  },
  {
    file: "fraisier.jpg",
    name: "Fraisier",
    description: null,
    price: 5,
    category: "klassieker",
    allergens: ["gluten", "ei", "melk"],
    alt: "Klassieke Franse fraisier met verse aardbeien zichtbaar aan de zijkant van de taart",
    featured: false,
    sort_order: 3,
  },
  {
    file: "aardbeientaart.jpg",
    name: "Aardbeientaart met witte chocoladecrème",
    description: "op een bodem van zanddeeg",
    price: 3,
    category: "klassieker",
    allergens: ["gluten", "ei", "melk"],
    alt: "Aardbeientaart op een zanddeegbodem met witte chocoladecrème en verse aardbeien",
    featured: false,
    sort_order: 4,
  },
  {
    file: "merveilleux.jpg",
    name: "Merveilleux",
    description: null,
    price: 3.5,
    category: "klein-gebak",
    allergens: ["ei", "melk"],
    alt: "Merveilleux gebakjes met een krokante meringuekern en room, bestrooid met chocoladeschilfers",
    featured: true,
    sort_order: 0,
  },
];

const CUSTOM_CAKE_OFFER = {
  intro:
    "Geef je een bijzonder feestje en wil je graag een iets persoonlijkere taart, dan maakt een gepersonaliseerde taart je feest helemaal af!",
  price: 8,
  price_unit: "EUR/pp",
  detail: "Deze taarten zijn telkens samengesteld uit lagen biscuit, met daartussen een vulling naar keuze.",
  fillings: [
    "Mascarponeroom met frambozenconfituur",
    "Mascarponeroom met lemoncurd",
    "Creamcheesefrosting met frambozenconfituur",
    "Creamcheesefrosting met lemoncurd",
    "Chocoladecremeux",
    "Chocomousse",
    "Hazelnoot/mokka botercreme",
    "Mascarponeroom met verse aardbeien (afhankelijk van het seizoen)",
  ],
};

const CUSTOM_CAKE_GALLERY = [
  { file: "gepersonaliseerd-1.jpg", alt: "Voorbeeld van een gepersonaliseerde themataart, met de hand afgewerkt" },
  {
    file: "gepersonaliseerd-2.jpg",
    alt: "Voorbeeld van een gepersonaliseerde themataart voor een speciale gelegenheid",
  },
  { file: "gepersonaliseerd-3.jpg", alt: "Voorbeeld van een gepersonaliseerde themataart met decoratieve details" },
];

async function uploadPhoto(storagePath, fileName) {
  const filePath = path.join(photosDir, fileName);
  const buffer = readFileSync(filePath);
  const { error } = await supabase.storage
    .from("product-images")
    .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function migrateProducts() {
  for (const product of PRODUCTS) {
    const { data: row, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        allergens: product.allergens,
        featured: product.featured,
        sort_order: product.sort_order,
      })
      .select()
      .single();
    if (error) throw new Error(`Insert failed for ${product.name}: ${error.message}`);

    const storagePath = `products/${row.id}/${product.file}`;
    const url = await uploadPhoto(storagePath, product.file);

    const { error: imageError } = await supabase
      .from("product_images")
      .insert({ product_id: row.id, image_url: url, alt_text: product.alt, sort_order: 0 });
    if (imageError) throw new Error(`Image insert failed for ${product.name}: ${imageError.message}`);

    console.log(`✓ ${product.name}`);
  }
}

async function migrateCustomCakeOffer() {
  const { error } = await supabase.from("custom_cake_offer").upsert({ id: 1, ...CUSTOM_CAKE_OFFER });
  if (error) throw new Error(`Custom cake offer insert failed: ${error.message}`);

  for (const [index, item] of CUSTOM_CAKE_GALLERY.entries()) {
    const storagePath = `custom-cake/${item.file}`;
    const url = await uploadPhoto(storagePath, item.file);
    const { error: imageError } = await supabase
      .from("custom_cake_gallery_images")
      .insert({ offer_id: 1, image_url: url, alt_text: item.alt, sort_order: index });
    if (imageError) throw new Error(`Custom cake gallery insert failed for ${item.file}: ${imageError.message}`);
  }

  console.log("✓ Custom cake offer + gallery");
}

async function main() {
  console.log("Migrating products…");
  await migrateProducts();
  console.log("Migrating custom cake offer…");
  await migrateCustomCakeOffer();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// One-time seed: uploads the current hardcoded site photos (hero, portrait,
// workshop) to Supabase Storage and inserts the matching `page_content` /
// `trust_badges` / `order_steps` / `workshops` rows, so the switch from
// hardcoded copy (src/lib/data.ts) to the DB-backed CMS doesn't lose anything.
// Not idempotent for trust_badges/order_steps/workshops (re-running duplicates
// them) — page_content rows are upserted, so those are safe to re-run.
//
// Usage: npm run migrate:site-content (from backend/scripts/)
// Requires .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.join(__dirname, "..", "..", "frontend", "src", "assets", "photos");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill them in.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function uploadPhoto(storagePath, fileName) {
  const filePath = path.join(photosDir, fileName);
  const buffer = readFileSync(filePath);
  const { error } = await supabase.storage
    .from("product-images")
    .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function upsertPageContent(pageKey, content) {
  const { error } = await supabase.from("page_content").upsert({ page_key: pageKey, content }, { onConflict: "page_key" });
  if (error) throw new Error(`page_content upsert failed for ${pageKey}: ${error.message}`);
  console.log(`✓ page_content: ${pageKey}`);
}

async function seedHome() {
  const heroImageUrl = await uploadPhoto("site/home/hero-eenhoorn-taart.jpg", "hero-eenhoorn-taart.jpg");
  await upsertPageContent("home", {
    heroImageUrl,
    heroEyebrow: "Taarten & tartelettes op bestelling — Gent",
    heroSubtext:
      "Handgemaakte taarten en gebakjes, gebakken op bestelling met verse ingrediënten en heel veel plezier.",
    introText:
      "Omdat ik vind dat je je leven het beste vult met dingen waar je blij van wordt ben ik begonnen met het bakken van taarten op bestelling. Mijn familie mag al een tijdje van mijn bakkunsten genieten, maar vanaf nu kan iedereen die dit wil mijn lekkernijen bestellen. Wil je graag een gepersonaliseerde taart? Heb je nog andere speciale wensen? Laat het dan maar weten! Geef je bestelling liefst een 3-tal dagen op voorhand door, wat mij de tijd geeft om de verse ingrediënten hiervoor in huis te halen. Ik stuur dan snel een bevestiging van je bestelling door en we spreken een afhaalmoment af. Als je vragen hebt over allergenen, laat het me zeker weten. De allergenen staan aangeduid met een icoontje onder elke taart. Heb je zin om zelf aan de slag te gaan? Dan ben je van harte welkom op de workshops die ik geef!",
  });
}

async function seedAbout() {
  const portraitImageUrl = await uploadPhoto("site/about/sophie-over-mij.jpg", "sophie-over-mij.jpg");
  await upsertPageContent("about", {
    bannerEyebrow: "Het verhaal achter de oven",
    portraitImageUrl,
    introText:
      "Bakken is voor mij een uit de hand gelopen hobby, waarin ik telkens mijn eigen grenzen probeer te verleggen.",
    trainingIntro:
      "In het begin leerde ik heel veel door tutorials die ik op internet vond, maar ondertussen volgde ik al heel wat opleidingen:",
    trainingList: [
      "Hulpkok, CVO Spermalie",
      "Taarten maken, Centrum voor avondonderwijs",
      "Chocoladebewerker, CVO Gent",
      "Vet- en kookdegen, CVO Gent",
    ],
    planningIntro: "Op mijn planning voor volgend jaar staat:",
    planningList: ["Taarten op basis van gistdeeg, CVO Gent"],
    bakeOffText:
      "Om het helemaal uitdagend te maken voor mezelf schreef ik me in voor Bake Off Vlaanderen (2022) en voor ik het goed en wel besefte stond ik in de baktent! De beste bakker van Vlaanderen mag ik mij helaas niet noemen, maar het meedoen op zich was voor mij een enorm leerproces en een bijzonder leuke ervaring!",
  });
}

async function seedBestellen() {
  await upsertPageContent("bestellen", {
    bannerEyebrow: "Zo werkt het",
    bannerTitle: "Een taart bestellen?",
    bannerIntro: "Van eerste berichtje tot afhaalmoment — hier lees je hoe een bestelling bij Tarterie Sophie verloopt.",
  });
}

async function seedContact() {
  await upsertPageContent("contact", {
    bannerEyebrow: "Kom langs of stuur een berichtje",
    bannerTitle: "Contact",
    addressStreet: "Sint-Pietersaalststraat 19",
    addressCity: "9000 Gent",
    phone: "0474 57 73 27",
    phoneHref: "+32474577327",
    email: "sophie.cardon@live.be",
    instagramUrl: "https://www.instagram.com/tarteriesophie/",
    facebookUrl: "https://www.facebook.com/tarteriesophie",
  });
}

async function seedWorkshopsBanner() {
  await upsertPageContent("workshops_banner", {
    bannerEyebrow: "Zelf de handen uit de mouwen steken",
    bannerTitle: "Workshops",
    bannerIntro: "Heb je zin om zelf aan de slag te gaan? Dan ben je van harte welkom op de workshops die ik geef!",
  });
}

async function seedTrustBadges() {
  const { error } = await supabase.from("trust_badges").insert([
    { label: "Bake Off Vlaanderen", detail: "Kandidate 2022", sort_order: 0 },
    { label: "Restaurant Guru", detail: "Recommended 2024", sort_order: 1 },
  ]);
  if (error) throw new Error(`trust_badges insert failed: ${error.message}`);
  console.log("✓ trust_badges");
}

async function seedOrderSteps() {
  const { error } = await supabase.from("order_steps").insert([
    {
      title: "Kies je taart",
      body: "Blader door de klassiekers of vraag een gepersonaliseerde themataart aan.",
      sort_order: 0,
    },
    {
      title: "Geef je bestelling door",
      body: "Liefst 3 dagen op voorhand, zodat ik de tijd heb om verse ingrediënten in huis te halen.",
      sort_order: 1,
    },
    {
      title: "Bevestiging & afhaalmoment",
      body: "Ik stuur snel een bevestiging door en we spreken samen een afhaalmoment af.",
      sort_order: 2,
    },
    {
      title: "Genieten!",
      body: "Je haalt je taart op in Gent en geniet ervan met wie je maar wil.",
      sort_order: 3,
    },
  ]);
  if (error) throw new Error(`order_steps insert failed: ${error.message}`);
  console.log("✓ order_steps");
}

async function seedWorkshop() {
  const imageUrl = await uploadPhoto("workshops/workshop-tartelettes.jpg", "workshop-tartelettes.jpg");
  const { error } = await supabase.from("workshops").insert({
    name: "Tartelettes",
    event_date: "2024-10-27",
    time_range: "van 14u tot 18u",
    location: "Turkooispad 31, 9000 Gent",
    price: 60,
    description: "In deze workshop maken we drie verschillende kleine gebakjes op basis van zanddeeg.",
    cta_text: "Je kan je plekje reserveren door me een berichtje te sturen",
    spots_note: "Nog 6 plaatsen beschikbaar",
    image_url: imageUrl,
    sort_order: 0,
  });
  if (error) throw new Error(`workshops insert failed: ${error.message}`);
  console.log("✓ workshops: Tartelettes");
}

async function main() {
  console.log("Seeding site content…");
  await seedHome();
  await seedAbout();
  await seedBestellen();
  await seedContact();
  await seedWorkshopsBanner();
  await seedTrustBadges();
  await seedOrderSteps();
  await seedWorkshop();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

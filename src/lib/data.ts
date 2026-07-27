import heroCake from "../assets/photos/hero-eenhoorn-taart.jpg";
import sophiePortrait from "../assets/photos/sophie-over-mij.jpg";
import workshopPhoto from "../assets/photos/workshop-tartelettes.jpg";

export const SITE = {
  name: "Tarterie Sophie",
  tagline: "Life is short, make it sweet.",
  email: "sophie.cardon@live.be",
  phone: "0474 57 73 27",
  phoneHref: "+32474577327",
  address: {
    street: "Sint-Pietersaalststraat 19",
    city: "9000 Gent",
    full: "Sint-Pietersaalststraat 19, 9000 Gent",
  },
  instagram: "https://www.instagram.com/tarteriesophie/",
  facebook: "https://www.facebook.com/tarteriesophie",
};

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Een taart bestellen?", to: "/bestellen" },
  { label: "Over mij", to: "/over-mij" },
  { label: "Workshops", to: "/workshops" },
  { label: "Contact", to: "/contact" },
];

export const HOME_INTRO = `Omdat ik vind dat je je leven het beste vult met dingen waar je blij van wordt ben ik begonnen met het bakken van taarten op bestelling. Mijn familie mag al een tijdje van mijn bakkunsten genieten, maar vanaf nu kan iedereen die dit wil mijn lekkernijen bestellen. Wil je graag een gepersonaliseerde taart? Heb je nog andere speciale wensen? Laat het dan maar weten! Geef je bestelling liefst een 3-tal dagen op voorhand door, wat mij de tijd geeft om de verse ingrediënten hiervoor in huis te halen. Ik stuur dan snel een bevestiging van je bestelling door en we spreken een afhaalmoment af. Als je vragen hebt over allergenen, laat het me zeker weten. De allergenen staan aangeduid met een icoontje onder elke taart. Heb je zin om zelf aan de slag te gaan? Dan ben je van harte welkom op de workshops die ik geef!`;

export const HERO_IMAGE = heroCake;

// Products (Classics, Klein gebak) and the Custom Cake offer now live in Supabase —
// see src/lib/supabase/products.ts and src/lib/supabase/customCake.ts, managed via /admin.

export const ORDER_STEPS = [
  {
    title: "Kies je taart",
    text: "Blader door de klassiekers of vraag een gepersonaliseerde themataart aan.",
  },
  {
    title: "Geef je bestelling door",
    text: "Liefst 3 dagen op voorhand, zodat ik de tijd heb om verse ingrediënten in huis te halen.",
  },
  {
    title: "Bevestiging & afhaalmoment",
    text: "Ik stuur snel een bevestiging door en we spreken samen een afhaalmoment af.",
  },
  {
    title: "Genieten!",
    text: "Je haalt je taart op in Gent en geniet ervan met wie je maar wil.",
  },
];

export const ABOUT_TEXT = {
  intro:
    "Bakken is voor mij een uit de hand gelopen hobby, waarin ik telkens mijn eigen grenzen probeer te verleggen.",
  training: [
    "In het begin leerde ik heel veel door tutorials die ik op internet vond, maar ondertussen volgde ik al heel wat opleidingen:",
  ],
  trainingList: [
    "Hulpkok, CVO Spermalie",
    "Taarten maken, Centrum voor avondonderwijs",
    "Chocoladebewerker, CVO Gent",
    "Vet- en kookdegen, CVO Gent",
  ],
  planningIntro: "Op mijn planning voor volgend jaar staat:",
  planningList: ["Taarten op basis van gistdeeg, CVO Gent"],
  bakeOff:
    "Om het helemaal uitdagend te maken voor mezelf schreef ik me in voor Bake Off Vlaanderen (2022) en voor ik het goed en wel besefte stond ik in de baktent! De beste bakker van Vlaanderen mag ik mij helaas niet noemen, maar het meedoen op zich was voor mij een enorm leerproces en een bijzonder leuke ervaring!",
  portrait: sophiePortrait,
};

export const WORKSHOP = {
  name: "Tartelettes",
  date: "zondag 27/10/2024",
  time: "van 14u tot 18u",
  location: "Turkooispad 31, 9000 Gent",
  price: "60",
  description:
    "In deze workshop maken we drie verschillende kleine gebakjes op basis van zanddeeg.",
  cta: "Je kan je plekje reserveren door me een berichtje te sturen",
  spotsNote: "Nog 6 plaatsen beschikbaar",
  image: workshopPhoto,
  imageAlt: "Negen kleine tartelettes met fruit en glazuur, afkoelend op een rooster",
};

export const TRUST_BADGES = [
  {
    id: "bakeoff",
    label: "Bake Off Vlaanderen",
    detail: "Kandidate 2022",
  },
  {
    id: "guru",
    label: "Restaurant Guru",
    detail: "Recommended 2024",
  },
];

export const ALLERGENS = [
  { id: "gluten", label: "Gluten" },
  { id: "ei", label: "Ei" },
  { id: "melk", label: "Melk" },
  { id: "noten", label: "Noten" },
  { id: "soja", label: "Soja" },
];

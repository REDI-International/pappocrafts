import { DEFAULT_LISTING_PHONE } from "./listing-phone";

export interface ServiceProvider {
  id: string;
  name: string;
  title: string;
  description: string;
  longDescription: string;
  category: string;
  hourlyRate: number;
  fixedRateFrom: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  location: string;
  country: string;
  /** Provider contact phone. */
  phone: string;
  image: string;
  badges: string[];
  available: boolean;
  responseTime: string;
  completedJobs: number;
  /** Short pitch (listing / modal). */
  summary?: string;
  yearsExperience?: string;
  languagesSpoken?: string;
  /** Cal.com, Calendly, or similar booking URL. */
  bookingCalendarUrl?: string;
  /** Optional seller details from admin profile. */
  sellerName?: string;
  sellerBiography?: string;
  sellerLogoUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseServiceRow(row: any): ServiceProvider {
  return {
    id: row.id,
    name: String(row.provider_name || row.name || "").trim() || "Provider",
    title: row.title || "",
    description: row.description || "",
    longDescription: row.long_description || "",
    category: row.category || "",
    hourlyRate: Number(row.hourly_rate) || 0,
    fixedRateFrom: row.fixed_rate_from != null ? Number(row.fixed_rate_from) : null,
    currency: row.currency || "EUR",
    rating: Number(row.rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    location: row.location || "",
    country: row.country || "",
    phone: typeof row.phone === "string" && row.phone.trim() ? row.phone.trim() : "",
    image: row.image || "",
    badges: Array.isArray(row.badges) ? row.badges : [],
    available: row.available !== false,
    responseTime: row.response_time || "",
    completedJobs: Number(row.completed_jobs) || 0,
    summary: row.summary || row.description || "",
    yearsExperience: row.years_experience || "",
    languagesSpoken: row.languages_spoken || "",
    bookingCalendarUrl: row.booking_calendar_url || "",
    sellerName:
      (typeof row.seller_name === "string" && row.seller_name.trim())
        ? row.seller_name.trim()
        : undefined,
    sellerBiography:
      (typeof row.seller_biography === "string" && row.seller_biography.trim())
        ? row.seller_biography.trim()
        : undefined,
    sellerLogoUrl:
      (typeof row.seller_logo_url === "string" && row.seller_logo_url.trim())
        ? row.seller_logo_url.trim()
        : undefined,
  };
}

export const serviceCategories = [
  { name: "All", icon: "🔍", description: "Browse all services" },
  { name: "Plumbing", icon: "🚿", description: "Pipes, leaks, bathrooms" },
  { name: "Electrical", icon: "⚡", description: "Wiring, panels, lighting" },
  { name: "Carpentry", icon: "🪚", description: "Woodwork, doors, shelves" },
  { name: "Painting", icon: "🎨", description: "Interior & exterior paint" },
  { name: "Interior Decoration", icon: "✨", description: "Styling, décor, finishes" },
  { name: "Handyman & General Maintenance", icon: "🛠️", description: "Small repairs & fixes" },
  { name: "Gardening & Landscaping", icon: "🌿", description: "Gardens, lawns, outdoor work" },
  { name: "Home Renovation", icon: "🏠", description: "Larger home projects" },
  { name: "Appliance Repair", icon: "🔌", description: "Washers, fridges, small appliances" },
  { name: "Home Repair", icon: "🔧", description: "General home fixes" },
  { name: "Pet Care", icon: "🐕", description: "Sitting, walking, grooming" },
  { name: "Cleaning", icon: "🧹", description: "House & deep cleaning" },
  { name: "Beauty & Wellness", icon: "💇", description: "Hair, massage, tailoring" },
  { name: "Delivery & Courier", icon: "📦", description: "Parcels, local delivery" },
  { name: "Photography & Videography", icon: "📷", description: "Events, portraits, video" },
  { name: "Fitness & Personal Training", icon: "💪", description: "Training, coaching" },
  { name: "Tutoring & Lessons", icon: "📚", description: "Languages, music, crafts" },
  { name: "Music", icon: "🎵", description: "Performers, arrangers, music production" },
  { name: "Transport & Moving", icon: "🚚", description: "Moving, driving" },
  { name: "IT & Digital", icon: "💻", description: "PC, web, phones" },
  { name: "Events & Catering", icon: "🎉", description: "Catering, music, planning" },
];

export const serviceCategoryNames = serviceCategories.map((c) => c.name);

export const serviceProviders: ServiceProvider[] = [
  {
    id: "dragan-plumber-belgrade",
    name: "Dragan P.",
    title: "Licensed Plumber",
    description: "Experienced plumber specializing in residential repairs, pipe installation, and bathroom renovations across Belgrade.",
    longDescription: "With over 15 years of experience, Dragan provides reliable plumbing services across greater Belgrade. He specializes in emergency repairs, pipe installation, bathroom renovations, boiler maintenance, and water heater installation. He arrives with all necessary tools and parts, and provides upfront pricing before starting any work. All repairs come with a 6-month warranty.",
    category: "Home Repair",
    hourlyRate: 25,
    fixedRateFrom: 30,
    currency: "EUR",
    rating: 4.9,
    reviewCount: 87,
    location: "Belgrade",
    country: "Serbia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop&crop=face",
    badges: ["Verified", "Top Rated"],
    available: true,
    responseTime: "Under 1 hour",
    completedJobs: 312,
  },
  {
    id: "fatima-dogsitter-pristina",
    name: "Fatima K.",
    title: "Professional Pet Sitter",
    description: "Loving pet care including dog walking, house sitting, and overnight boarding in a safe, pet-friendly home in Pristina.",
    longDescription: "Fatima has been caring for pets professionally for 5 years and treats every animal like family. She offers daily dog walking, in-home pet sitting, overnight boarding, and puppy socialization services. Her home has a fenced garden and she sends regular photo updates to owners. She is experienced with all breeds, including senior dogs requiring medication.",
    category: "Pet Care",
    hourlyRate: 10,
    fixedRateFrom: 15,
    currency: "EUR",
    rating: 5.0,
    reviewCount: 63,
    location: "Pristina",
    country: "Kosovo",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
    badges: ["featured", "Verified", "Top Rated"],
    available: true,
    responseTime: "Under 30 min",
    completedJobs: 198,
  },
  {
    id: "alen-electrician-sarajevo",
    name: "Alen M.",
    title: "Certified Electrician",
    description: "Certified electrician offering residential and commercial electrical work, wiring, panel upgrades, and lighting installation in Sarajevo.",
    longDescription: "Alen is a fully certified electrician with 12 years of experience in residential and light commercial electrical work. He handles everything from simple outlet installations to full rewiring, electrical panel upgrades, smart home setup, and lighting design. He is fully insured and provides detailed quotes before starting any job. Emergency callouts are available on weekends.",
    category: "Home Repair",
    hourlyRate: 30,
    fixedRateFrom: 40,
    currency: "EUR",
    rating: 4.8,
    reviewCount: 52,
    location: "Sarajevo",
    country: "Bosnia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop&crop=face",
    badges: ["Verified", "Certified"],
    available: true,
    responseTime: "Under 2 hours",
    completedJobs: 245,
  },
  {
    id: "mira-cleaning-tirana",
    name: "Mira B.",
    title: "Professional House Cleaner",
    description: "Thorough, reliable house cleaning and deep cleaning services in Tirana. Eco-friendly products available on request.",
    longDescription: "Mira runs a small cleaning team providing residential cleaning services across Tirana. She offers regular weekly/biweekly cleaning, deep cleaning, move-in/move-out cleaning, and post-renovation cleanup. Her team uses eco-friendly products by default and brings all supplies and equipment. Flexible scheduling with same-day availability for urgent requests.",
    category: "Cleaning",
    hourlyRate: 12,
    fixedRateFrom: 25,
    currency: "EUR",
    rating: 4.9,
    reviewCount: 94,
    location: "Tirana",
    country: "Albania",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=400&fit=crop",
    badges: ["Verified", "Eco-Friendly"],
    available: true,
    responseTime: "Under 1 hour",
    completedJobs: 410,
  },
  {
    id: "stefan-handyman-skopje",
    name: "Stefan N.",
    title: "General Handyman",
    description: "Jack-of-all-trades handyman for furniture assembly, shelving, painting, minor repairs, and home improvement in Skopje.",
    longDescription: "Stefan handles a wide range of home improvement tasks — from IKEA furniture assembly and shelf mounting to drywall patching, painting, door adjustments, and minor plumbing or electrical fixes. He brings his own tools and can usually complete most jobs in a single visit. Upfront pricing, no hidden fees, and a tidy workspace guaranteed.",
    category: "Home Repair",
    hourlyRate: 18,
    fixedRateFrom: 20,
    currency: "EUR",
    rating: 4.7,
    reviewCount: 41,
    location: "Skopje",
    country: "North Macedonia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=400&fit=crop&crop=face",
    badges: ["Verified"],
    available: true,
    responseTime: "Under 3 hours",
    completedJobs: 156,
  },
  {
    id: "elena-tutor-belgrade",
    name: "Elena R.",
    title: "Language & Music Tutor",
    description: "Native Serbian speaker offering language tutoring in Serbian, English, and beginner Romani, plus traditional guitar lessons.",
    longDescription: "Elena is a qualified language teacher offering one-on-one and small group lessons in Serbian (for foreigners), English, and beginner Romani. She also teaches traditional Balkans guitar and can incorporate music into language lessons for a fun, immersive experience. Lessons available in person (Belgrade area) or online via video call. All ages and levels welcome.",
    category: "Tutoring & Lessons",
    hourlyRate: 15,
    fixedRateFrom: null,
    currency: "EUR",
    rating: 5.0,
    reviewCount: 38,
    location: "Belgrade",
    country: "Serbia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    badges: ["Verified", "Top Rated"],
    available: true,
    responseTime: "Under 2 hours",
    completedJobs: 89,
  },
  {
    id: "besnik-moving-tirana",
    name: "Besnik L.",
    title: "Moving & Delivery Service",
    description: "Reliable moving and delivery service with a van for apartment moves, furniture delivery, and large item transport in Tirana.",
    longDescription: "Besnik and his team provide professional moving services across Tirana and beyond. Whether you need to move apartments, deliver purchased furniture, or transport large items, they handle it with care. The service includes loading, transport, and unloading. Packing materials and furniture disassembly/reassembly available as add-ons. Fair, transparent pricing based on distance and load size.",
    category: "Transport & Moving",
    hourlyRate: 20,
    fixedRateFrom: 35,
    currency: "EUR",
    rating: 4.6,
    reviewCount: 29,
    location: "Tirana",
    country: "Albania",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=400&fit=crop&crop=face",
    badges: ["Verified"],
    available: true,
    responseTime: "Under 3 hours",
    completedJobs: 178,
  },
  {
    id: "jovana-hairdresser-podgorica",
    name: "Jovana S.",
    title: "Mobile Hairdresser & Stylist",
    description: "Professional hairdresser offering cuts, coloring, and styling at your home or office in Podgorica. Bridal packages available.",
    longDescription: "Jovana brings the salon to you. With 8 years of experience, she offers haircuts, coloring, highlights, blowouts, and updos — all at the comfort of your home. She specializes in bridal and event styling and can accommodate groups. She brings all her own professional equipment and products. Consultations are free and she always discusses the look before starting.",
    category: "Beauty & Wellness",
    hourlyRate: 15,
    fixedRateFrom: 12,
    currency: "EUR",
    rating: 4.9,
    reviewCount: 56,
    location: "Podgorica",
    country: "Montenegro",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
    badges: ["Verified", "Top Rated"],
    available: true,
    responseTime: "Under 1 hour",
    completedJobs: 267,
  },
  {
    id: "marko-it-belgrade",
    name: "Marko V.",
    title: "Computer & Phone Repair",
    description: "Fast, affordable computer and smartphone repairs, virus removal, data recovery, and home network setup in Belgrade.",
    longDescription: "Marko is a skilled IT technician offering both on-site and workshop-based tech support. His services include laptop and desktop repair, smartphone screen and battery replacement, virus and malware removal, data recovery, Wi-Fi setup and troubleshooting, and basic website creation for small businesses. He provides free diagnostics and honest assessments — if it can not be fixed, you do not pay.",
    category: "IT & Digital",
    hourlyRate: 20,
    fixedRateFrom: 15,
    currency: "EUR",
    rating: 4.8,
    reviewCount: 44,
    location: "Belgrade",
    country: "Serbia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop",
    badges: ["Verified"],
    available: true,
    responseTime: "Under 2 hours",
    completedJobs: 203,
  },
  {
    id: "amina-catering-sarajevo",
    name: "Amina H.",
    title: "Traditional Balkans Catering",
    description: "Authentic home-cooked Balkans catering for events, parties, and corporate gatherings. Specializing in traditional Roma and Bosnian cuisine.",
    longDescription: "Amina provides catering services featuring traditional Bosnian and Roma cuisine. Her menu includes cevapi, burek, sarma, pita, baklava, and many more home-cooked specialties prepared with fresh, locally sourced ingredients. She caters events from intimate gatherings of 10 to large parties of 100+. Full service includes food preparation, delivery, setup, and cleanup. Custom menus and dietary accommodations available upon request.",
    category: "Events & Catering",
    hourlyRate: 0,
    fixedRateFrom: 80,
    currency: "EUR",
    rating: 5.0,
    reviewCount: 31,
    location: "Sarajevo",
    country: "Bosnia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
    badges: ["Verified", "Top Rated"],
    available: true,
    responseTime: "Under 3 hours",
    completedJobs: 95,
  },
  {
    id: "liridon-dogwalker-pristina",
    name: "Liridon G.",
    title: "Dog Walker & Pet Trainer",
    description: "Energetic dog walker and basic obedience trainer. Group and individual walks available daily in Pristina.",
    longDescription: "Liridon is passionate about dogs and offers daily walking services in the Pristina area. He takes small groups (max 3 dogs) for supervised walks in parks and green areas. He also provides basic obedience training — sit, stay, recall, leash manners — using positive reinforcement only. Flexible scheduling with morning and afternoon slots. GPS tracking updates sent to owners during walks.",
    category: "Pet Care",
    hourlyRate: 8,
    fixedRateFrom: 10,
    currency: "EUR",
    rating: 4.7,
    reviewCount: 22,
    location: "Pristina",
    country: "Kosovo",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop",
    badges: ["Verified"],
    available: true,
    responseTime: "Under 1 hour",
    completedJobs: 134,
  },
  {
    id: "ana-tailor-skopje",
    name: "Ana T.",
    title: "Seamstress & Tailor",
    description: "Skilled seamstress offering clothing alterations, custom dress making, and traditional Balkans costume repair in Skopje.",
    longDescription: "Ana has been sewing for over 20 years, trained by her grandmother in traditional Roma textile techniques. She offers clothing alterations (hemming, taking in/out, zipper replacement), custom dress making from your own fabric or hers, and repair/restoration of traditional Balkans folk costumes. She can work from her home studio or travel to your location for fittings.",
    category: "Beauty & Wellness",
    hourlyRate: 12,
    fixedRateFrom: 8,
    currency: "EUR",
    rating: 4.9,
    reviewCount: 47,
    location: "Skopje",
    country: "North Macedonia",
    phone: DEFAULT_LISTING_PHONE,
    image: "https://images.unsplash.com/photo-1556740758-90de940a6755?w=400&h=400&fit=crop",
    badges: ["Verified", "Top Rated"],
    available: true,
    responseTime: "Under 2 hours",
    completedJobs: 189,
  },
];

export function getServiceProvider(id: string): ServiceProvider | undefined {
  return serviceProviders.find((p) => p.id === id);
}

export function getProvidersByCategory(category: string): ServiceProvider[] {
  if (category === "All") return serviceProviders;
  return serviceProviders.filter((p) => p.category === category);
}

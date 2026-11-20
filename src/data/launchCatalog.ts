import type { Category, Product, Service, SiteSettings } from '../types';

const assetUrl = (url: string): string => `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`;

export const ENERGY_BOOST_IMAGE =
  assetUrl('/assets/aistudio/WhatsApp_Image_2026-11-18_at_8.12.13_PM_f8e9a69a.jpeg');
export const SUNDEX_D_IMAGE =
  assetUrl('/assets/aistudio/WhatsApp_Image_2026-11-20_at_9.18.00_AM_ccfe932b.jpeg');

export const LAUNCH_CATEGORIES: Category[] = [
  {
    id: 'daily-wellness',
    slug: 'daily-wellness',
    name: 'Daily Wellness',
    description: 'Foundational everyday nutritional support formulations.',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'multivitamins',
    slug: 'multivitamins',
    name: 'Multivitamins',
    description: 'Comprehensive multivitamin and mineral blends for daily vitality.',
    active: true,
    sortOrder: 2,
  },
  {
    id: 'vitamin-support',
    slug: 'vitamin-support',
    name: 'Vitamin Support',
    description: 'Targeted single-nutrient vitamin formulations.',
    active: true,
    sortOrder: 3,
  },
];

export const LAUNCH_PRODUCTS: Product[] = [
  {
    id: 'brainaxis-energy-boost',
    slug: 'brainaxis-energy-boost',
    name: 'BrainAxis Energy Boost',
    subtitle: 'Premium Multivitamin & Mineral Formula',
    brand: 'BrainAxis',
    founderMention: 'Dr. Ali',
    categoryIds: ['daily-wellness', 'multivitamins'],
    shortDescription:
      'Complete daily nutritional support formulated to boost energy and stamina, support focus and memory, and strengthen daily immunity.',
    overview:
      'BrainAxis Energy Boost is a once-daily multivitamin and mineral dietary supplement developed under the BrainAxis line by Dr. Ali Hassan Health & Wellness. Designed for adults seeking dependable everyday nutritional support across energy metabolism, cognitive focus, immune defense, bone maintenance, and cardiovascular wellness.',
    format: 'Tablets',
    packSize: '30 Tablets',
    strength: 'Complete Daily Formula',
    usageSummary: 'Once daily · 30 Tablets',
    pricePkr: 1490,
    compareAtPricePkr: 0,
    stock: 100,
    sku: 'BA-EB-30T',
    imageUrl: ENERGY_BOOST_IMAGE,
    galleryUrls: [ENERGY_BOOST_IMAGE],
    benefits: [
      'Boosts Energy & Stamina',
      'Supports Focus & Memory',
      'Strengthens Immunity',
      'Maintains Bone Health',
      'Supports Heart Health',
    ],
    ingredientsSummary:
      'Balanced daily multivitamin and essential mineral formulation. Full composition panel can be updated and verified by the administrator.',
    supplementFacts: [
      { nutrient: 'Serving Size', amount: '1 Tablet Daily' },
      { nutrient: 'Servings Per Bottle', amount: '30 Tablets' },
      { nutrient: 'Formula Type', amount: 'Multivitamin & Mineral Complex' },
    ],
    otherIngredients: 'Permitted tablet excipients. Consult label on physical bottle for full excipient listing.',
    directions:
      'Take one (1) tablet once daily with water, preferably after a meal, or as directed by your healthcare professional.',
    warnings:
      'Do not exceed the recommended daily serving. Dietary supplement for adult nutritional support. Consult a qualified healthcare provider if pregnant, nursing, taking medication, or managing a medical condition. Keep out of reach of children.',
    storageInstructions:
      'Store in a cool, dry place below 30°C. Keep bottle tightly closed and protect from direct sunlight and moisture.',
    allergens: 'Check product bottle label before use if you have known sensitivities.',
    interactions:
      'If you take prescription medications or other multivitamins, consult a healthcare professional prior to use.',
    manufacturer: 'BrainAxis (Dr. Ali Hassan Health & Wellness)',
    countryOfOrigin: 'Pakistan',
    batchNo: 'Editable in Admin',
    mfgDate: 'Editable in Admin',
    expDate: 'Editable in Admin',
    enlistmentNo: 'Editable in Admin',
    form7No: '',
    certifications: [],
    faqs: [
      {
        question: 'How should I take BrainAxis Energy Boost?',
        answer: 'Take 1 tablet once daily with a glass of water, preferably with a meal, unless otherwise advised by your physician.',
      },
      {
        question: 'How many tablets are in one bottle?',
        answer: 'Each bottle contains 30 tablets, providing a 30-day supply at one tablet per day.',
      },
    ],
    variants: [
      {
        id: 'eb-30-tablets',
        label: '30 Tablets (1 Month Supply)',
        sku: 'BA-EB-30T',
        pricePkr: 1490,
        stock: 100,
      },
    ],
    featured: true,
    published: true,
    complianceStatus: 'approved',
    sortOrder: 1,
  },
  {
    id: 'brainaxis-sundex-d',
    slug: 'brainaxis-sundex-d',
    name: 'BrainAxis SUNDEX-D® Vitamin D3 (Cholecalciferol) 200,000 IU',
    subtitle: 'High-Potency Vitamin D3 Softgel Capsule',
    brand: 'BrainAxis',
    founderMention: 'Dr. Ali',
    categoryIds: ['vitamin-support', 'daily-wellness'],
    shortDescription:
      'High-potency Vitamin D3 (Cholecalciferol) 200,000 IU softgel capsule formulated to help restore Vitamin D levels and support bone, joint, muscle, and immune health.',
    overview:
      'BrainAxis SUNDEX-D® provides 200,000 IU of Vitamin D3 (Cholecalciferol) in a softgel capsule presentation. Formulated to support Vitamin D restoration alongside bone, teeth, joint, muscle, and immune health under the guidance of a registered healthcare professional.',
    format: 'Softgel Capsule',
    packSize: '1 Softgel',
    strength: '200,000 IU',
    usageSummary: '1 Softgel (200,000 IU) · Use as advised by physician',
    pricePkr: 799,
    compareAtPricePkr: 0,
    stock: 100,
    sku: 'BA-SD-200K-1S',
    imageUrl: SUNDEX_D_IMAGE,
    galleryUrls: [SUNDEX_D_IMAGE],
    benefits: [
      'Helps Restore Vitamin D Levels',
      'Supports Bone & Joint Health',
      'Enhances Immune Function',
      'Supports Muscle Strength',
      'Strengthens Bones & Teeth',
    ],
    ingredientsSummary:
      'Each softgel capsule contains Vitamin D3 (Cholecalciferol) 200,000 IU.',
    supplementFacts: [
      { nutrient: 'Vitamin D3 (Cholecalciferol)', amount: '200,000 IU' },
    ],
    otherIngredients:
      'Softgel capsule (Gelatin, Glycerin, Purified Water) and permitted excipients.',
    directions:
      'As directed by your healthcare provider. Typically, 1 softgel (200,000 IU) as a single dose or as advised by the physician. Take with a meal (preferably containing fat) for better absorption.',
    warnings:
      'CAUTION: High-dose Vitamin D3. Use only on the advice of a registered healthcare professional. Do not self-administer repeated high doses without medical guidance and monitoring.',
    storageInstructions:
      'Store below 30°C in a dry place. Protect from heat, sunlight & moisture. Keep out of reach of children.',
    allergens: 'Contains gelatin in softgel shell.',
    interactions:
      'Consult a registered healthcare professional before use if you have hypercalcemia, kidney disorders, or take thiazide diuretics or cardiac glycosides.',
    manufacturer: 'Bio Serve Pharma — H-165, S.I.T.E, Super Highway, Phase-II, Karachi - Pakistan',
    countryOfOrigin: 'Pakistan',
    batchNo: 'SND/001',
    mfgDate: '11-2026',
    expDate: '10-2028',
    enlistmentNo: '00466',
    form7No: '0464940283',
    certifications: ['GMP Certified', 'ISO', 'DRAP Registered'],
    faqs: [
      {
        question: 'How should SUNDEX-D 200,000 IU be taken?',
        answer:
          'Take 1 softgel as a single dose or strictly as advised by your physician. Taking it with a meal containing healthy fats supports optimal absorption.',
      },
      {
        question: 'Who should advise on high-dose Vitamin D3?',
        answer:
          'Because SUNDEX-D delivers 200,000 IU high-potency Vitamin D3, it should be used only on the advice of a registered healthcare professional.',
      },
    ],
    variants: [
      {
        id: 'sundex-1-softgel',
        label: '1 Softgel (200,000 IU)',
        sku: 'BA-SD-200K-1S',
        pricePkr: 799,
        stock: 100,
      },
    ],
    featured: true,
    published: true,
    complianceStatus: 'approved',
    sortOrder: 2,
  },
];

export const LAUNCH_SITE_SETTINGS: SiteSettings = {
  id: 'main',
  businessName: 'Dr. Ali Hassan Health & Wellness',
  supplementBrandName: 'BrainAxis',
  tagline: 'Thoughtful wellness, supported by knowledge and care.',
  announcementEnabled: true,
  announcementText:
    'Nationwide Delivery Across Pakistan · Cash on Delivery Available · Verified BrainAxis Supplements',
  heroHeadline: 'Smarter Wellness Starts Here',
  heroSubheadline:
    'Discover premium wellness supplements by BrainAxis under Dr. Ali Hassan Health & Wellness — transparent composition, verified packaging, and nationwide delivery.',
  bannerIntervalSec: 5,
  banners: [
    {
      id: 'sundex-d-podium',
      imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_a7r5pra7r5pra7r5__2__b6276b6b.jpg'),
      alt: 'BrainAxis SUNDEX-D Vitamin D3 200,000 IU softgel capsule showcase banner',
      to: '/product/brainaxis-sundex-d',
    },
    {
      id: 'sundex-d-lifestyle',
      imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_a7r5pra7r5pra7r5__1__8f069b03.jpg'),
      alt: 'BrainAxis SUNDEX-D Stronger Bones & Immunity Vitamin D3 200,000 IU banner',
      to: '/product/brainaxis-sundex-d',
    },
    {
      id: 'energy-boost-lifestyle',
      imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_p04fcqp04fcqp04f_05bd9bbc.jpg'),
      alt: 'BrainAxis Energy Boost Complete Daily Nutrition 30 Tablets banner',
      to: '/product/brainaxis-energy-boost',
    },
    {
      id: 'energy-boost-podium',
      imageUrl: assetUrl('/assets/aistudio/Gemini_Generated_Image_h6gfxgh6gfxgh6gf_69a909aa.jpg'),
      alt: 'BrainAxis Energy Boost Premium Multivitamin & Mineral Formula showcase banner',
      to: '/product/brainaxis-energy-boost',
    },
  ],
  founderName: 'Dr. Ali Hassan',
  founderTitle: 'Founder — Dr. Ali Hassan Health & Wellness & BrainAxis',
  founderPhotoUrl: '',
  founderBio:
    'Dr. Ali Hassan Health & Wellness was founded to bring straightforward, transparently labeled nutritional supplements to households across Pakistan under the BrainAxis formulation line. Every launch product is presented with clear directions, full safety cautions, and direct customer support.',
  founderMission:
    'To provide trustworthy, honestly labeled everyday wellness formulations backed by transparent product information and responsible guidance.',
  whatsappNumber: '923000000000',
  whatsappGreeting:
    'Hello Dr. Ali Hassan Health & Wellness team, I have a question about BrainAxis supplements.',
  supportEmail: 'support@dralihassanwellness.pk',
  supportHours: 'Monday – Saturday, 9:00 AM – 7:00 PM PKT',
  shippingFeePkr: 200,
  freeShippingThresholdPkr: 2000,
  codEnabled: true,
  onlinePaymentsEnabled: false,
  faqs: [
    {
      question: 'How do I place an order?',
      answer:
        'Add BrainAxis Energy Boost or SUNDEX-D to your cart, proceed to Checkout, enter your Pakistani delivery address, and choose Cash on Delivery or WhatsApp order confirmation.',
    },
    {
      question: 'How long does nationwide delivery take in Pakistan?',
      answer:
        'Orders placed before 2:00 PM PKT are typically dispatched within 1–2 business days and delivered within 2–5 working days depending on your city.',
    },
    {
      question: 'What payment options are currently supported?',
      answer:
        'Cash on Delivery (COD) and direct WhatsApp order support are active at launch. Online card, JazzCash, and Easypaisa checkout will be activated once merchant verification is completed.',
    },
    {
      question: 'Can I take Energy Boost and SUNDEX-D together?',
      answer:
        'SUNDEX-D is a high-potency 200,000 IU Vitamin D3 formulation and should only be used on the advice of a registered healthcare professional. Please consult your doctor before combining supplements.',
    },
    {
      question: 'How can I track my order or contact support?',
      answer:
        'Use the Track Order page with your Order Number and checkout email or phone number, or message our support team directly on WhatsApp.',
    },
  ],
  policies: {
    privacyPolicy:
      'Dr. Ali Hassan Health & Wellness collects only the contact and shipping details needed to fulfill your supplement orders and customer inquiries. Customer order records are isolated and protected; we never sell or rent personal information to third parties. Update this policy text anytime in the Admin Dashboard.',
    termsAndConditions:
      'All BrainAxis dietary supplements offered on this website are intended for general nutritional support and are not medicines intended to diagnose, treat, cure, or prevent any disease. High-potency formulations such as SUNDEX-D (200,000 IU) must be used only on the advice of a registered healthcare professional.',
    shippingPolicy:
      'We deliver nationwide across Pakistan. Standard shipping charges and free-shipping thresholds are clearly shown in your cart and at checkout prior to confirming your order. Dispatch timelines may vary during public holidays.',
    refundPolicy:
      'Unopened, sealed supplement packs with intact tamper-evident packaging may be eligible for return or replacement within 7 days of delivery if damaged in transit or incorrect. Opened consumables cannot be returned for safety reasons. Contact support with your order number to initiate a review.',
    supplementDisclaimer:
      'Dietary supplements should not substitute for a varied diet or professional medical care. Always read product labels, directions, and caution statements before use.',
  },
  socialLinks: {
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: 'https://www.linkedin.com/in/dr-muhammad-ali-hassan-5174b7287/',
  },
  seoTitle: 'Dr. Ali Hassan Health & Wellness — BrainAxis Supplements',
  seoDescription:
    'Shop BrainAxis Energy Boost and BrainAxis SUNDEX-D Vitamin D3 200,000 IU with Cash on Delivery across Pakistan.',
};

export const LAUNCH_SERVICES: Service[] = [
  {
    id: 'nutrition-consultation',
    title: 'Nutrition Consultation',
    description:
      'One-on-one dietary and everyday nutritional guidance tailored to your lifestyle goals. Scheduling opens once provider hours are finalized.',
    providerName: 'Qualified Provider (To Be Assigned)',
    providerQualifications: 'Verified credentials published upon activation',
    durationMinutes: 30,
    feePkr: 0,
    visible: true,
    bookingEnabled: false,
    sortOrder: 1,
  },
  {
    id: 'supplement-guidance',
    title: 'Supplement Information Guidance',
    description:
      'Ask structured questions about listed BrainAxis ingredients, dosage instructions, storage, and when to consult your personal physician.',
    providerName: 'Wellness Support Desk',
    providerQualifications: 'Product information & label guidance',
    durationMinutes: 20,
    feePkr: 0,
    visible: true,
    bookingEnabled: false,
    sortOrder: 2,
  },
  {
    id: 'wellness-consultation',
    title: 'General Wellness Consultation',
    description:
      'Holistic lifestyle, hydration, sleep hygiene, and daily routine check-ins. Currently preparing for upcoming launch.',
    providerName: 'Clinical Wellness Team',
    providerQualifications: 'Available upon admin activation',
    durationMinutes: 30,
    feePkr: 0,
    visible: true,
    bookingEnabled: false,
    sortOrder: 3,
  },
];

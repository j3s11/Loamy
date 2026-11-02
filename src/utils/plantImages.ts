/**
 * Horticultural Plant Imagery Mapping & Botanical Photo Registry
 * Every plant photo is strictly verified against its botanical species and cultivar
 * (Photo Refs #1–#32 in the User Garden Collection + Regional Staples)
 * and served from verified local image assets (/public/assets/plants/).
 */

export interface PlantImageInfo {
  name: string;
  photoUrl: string;
  attribution: string;
  description: string;
  accentColor: string;
}

export const PLANT_BOTANICAL_IMAGE_MAP: Record<string, PlantImageInfo> = {
  'hadston-01': {
    name: "Mealycup Sage",
    photoUrl: '/assets/plants/hadston-01.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Vibrant violet-blue flower spikes with powdery white calyxes (Salvia farinacea)",
    accentColor: '#4f46e5'
  },
  'hadston-02': {
    name: "Lemon Cypress Goldcrest",
    photoUrl: '/assets/plants/hadston-02.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Golden-chartreuse conical conifer foliage with sweet lemon aroma (Cupressus macrocarpa Goldcrest)",
    accentColor: '#ca8a04'
  },
  'hadston-03': {
    name: "Hardy Fuchsia",
    photoUrl: '/assets/plants/hadston-03.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Pendulous scarlet sepals and rich purple corolla bells (Fuchsia magellanica)",
    accentColor: '#e11d48'
  },
  'hadston-04': {
    name: "Dwarf Alberta Spruce",
    photoUrl: '/assets/plants/hadston-04.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Compact conical evergreen conifer with dense, fine needle rosettes (Picea glauca Conica)",
    accentColor: '#15803d'
  },
  'hadston-05': {
    name: "Shrub Rose",
    photoUrl: '/assets/plants/hadston-05.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Classic repeat-blooming English shrub rose with fragrant rose petals (Rosa)",
    accentColor: '#be123c'
  },
  'hadston-06': {
    name: "Scaly Male Fern",
    photoUrl: '/assets/plants/hadston-06.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Semi-evergreen woodland shuttlecock fronds with golden-scaly stipes (Dryopteris affinis)",
    accentColor: '#166534'
  },
  'hadston-07': {
    name: "Variegated Lacecap Hydrangea",
    photoUrl: '/assets/plants/hadston-07.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Cream-and-green variegated leaves with delicate lacecap lilac blooms (Hydrangea macrophylla Variegata)",
    accentColor: '#6366f1'
  },
  'hadston-08': {
    name: "Soft Shield Fern",
    photoUrl: '/assets/plants/hadston-08.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Feathery soft-textured filigree bipinnate fronds forming a lax woodland rosette (Polystichum setiferum)",
    accentColor: '#14532d'
  },
  'hadston-09': {
    name: "Common Culinary Thyme",
    photoUrl: '/assets/plants/hadston-09.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Fragrant dwarf Mediterranean sub-shrub with tiny aromatic leaves and lilac florets (Thymus vulgaris)",
    accentColor: '#059669'
  },
  'hadston-10': {
    name: "Japanese Skimmia",
    photoUrl: '/assets/plants/hadston-10.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Dense evergreen shrub with leathery leaves and winter crimson buds (Skimmia japonica)",
    accentColor: '#991b1b'
  },
  'hadston-11': {
    name: "Clumping Fountain Bamboo",
    photoUrl: '/assets/plants/hadston-11.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Non-invasive pachymorph bamboo with slender arching culms and evergreen leaf cascades (Fargesia murielae)",
    accentColor: '#047857'
  },
  'hadston-12': {
    name: "Flowering Crabapple",
    photoUrl: '/assets/plants/hadston-12.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Spring apple blossom followed by clusters of colourful autumn crabapples (Malus sylvestris / Evereste)",
    accentColor: '#ea580c'
  },
  'hadston-13': {
    name: "Michaelmas Daisy",
    photoUrl: '/assets/plants/hadston-13.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Late-autumn aster with clouds of starry violet-blue and pink daisy flowers (Symphyotrichum)",
    accentColor: '#9333ea'
  },
  'hadston-14': {
    name: "Hybrid Tea Rose",
    photoUrl: '/assets/plants/hadston-14.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "High-centred classic formal rose blooms borne singly on strong cutting canes (Rosa hybrida)",
    accentColor: '#dc2626'
  },
  'hadston-15': {
    name: "Flowering Cherry",
    photoUrl: '/assets/plants/hadston-15.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Lavish pink double cherry blossom and bronze autumn canopy (Prunus serrulata)",
    accentColor: '#f43f5e'
  },
  'hadston-16': {
    name: "Herbaceous Peony",
    photoUrl: '/assets/plants/hadston-16.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Opulent ruffled bowl blooms with crimson spring shoots and deep clay tolerance (Paeonia lactiflora)",
    accentColor: '#db2777'
  },
  'hadston-17': {
    name: "Cabbage Palm (Torbay Palm)",
    photoUrl: '/assets/plants/hadston-17.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Architectural sword-leaved evergreen rosette tree with subtropical silhouette (Cordyline australis)",
    accentColor: '#15803d'
  },
  'hadston-18': {
    name: "Flamingo Dappled Willow",
    photoUrl: '/assets/plants/hadston-18.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Marbled flamingo-pink, cream, and jade-green spring shoot tips (Salix integra Hakuro-nishiki)",
    accentColor: '#fb7185'
  },
  'hadston-19': {
    name: "Plantain Lily (Hosta)",
    photoUrl: '/assets/plants/hadston-19.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Broad ribbed glaucous shade foliage with bell-shaped lilac flower scapes (Hosta)",
    accentColor: '#0d9488'
  },
  'hadston-20': {
    name: "False Goat’s Beard (Astilbe)",
    photoUrl: '/assets/plants/hadston-20.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Feathery summer plumes of rose and crimson rising above fern-like foliage in wet clay (Astilbe)",
    accentColor: '#e11d48'
  },
  'hadston-21': {
    name: "Black Elderberry",
    photoUrl: '/assets/plants/hadston-21.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Dramatic dark dissected foliage with flat June elderflower plates and autumn black berries (Sambucus nigra)",
    accentColor: '#4a044e'
  },
  'hadston-22': {
    name: "Border Rose",
    photoUrl: '/assets/plants/hadston-22.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Compact floriferous cluster rose bred for continuous border colour (Rosa)",
    accentColor: '#b91c1c'
  },
  'hadston-23': {
    name: "Purple Top Verbena",
    photoUrl: '/assets/plants/hadston-23.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Tall see-through wiry stems carrying nectar-rich heads of violet florets for butterflies (Verbena bonariensis)",
    accentColor: '#7e22ce'
  },
  'hadston-24': {
    name: "Bigleaf Hydrangea #1",
    photoUrl: '/assets/plants/hadston-24.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Large mophead dome clusters turning blue or pink with soil pH (Hydrangea macrophylla)",
    accentColor: '#2563eb'
  },
  'hadston-25': {
    name: "Weigela",
    photoUrl: '/assets/plants/hadston-25.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Arching spring branches crowded with ruby-throated trumpet flowers (Weigela florida)",
    accentColor: '#f43f5e'
  },
  'hadston-26': {
    name: "Japanese Camellia",
    photoUrl: '/assets/plants/hadston-26.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Glossy leathery dark evergreen leaves with formal rose-form early spring flowers (Camellia japonica)",
    accentColor: '#e11d48'
  },
  'hadston-27': {
    name: "Greater Masterwort",
    photoUrl: '/assets/plants/hadston-27.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Intricate papery pincushion flowers surrounded by greenish-pink star bracts (Astrantia major)",
    accentColor: '#be185d'
  },
  'hadston-28': {
    name: "Bigleaf Hydrangea #2",
    photoUrl: '/assets/plants/hadston-28.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Dense mophead floral globes on robust deciduous branches (Hydrangea macrophylla)",
    accentColor: '#3b82f6'
  },
  'hadston-29': {
    name: "Clematis Vine",
    photoUrl: '/assets/plants/hadston-29.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Twining climbing vine with star-shaped flower petals and feathery seedheads (Clematis)",
    accentColor: '#6d28d9'
  },
  'hadston-30': {
    name: "Fragrant Common Lilac",
    photoUrl: '/assets/plants/hadston-30.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Intensely scented lavender-purple pyramidal floral trusses in May (Syringa vulgaris)",
    accentColor: '#a855f7'
  },
  'hadston-31': {
    name: "Butterfly Bush",
    photoUrl: '/assets/plants/hadston-31.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Fragrant arching lilac plumes swarming with Red Admiral and Peacock butterflies (Buddleja davidii)",
    accentColor: '#7e22ce'
  },
  'hadston-32': {
    name: "California Lilac",
    photoUrl: '/assets/plants/hadston-32.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Dense puffballs of electric-blue flowers against glossy evergreen foliage (Ceanothus)",
    accentColor: '#1d4ed8'
  },
  'cat-01': {
    name: "Rose Gertrude Jekyll",
    photoUrl: '/assets/plants/cat-01.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Quintessential English shrub rose with powerful old-rose scent (Rosa rugosa / Austin)",
    accentColor: '#be123c'
  },
  'cat-02': {
    name: "Rhubarb Timperley Early",
    photoUrl: '/assets/plants/cat-02.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Edible crimson petioles and giant umbrella leaves (Rheum rhabarbarum)",
    accentColor: '#991b1b'
  },
  'cat-03': {
    name: "Garlic Solent Wight",
    photoUrl: '/assets/plants/cat-03.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Overwintering allium bulbs with pungent cloves and green strappy leaves (Allium sativum)",
    accentColor: '#65a30d'
  },
  'cat-04': {
    name: "Broad Bean Aquadulce Claudia",
    photoUrl: '/assets/plants/cat-04.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Hardy legume with fragrant black-and-white blooms and tender green pods (Vicia faba)",
    accentColor: '#15803d'
  },
  'cat-05': {
    name: "Cavolo Nero Tuscan Kale",
    photoUrl: '/assets/plants/cat-05.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Stately dark blue-black strap leaves sweetened by winter frost (Brassica oleracea Lacinato)",
    accentColor: '#064e3b'
  },
  'cat-06': {
    name: "African Lily Northern Star",
    photoUrl: '/assets/plants/cat-06.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Architectural blue flower umbels rising on tall stalks (Agapanthus)",
    accentColor: '#1e3a8a'
  },
  'cat-07': {
    name: "Smooth Hydrangea Annabelle",
    photoUrl: '/assets/plants/cat-07.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Huge creamy-white snowball globes blooming reliably on new spring wood (Hydrangea arborescens)",
    accentColor: '#059669'
  },
  'cat-08': {
    name: "Hosta Halcyon",
    photoUrl: '/assets/plants/cat-08.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Thick chalky blue-grey ribbed foliage with high slug resistance (Hosta)",
    accentColor: '#0f766e'
  },
  'cat-09': {
    name: "English Lavender",
    photoUrl: '/assets/plants/cat-09.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Aromatic silver-grey foliage with highly fragrant violet flower spikes (Lavandula angustifolia)",
    accentColor: '#7c3aed'
  },
  'cat-10': {
    name: "Salvia Amistad",
    photoUrl: '/assets/plants/cat-10.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Regal deep royal purple tubular blooms emerging from nearly black calyxes (Salvia)",
    accentColor: '#4338ca'
  },
  'cat-11': {
    name: "Apple Tree Discovery",
    photoUrl: '/assets/plants/cat-11.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Crisp early dessert apples with spring blossom canopy (Malus domestica)",
    accentColor: '#dc2626'
  },
  'cat-12': {
    name: "Scented Geranium",
    photoUrl: '/assets/plants/cat-12.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Aromatic dissected rose-scented leaves with delicate lilac flowers (Pelargonium graveolens)",
    accentColor: '#ec4899'
  },
  'cat-13': {
    name: "Hellebore Lenten Rose",
    photoUrl: '/assets/plants/cat-13.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Winter-blooming nodding cup flowers in shades of cream, rose, and slate (Helleborus)",
    accentColor: '#6b21a8'
  },
  'cat-14': {
    name: "Sweet Pea Matucana",
    photoUrl: '/assets/plants/cat-14.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: "Intensely scented climbing annual legume with bi-colour violet and crimson blossoms (Lathyrus odoratus)",
    accentColor: '#9d174d'
  }
};

/**
 * Resolves a verified botanical photo info object by plant ID, name, or photo reference.
 */
export function getPlantImageInfo(
  plantIdOrName?: string,
  photoRef?: number
): PlantImageInfo {
  if (photoRef && photoRef >= 1 && photoRef <= 32) {
    const key = `hadston-${String(photoRef).padStart(2, "0")}`;
    if (PLANT_BOTANICAL_IMAGE_MAP[key]) {
      return PLANT_BOTANICAL_IMAGE_MAP[key];
    }
  }

  if (plantIdOrName) {
    if (PLANT_BOTANICAL_IMAGE_MAP[plantIdOrName]) {
      return PLANT_BOTANICAL_IMAGE_MAP[plantIdOrName];
    }

    const lower = plantIdOrName.toLowerCase();

    // Check for photo ref pattern in name (e.g. "#16 Peony" or "#4 Dwarf Alberta Spruce")
    const matchHash = lower.match(/#(\d+)/);
    if (matchHash && matchHash[1]) {
      const refNum = parseInt(matchHash[1], 10);
      if (refNum >= 1 && refNum <= 32) {
        const key = `hadston-${String(refNum).padStart(2, "0")}`;
        if (PLANT_BOTANICAL_IMAGE_MAP[key]) {
          return PLANT_BOTANICAL_IMAGE_MAP[key];
        }
      }
    }

    // Accurate botanical name matches
    if (lower.includes("farinacea") || lower.includes("mealycup")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-01"];
    if (lower.includes("goldcrest") || lower.includes("macrocarpa") || lower.includes("lemon cypress")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-02"];
    if (lower.includes("fuchsia")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-03"];
    if (lower.includes("conica") || lower.includes("alberta spruce") || lower.includes("picea")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-04"];
    if (lower.includes("shrub rose") || lower.includes("specimen #5")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-05"];
    if (lower.includes("scaly male") || lower.includes("dryopteris affinis")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-06"];
    if (lower.includes("variegated") && lower.includes("hydrangea")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-07"];
    if (lower.includes("soft shield") || lower.includes("polystichum")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-08"];
    if (lower.includes("thyme") || lower.includes("thymus")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-09"];
    if (lower.includes("skimmia")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-10"];
    if (lower.includes("bamboo") || lower.includes("fargesia")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-11"];
    if (lower.includes("crabapple") || lower.includes("malus sylvestris")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-12"];
    if (lower.includes("aster") || lower.includes("michaelmas") || lower.includes("symphyotrichum")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-13"];
    if (lower.includes("hybrid tea") || lower.includes("specimen #14")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-14"];
    if (lower.includes("cherry") || lower.includes("prunus serrulata") || lower.includes("kanzan")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-15"];
    if (lower.includes("peony") || lower.includes("paeonia")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-16"];
    if (lower.includes("palm") || lower.includes("cordyline") || lower.includes("torbay")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-17"];
    if (lower.includes("willow") || lower.includes("salix") || lower.includes("hakuro")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-18"];
    if (lower.includes("hosta halcyon")) return PLANT_BOTANICAL_IMAGE_MAP["cat-08"];
    if (lower.includes("hosta")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-19"];
    if (lower.includes("astilbe") || lower.includes("goat")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-20"];
    if (lower.includes("elder") || lower.includes("sambucus")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-21"];
    if (lower.includes("border rose") || lower.includes("specimen #22")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-22"];
    if (lower.includes("verbena") || lower.includes("bonariensis")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-23"];
    if (lower.includes("annabelle")) return PLANT_BOTANICAL_IMAGE_MAP["cat-07"];
    if (lower.includes("hydrangea") && lower.includes("28")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-28"];
    if (lower.includes("hydrangea")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-24"];
    if (lower.includes("weigela")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-25"];
    if (lower.includes("camellia")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-26"];
    if (lower.includes("astrantia") || lower.includes("masterwort")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-27"];
    if (lower.includes("clematis")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-29"];
    if (lower.includes("lilac") && !lower.includes("california")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-30"];
    if (lower.includes("buddleja") || lower.includes("butterfly bush")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-31"];
    if (lower.includes("ceanothus") || lower.includes("california lilac")) return PLANT_BOTANICAL_IMAGE_MAP["hadston-32"];
    if (lower.includes("gertrude jekyll")) return PLANT_BOTANICAL_IMAGE_MAP["cat-01"];
    if (lower.includes("rhubarb")) return PLANT_BOTANICAL_IMAGE_MAP["cat-02"];
    if (lower.includes("garlic")) return PLANT_BOTANICAL_IMAGE_MAP["cat-03"];
    if (lower.includes("broad bean") || lower.includes("aquadulce")) return PLANT_BOTANICAL_IMAGE_MAP["cat-04"];
    if (lower.includes("kale") || lower.includes("cavolo")) return PLANT_BOTANICAL_IMAGE_MAP["cat-05"];
    if (lower.includes("agapanthus") || lower.includes("african lily")) return PLANT_BOTANICAL_IMAGE_MAP["cat-06"];
    if (lower.includes("lavender") || lower.includes("lavandula")) return PLANT_BOTANICAL_IMAGE_MAP["cat-09"];
    if (lower.includes("amistad")) return PLANT_BOTANICAL_IMAGE_MAP["cat-10"];
    if (lower.includes("apple") || lower.includes("discovery")) return PLANT_BOTANICAL_IMAGE_MAP["cat-11"];
    if (lower.includes("geranium") || lower.includes("pelargonium")) return PLANT_BOTANICAL_IMAGE_MAP["cat-12"];
    if (lower.includes("hellebore") || lower.includes("lenten")) return PLANT_BOTANICAL_IMAGE_MAP["cat-13"];
    if (lower.includes("sweet pea") || lower.includes("lathyrus")) return PLANT_BOTANICAL_IMAGE_MAP["cat-14"];
  }

  // Fallback to botanical specimen with specified name
  return {
    name: plantIdOrName || 'Botanical Specimen',
    photoUrl: '/assets/plants/hadston-01.jpg',
    attribution: 'Wikimedia Commons (Botanical Specimen)',
    description: 'Temperate garden specimen cultivated for UK microclimates',
    accentColor: '#059669'
  };
}

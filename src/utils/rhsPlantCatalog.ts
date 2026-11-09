/**
 * RHS Plant & Cultivar Catalog (UK Zone 8b / RHS H4–H5)
 * Includes the complete 32-plant Garden Collection (Photo Refs #1–#32),
 * regional UK allotment & border staples, and the extended RHS UK Garden & Allotment Catalogue.
 */

import { EXTENDED_RHS_CATALOG_PLANTS } from './rhsExtendedCatalogData';

export interface RhsCatalogPlant {
  catalogId: string;
  photoRef?: number;
  isHadstonCollection?: boolean;
  name: string;
  commonName: string;
  botanicalName?: string;
  category: 'ORNAMENTAL' | 'EDIBLE_ALLOTMENT' | 'SHRUB_TREE' | 'TENDER_PATIO';
  rhsRating: 'H1a' | 'H1b' | 'H1c' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7';
  recommendedLocation: string;
  defaultOctGrowthStage: string;
  vulnerabilities: string[];
  clayNotes: string;
  // Extended Master Horticulturist fields for the 32 Hadston Garden plants
  soilAndSun?: string;
  characteristicsAndNative?: string;
  feedTypeNpk?: string;
  feedWindowUk?: string;
  feedFrequencyDosage?: string;
  pruneMonthsUk?: string;
  pruneType?: string;
  pruneTechnique?: string;
  pruneAvoid?: string;
  overwinteringProtocol?: string;
  idDisambiguationNote?: string;
}

export type CatalogPlantItem = RhsCatalogPlant;

/**
 * The User's 32 Garden Plants (Photo Refs #1 - #32)
 * Calibrated for UK Hardiness Zone 8b / RHS H4-H5
 */
export const HADSTON_GARDEN_COLLECTION_32: RhsCatalogPlant[] = [
  {
    catalogId: 'hadston-01',
    photoRef: 1,
    isHadstonCollection: true,
    name: 'Mealycup Sage (Salvia farinacea)',
    commonName: 'Mealycup Sage',
    botanicalName: 'Salvia farinacea',
    category: 'TENDER_PATIO',
    rhsRating: 'H3',
    recommendedLocation: 'Terracotta Patio Pot',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Killed by sub-zero wet clay', 'Air frost blackens stems below -2°C', 'Root rot in winter wet'],
    clayNotes: 'Treat as half-hardy perennial in cooler UK zones; requires sharp grit drainage or overwintering under frost-free glass.',
    soilAndSun: 'pH 6.0–7.0 (slightly acidic to neutral); Full Sun (South/West aspect); free-draining gritted loam.',
    characteristicsAndNative: 'Half-hardy herbaceous sub-shrub with violet-blue flower spikes & powdery white calyxes. Native to Texas & Mexico.',
    feedTypeNpk: 'High-potash liquid feed (NPK 4-4-8 or Tomorite 4-3-8) + monthly liquid seaweed.',
    feedWindowUk: 'Late May to Early September',
    feedFrequencyDosage: 'Every 14 days at 4.5 ml/L root drench during active flowering.',
    pruneMonthsUk: 'Mid-May (after last spring frost) & deadhead July–September',
    pruneType: 'Spring cut-back & summer deadheading',
    pruneTechnique: 'Leave old stems intact all winter to shield basal crown buds; cut back to 10cm above ground in mid-May once new basal shoots emerge.',
    pruneAvoid: 'Never hard-prune in October/November—hollow cut stems channel freezing rain directly into the crown.',
    overwinteringProtocol: 'Take 10cm nodal cuttings in September; move container plants into a frost-free porch/greenhouse (min 3°C) or apply 10cm dry bark mulch under a cloche.'
  },
  {
    catalogId: 'hadston-02',
    photoRef: 2,
    isHadstonCollection: true,
    name: "Lemon Cypress (Cupressus macrocarpa 'Goldcrest')",
    commonName: 'Lemon Cypress Goldcrest',
    botanicalName: "Cupressus macrocarpa 'Goldcrest'",
    category: 'TENDER_PATIO',
    rhsRating: 'H4',
    recommendedLocation: 'Sheltered Courtyard Pot',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Cold North Sea easterly wind scorch', 'Brown dieback if pruned into old wood', 'Root suffocation in waterlogged clay'],
    clayNotes: 'Raise containers on pot feet; shelter from cold easterly gales.',
    soilAndSun: 'pH 6.0–7.2; Full Sun to Light Shade; moist but well-drained John Innes No. 3 + 20% grit.',
    characteristicsAndNative: 'Columnar evergreen conifer with lemon-scented golden-chartreuse foliage. Native to Monterey Peninsula, California.',
    feedTypeNpk: 'Balanced slow-release conifer fertiliser (NPK 12-7-12 + MgO) + Epsom salts (magnesium sulphate).',
    feedWindowUk: 'April to July',
    feedFrequencyDosage: 'Single slow-release top-dress (40g/m²) in April; foliar/root drench Epsom salts (15g/5L) in June if foliage pales.',
    pruneMonthsUk: 'Late May to Early July',
    pruneType: 'Light formal clipping only',
    pruneTechnique: 'Trim only the outermost 1–2cm of soft golden-green current season shoots using sharp shears to maintain cone silhouette.',
    pruneAvoid: 'Never cut back into brown, leafless old wood—Cupressus macrocarpa will not regenerate from bare wood.',
    overwinteringProtocol: 'Move pots against a warm house wall out of freezing winds; wrap pot (not foliage) in hessian if temperatures drop below -5°C.'
  },
  {
    catalogId: 'hadston-03',
    photoRef: 3,
    isHadstonCollection: true,
    name: 'Fuchsia (Fuchsia hybrid)',
    commonName: 'Fuchsia Hybrid',
    botanicalName: 'Fuchsia × hybrida',
    category: 'TENDER_PATIO',
    rhsRating: 'H3',
    recommendedLocation: 'Sheltered Courtyard Pot',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Frost damage to woody stems', 'Vine weevil larvae in compost', 'Fuchsia rust & botrytis in damp autumn'],
    clayNotes: 'Bush hybrids (e.g. Mrs Popple, Riccartonii) survive outdoors with deep crown mulch; trailing basket cultivars require frost-free glass.',
    soilAndSun: 'pH 6.0–6.8; Sun to Partial Shade; fertile moisture-retentive loam with added leafmould.',
    characteristicsAndNative: 'Deciduous or semi-evergreen shrub with pendulous two-toned tubular flowers. Parent species native to Central/South America & NZ.',
    feedTypeNpk: 'Balanced feed in May (NPK 7-7-7), switching to high-potash liquid feed (NPK 4-4-8) from June.',
    feedWindowUk: 'Mid-May to Late August',
    feedFrequencyDosage: 'Weekly liquid root drench (half-strength) for container specimens; fortnightly for border shrubs.',
    pruneMonthsUk: 'Late April to Mid-May (once spring frost risk passes)',
    pruneType: 'Hard spring framework cut-back & shoot pinching',
    pruneTechnique: 'Wait until green shoots break at the base in late April/May, then cut dead winter-frosted top stems back to healthy live buds 10–15cm from soil. Pinch shoot tips after 3 leaf pairs.',
    pruneAvoid: 'Never cut back hardy/half-hardy fuchsias in autumn—old stems insulate the crown against winter frosts.',
    overwinteringProtocol: 'Hardy border types: mound 10cm weathered bark over the crown in November. Tender patio pots: bring into frost-free shed/porch (4–7°C) and keep barely damp.',
    idDisambiguationNote: 'Distinguish Hardy Bush Fuchsia (e.g. F. magellanica / Mrs Popple—slender woody stems, small-to-medium blooms) from Tender Trailing/Double Hybrid (thick succulent stems, large double corollas).'
  },
  {
    catalogId: 'hadston-04',
    photoRef: 4,
    isHadstonCollection: true,
    name: "Dwarf Alberta Spruce (Picea glauca 'Conica')",
    commonName: 'Dwarf Alberta Spruce',
    botanicalName: "Picea glauca 'Conica'",
    category: 'SHRUB_TREE',
    rhsRating: 'H7',
    recommendedLocation: 'Sheltered Lawn Corner',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Spruce spider mite in dry spells', 'Reversion shoots (vigorous coarse branches)', 'Needle browning on windward side'],
    clayNotes: 'Extremely hardy to -20°C; amend heavy clay with 30% grit and bark at planting so roots do not sit in stagnant winter water.',
    soilAndSun: 'pH 5.5–6.8 (acidic to neutral); Full Sun to Light Shade; moist, well-drained soil.',
    characteristicsAndNative: 'Dense, slow-growing conical dwarf evergreen conifer with soft pale-green needles. Native to Canadian Rockies.',
    feedTypeNpk: 'Slow-release conifer & shrub granules (NPK 10-6-10 + Mg & Fe).',
    feedWindowUk: 'April',
    feedFrequencyDosage: 'Once annually in mid-April (35g around drip-line, watered in). Avoid high-nitrogen feeds which cause soft, splaying growth.',
    pruneMonthsUk: 'June (only if tidying or removing reverted shoots)',
    pruneType: 'Minimal maintenance / Reversion removal',
    pruneTechnique: 'Naturally forms a tight cone without shearing. If a coarse, fast-growing reverted branch appears, trace it back to the main trunk and cut flush.',
    pruneAvoid: 'Never shear into brown interior wood; do not crowd against walls where poor airflow triggers red spider mite.',
    overwinteringProtocol: 'Fully winter hardy; brush heavy wet snow off the cone apex so branches do not splay apart.'
  },
  {
    catalogId: 'hadston-05',
    photoRef: 5,
    isHadstonCollection: true,
    name: 'Rose #1 — Shrub / Bush Rose (Rosa species)',
    commonName: 'Rose (Shrub Specimen #5)',
    botanicalName: 'Rosa species (Shrub / English Rose)',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Rose blackspot (Diplocarpon rosae)', 'Autumn/winter wind-rock in wet clay', 'Aphids in May'],
    clayNotes: 'Heavy clay is ideal for roses; shorten tall stems by one-third in late October to prevent winter gales rocking the root collar.',
    soilAndSun: 'pH 6.0–6.8; Full Sun (min 6 hrs/day); deep, fertile heavy clay loam enriched with well-rotted manure.',
    characteristicsAndNative: 'Deciduous thorny woody shrub prized for repeat summer-to-autumn blooms. Northern Hemisphere temperate origins.',
    feedTypeNpk: 'Specialist Rose Fertiliser with Magnesium (NPK 5-6-12 + 2% MgO, e.g. Toprose) + 7cm well-rotted farmyard manure mulch.',
    feedWindowUk: 'Late March (first feed) and Late June (second feed after first flush)',
    feedFrequencyDosage: 'Apply 50g/m² granular rose feed around base in late March and late June; stop feeding by 31 July so stems harden before winter.',
    pruneMonthsUk: 'Late October (wind-rock reduction) & Early-to-Mid March (main structural prune)',
    pruneType: 'Two-stage prune (Oct wind-shorten + March hard/structural prune)',
    pruneTechnique: 'In March, remove dead, diseased, and crossing stems to the base; shorten remaining healthy canes by one-third to one-half, cutting 5mm above an outward-facing bud at a 45° slant away from the bud.',
    pruneAvoid: 'Do not leave ragged stubs above buds (causes dieback) and do not hard-prune in autumn when frost can enter fresh pith.',
    overwinteringProtocol: 'Collect and bin all fallen blackspot-infected leaves in November; firm soil collar around the base after winter gales.',
    idDisambiguationNote: 'Photo Ref #5: Check if blooms are borne in clusters on arching stems (Shrub/Floribunda) vs single high-centred blooms on upright stems (Hybrid Tea).'
  },
  {
    catalogId: 'hadston-06',
    photoRef: 6,
    isHadstonCollection: true,
    name: 'Scaly Male Fern (Dryopteris affinis)',
    commonName: 'Scaly Male Fern',
    botanicalName: 'Dryopteris affinis',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Crown desiccation if planted in dry sun', 'Slug damage on emerging spring crosiers'],
    clayNotes: 'Thrives in damp, cool clay shade; golden-scaly fronds remain semi-evergreen right through winter.',
    soilAndSun: 'pH 5.0–6.8 (acidic to neutral); Partial to Full Shade; humus-rich, moisture-retentive clay loam.',
    characteristicsAndNative: 'Robust semi-evergreen shuttlecock fern with golden-brown scales along stipes and midribs. Native to UK woodlands.',
    feedTypeNpk: 'Organic leafmould mulch + light blood, fish & bone (NPK 5-5-6).',
    feedWindowUk: 'March to April',
    feedFrequencyDosage: 'Apply 5cm autumn leafmould around (never burying) the shuttlecock crown each March + 25g/m² blood, fish & bone.',
    pruneMonthsUk: 'Early March (before golden-scaly fiddleheads unfurl)',
    pruneType: 'Annual frond clearance',
    pruneTechnique: 'Leave browned winter fronds collapsed over the crown through Jan–Feb for frost insulation; cut old fronds cleanly at the base in March as new crosiers swell.',
    pruneAvoid: 'Avoid cutting into the central furry golden crown where next season’s fiddleheads are tightly coiled.',
    overwinteringProtocol: 'Fully hardy (H7); leave natural fallen tree leaves around the root zone for woodland insulation.'
  },
  {
    catalogId: 'hadston-07',
    photoRef: 7,
    isHadstonCollection: true,
    name: "Variegated Hydrangea (Hydrangea macrophylla 'Variegata')",
    commonName: 'Variegated Lacecap Hydrangea',
    botanicalName: "Hydrangea macrophylla 'Variegata' (syn. 'Tricolor' / 'Maculata')",
    category: 'SHRUB_TREE',
    rhsRating: 'H5',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Late May frost blackening terminal flower buds', 'Leaf margin scorch in hot midday sun or salt wind'],
    clayNotes: 'Cream-and-green variegated leaves scorch in exposed sun; plant in sheltered dappled shade.',
    soilAndSun: 'pH 5.5–6.8; Partial / Dappled Shade; moist, fertile clay loam enriched with composted bark.',
    characteristicsAndNative: 'Deciduous shrub with white-margined foliage and delicate lacecap blooms. Derived from coastal Japanese species.',
    feedTypeNpk: 'Low-nitrogen balanced shrub feed (NPK 5-7-10); avoid high nitrogen which causes green reversion and soft frost-prone shoots.',
    feedWindowUk: 'April to June',
    feedFrequencyDosage: 'Single application of Vitax Q4 (50g/m²) in mid-April, watered in and mulched with 5cm bark.',
    pruneMonthsUk: 'Late April (after hard frosts pass)',
    pruneType: 'Old-wood flower bud preservation prune',
    pruneTechnique: 'Flowers on previous year’s wood. Keep faded flower heads on all winter; in late April cut faded heads back to the first pair of fat, healthy green buds below the old bloom. Cut out 1 in 4 oldest stems to the base.',
    pruneAvoid: 'Never hard-prune all stems to the ground in spring or you will remove 100% of that summer’s flower buds.',
    overwinteringProtocol: 'Retain dry lacecap heads over winter as frost umbrellas; throw 30gsm fleece over the shrub if a sub-zero frost is forecast in May.'
  },
  {
    catalogId: 'hadston-08',
    photoRef: 8,
    isHadstonCollection: true,
    name: 'Soft Shield Fern (Polystichum setiferum)',
    commonName: 'Soft Shield Fern',
    botanicalName: 'Polystichum setiferum',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Winter waterlogging if planted in a sunken sump', 'Scorched pinnae in direct south sun'],
    clayNotes: 'Evergreen filigree fronds provide winter structure in shaded borders; prefers neutral-to-alkaline clay loam.',
    soilAndSun: 'pH 6.0–7.5; Partial to Deep Shade; moist but free-draining woodland loam.',
    characteristicsAndNative: 'Evergreen native fern with soft, finely divided, feathery fronds forming a lax rosette. Native to British Isles.',
    feedTypeNpk: 'Leafmould or garden compost top-dress + calcified seaweed or bone meal (NPK 3.5-17-0).',
    feedWindowUk: 'March',
    feedFrequencyDosage: 'Mulch root zone with 5cm leafmould and 30g/m² bone meal every March.',
    pruneMonthsUk: 'Late March to Early April',
    pruneType: 'Selective old frond removal',
    pruneTechnique: 'As new silvery-scaled crosiers uncoil in spring, snip off tatty, flattened outer fronds from the previous year right at the base.',
    pruneAvoid: 'Do not strip evergreen fronds in autumn—they photosynthesise during mild winter spells and shield the crown.',
    overwinteringProtocol: 'Fully hardy (H7); no winter protection required.'
  },
  {
    catalogId: 'hadston-09',
    photoRef: 9,
    isHadstonCollection: true,
    name: 'Common Thyme (Thymus vulgaris)',
    commonName: 'Common Culinary Thyme',
    botanicalName: 'Thymus vulgaris',
    category: 'EDIBLE_ALLOTMENT',
    rhsRating: 'H5',
    recommendedLocation: 'Raised Bed (Compost / Loam Mix)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Root and stem rot in ungritted wet winter clay', 'Woody bare centre if left unclipped'],
    clayNotes: 'Winter wet is fatal to Thyme in heavy clay—always grow in a raised bed, gravel edge, or terracotta pot with 40% sharp grit.',
    soilAndSun: 'pH 6.5–7.8 (neutral to alkaline); Full Sun; poor-to-moderate, sharply drained gritty soil.',
    characteristicsAndNative: 'Aromatic dwarf evergreen Mediterranean sub-shrub with tiny grey-green leaves and lilac-pink summer flowers.',
    feedTypeNpk: 'Minimal feeding; light seaweed tonic only (excess nitrogen destroys essential oil flavour and causes soft winter dieback).',
    feedWindowUk: 'May to July',
    feedFrequencyDosage: 'Dilute liquid seaweed drench (half-strength) once in May and once in July after flowering.',
    pruneMonthsUk: 'Late July / August (immediately after flowering) & Light tidy in late April',
    pruneType: 'Post-flowering shear back',
    pruneTechnique: 'Shear back by one-third immediately after flowering in late July/August, always leaving at least 5cm of leafy green shoot above woody stems.',
    pruneAvoid: 'Never cut into hard, bare brown wood and never prune after August.',
    overwinteringProtocol: 'Top-dress around the collar with 2cm of coarse horticultural grit in October to keep wet soil off the stems.'
  },
  {
    catalogId: 'hadston-10',
    photoRef: 10,
    isHadstonCollection: true,
    name: 'Japanese Skimmia (Skimmia japonica)',
    commonName: 'Japanese Skimmia',
    botanicalName: 'Skimmia japonica',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Budding / Flowering',
    vulnerabilities: ['Leaf yellowing (chlorosis) in alkaline soil or full baking sun', 'Red spider mite in dry shade'],
    clayNotes: 'Holds crimson flower buds (e.g. Rubella) or scarlet berries all winter; enrich heavy clay with ericaceous compost.',
    soilAndSun: 'pH 5.0–6.5 (acidic to neutral); Partial to Full Shade; humus-rich, moist clay loam.',
    characteristicsAndNative: 'Compact evergreen dome shrub with aromatic leathery leaves, fragrant spring panicles, and winter buds/berries. Native to Japan.',
    feedTypeNpk: 'Ericaceous slow-release fertiliser (NPK 14-8-16 + sequestered iron & magnesium).',
    feedWindowUk: 'April and June',
    feedFrequencyDosage: 'Apply 40g/m² ericaceous granules in April + liquid sequestered iron drench in June if leaves turn lime-yellow.',
    pruneMonthsUk: 'May (immediately after spring flowering)',
    pruneType: 'Minimal shaping only',
    pruneTechnique: 'Naturally compact; only trim back wayward shoots to a whorl of leaves in May after flowers fade.',
    pruneAvoid: 'Never prune in late summer, autumn, or winter—you will cut off the overwintering crimson flower buds or berries.',
    overwinteringProtocol: 'Fully hardy (H6); mulch with 5cm pine bark in autumn to maintain soil acidity and prevent frost heave.'
  },
  {
    catalogId: 'hadston-11',
    photoRef: 11,
    isHadstonCollection: true,
    name: 'Bamboo (Fargesia species)',
    commonName: 'Clump-Forming Fountain Bamboo',
    botanicalName: 'Fargesia murielae / Fargesia nitida',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'Sheltered Lawn Corner',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Leaf rolling in cold drying winds', 'Waterlogging if drainage is blocked'],
    clayNotes: 'Non-invasive pachymorph (clumping) bamboo; loves moisture-retentive clay loam and acts as an evergreen windbreak.',
    soilAndSun: 'pH 5.5–7.0; Sun to Partial Shade; fertile, moisture-retentive clay loam.',
    characteristicsAndNative: 'Non-running evergreen clumping bamboo with slender arching culms. Native to mountain forests of Sichuan/Gansu, China.',
    feedTypeNpk: 'High-nitrogen organic feed (NPK 10-4-4 or poultry manure pellets + blood, fish & bone).',
    feedWindowUk: 'April to July',
    feedFrequencyDosage: 'Top-dress with 60g/m² poultry manure pellets in April and June; leave fallen bamboo leaves around base to supply natural silica.',
    pruneMonthsUk: 'May to June (after new culm shoots finish extending)',
    pruneType: 'Culm thinning & crown lifting',
    pruneTechnique: 'Cut dead, weak, or 4-year-old yellowing canes flush to ground level in May. Optionally strip lower side-branches on the bottom 60cm to showcase coloured canes.',
    pruneAvoid: 'Never clear away the natural carpet of fallen bamboo leaves—they return essential silica and insulate shallow rhizomes.',
    overwinteringProtocol: 'Fully hardy (H6); water container specimens during dry freezing east winds to prevent leaf desiccation.'
  },
  {
    catalogId: 'hadston-12',
    photoRef: 12,
    isHadstonCollection: true,
    name: 'Crabapple (Malus species)',
    commonName: 'Flowering Crabapple',
    botanicalName: "Malus sylvestris / Malus 'Evereste' / 'John Downie'",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'Sheltered Lawn Corner',
    defaultOctGrowthStage: 'Fruiting / Ripening',
    vulnerabilities: ['Apple scab (Venturia inaequalis) in wet summers', 'Apple canker in unamended waterlogged clay'],
    clayNotes: 'Superb pollinator and autumn fruit tree for heavy clay; winter-prune in Jan–Feb to keep canopy open to airflow.',
    soilAndSun: 'pH 6.0–7.0; Full Sun; deep, moisture-retentive clay loam.',
    characteristicsAndNative: 'Deciduous small tree with profuse May blossom and colourful autumn crabapples for wildlife/jelly. Temperate Northern Hemisphere.',
    feedTypeNpk: 'Sulphate of Potash (NPK 0-0-48) in late winter + balanced Vitax Q4 (NPK 5-7.5-10) in spring.',
    feedWindowUk: 'February (potash) and April (balanced feed)',
    feedFrequencyDosage: 'Apply 30g/m² Sulphate of Potash in February to boost blossom/fruit, followed by 60g/m² Vitax Q4 in April.',
    pruneMonthsUk: 'January to February (fully dormant)',
    pruneType: 'Winter formative & airflow pruning',
    pruneTechnique: 'Remove dead, diseased, Canker-marked, and inward-crossing branches back to the branch collar to create an open wine-glass canopy.',
    pruneAvoid: 'Avoid heavy pruning—Crabapples flower on 2-year+ fruiting spurs; excessive cutting triggers unproductive water shoots.',
    overwinteringProtocol: 'Leave persistent crabapples on branches into December for thrushes, fieldfares, and waxwings; check tree stake ties before winter storms.'
  },
  {
    catalogId: 'hadston-13',
    photoRef: 13,
    isHadstonCollection: true,
    name: 'Michaelmas Daisy (Symphyotrichum species)',
    commonName: 'Michaelmas Daisy (Autumn Aster)',
    botanicalName: 'Symphyotrichum novi-belgii / S. novae-angliae',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Budding / Flowering',
    vulnerabilities: ['Powdery mildew if roots dry out in summer', 'Spring slug grazing on new shoots'],
    clayNotes: 'Cool, moisture-holding clay suppresses Aster powdery mildew far better than dry sandy soils.',
    soilAndSun: 'pH 6.0–7.2; Full Sun; moist, fertile clay loam.',
    characteristicsAndNative: 'Herbaceous late-season perennial producing starry purple, pink, or blue daisy blooms in Sept–Nov. Native to North America.',
    feedTypeNpk: 'Balanced organic perennial feed (NPK 5-7-10) + 5cm garden compost mulch.',
    feedWindowUk: 'April and June',
    feedFrequencyDosage: 'Top-dress with 50g/m² balanced organic fertiliser in April and water deeply in dry July spells to prevent mildew.',
    pruneMonthsUk: 'Late May ("Chelsea Chop") & Early March (cut down old stems)',
    pruneType: 'Late May pinching + Spring clearance',
    pruneTechnique: 'In late May, pinch or shear back one-third of stems by 30% ("Chelsea Chop") for bushier, stake-free plants. Leave seedheads standing for winter goldfinches and cut to ground in early March.',
    pruneAvoid: 'Do not let clumps become congested—divide every 3rd April, replanting vigorous outer shoots.',
    overwinteringProtocol: 'Fully hardy (H7); leave woody flower stems standing until March to protect emerging basal shoots and feed birds.'
  },
  {
    catalogId: 'hadston-14',
    photoRef: 14,
    isHadstonCollection: true,
    name: 'Rose #2 — Hybrid Tea / Floribunda Rose (Rosa hybrid)',
    commonName: 'Rose (Hybrid Specimen #14)',
    botanicalName: 'Rosa × hybrida (Hybrid Tea / Floribunda)',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Blackspot & rust in damp air', 'Dieback if pruned into frost', 'Wind-rock'],
    clayNotes: 'Modern hybrid roses excel in pH 6.5 clay; prune slightly harder in March than shrub roses for strong flowering stems.',
    soilAndSun: 'pH 6.2–6.8; Full Sun (South/West aspect); rich heavy clay amended with well-rotted horse manure.',
    characteristicsAndNative: 'Repeat-flowering bush rose bred for high-centred blooms or abundant clusters from June to October.',
    feedTypeNpk: 'Granular Rose Feed with Magnesium (NPK 5-6-12 + 2% MgO) + fortnightly liquid seaweed tonic.',
    feedWindowUk: 'Late March to Late July',
    feedFrequencyDosage: '50g/m² granular feed in late March and again in late June; foliar seaweed spray monthly May–July to toughen leaf cuticle against blackspot.',
    pruneMonthsUk: 'Late October (1/3 wind reduction) & Mid-March (main prune)',
    pruneType: 'Hard annual bush rose prune',
    pruneTechnique: 'In mid-March, prune Hybrid Teas down to 4–6 buds (15–20cm from base) and Floribundas to 25–30cm from base, always cutting 5mm above an outward-facing bud.',
    pruneAvoid: 'Never mulch with fresh unrotted manure touching the stems and never feed with nitrogen after July.',
    overwinteringProtocol: 'Shorten tall canes by one-third in late October; clear every fallen leaf from the bed in November to break the blackspot spore cycle.',
    idDisambiguationNote: 'Photo Ref #14: Hybrid Tea roses bear 1 large shapely flower per stem (prune harder to 15–20cm in March); Floribundas bear multi-bloom trusses (prune to 25–30cm).'
  },
  {
    catalogId: 'hadston-15',
    photoRef: 15,
    isHadstonCollection: true,
    name: 'Flowering Cherry (Prunus species)',
    commonName: 'Ornamental Flowering Cherry',
    botanicalName: "Prunus serrulata / Prunus 'Kanzan' / 'Amanogawa'",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'Sheltered Lawn Corner',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Silver leaf disease (Chondrostereum purpureum) if pruned in winter', 'Bacterial canker', 'Late April blossom frost'],
    clayNotes: 'CRITICAL RULE: Never prune Prunus in autumn or winter when wet air carries Silver Leaf fungal spores.',
    soilAndSun: 'pH 6.0–7.2; Full Sun; deep, moist but reasonably drained clay loam.',
    characteristicsAndNative: 'Deciduous ornamental tree renowned for spring blossom and fiery bronze/orange autumn foliage. East Asian origins.',
    feedTypeNpk: 'Balanced tree & shrub fertiliser (NPK 7-7-7) + Sulphate of Potash (0-0-48).',
    feedWindowUk: 'March to April',
    feedFrequencyDosage: 'Apply 60g/m² around the canopy drip-line in March followed by a 5cm composted bark mulch (keeping trunk collar bare).',
    pruneMonthsUk: 'Mid-June to Late July ONLY (active sap flow)',
    pruneType: 'Midsummer formative/sanitation prune ONLY',
    pruneTechnique: 'Prune strictly in dry weather between mid-June and late July when rising sap seals wounds rapidly against Silver Leaf and Bacterial Canker.',
    pruneAvoid: 'NEVER prune Flowering Cherry between September and April in the UK.',
    overwinteringProtocol: 'Fully hardy (H6); fit a rabbit/mower guard around the lower trunk and check stakes in October.'
  },
  {
    catalogId: 'hadston-16',
    photoRef: 16,
    isHadstonCollection: true,
    name: 'Peony (Paeonia species)',
    commonName: 'Herbaceous Peony',
    botanicalName: 'Paeonia lactiflora',
    category: 'ORNAMENTAL',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: [' Peony wilt (Botrytis paeoniae)', 'Failure to flower if crown is buried >3cm deep or over-mulched'],
    clayNotes: 'Loves cold winters (requires winter chilling <4°C to set flower buds) and rich heavy clay, provided crowns sit no deeper than 3cm.',
    soilAndSun: 'pH 6.2–7.2; Full Sun; deep, fertile, moisture-retentive clay loam.',
    characteristicsAndNative: 'Long-lived herbaceous perennial with crimson spring shoots and large bowl-shaped June blooms. Native to China & Siberia.',
    feedTypeNpk: 'Low-nitrogen, high-phosphate & potash feed (Bone Meal NPK 3.5-17-0 + Vitax Q4 5-7.5-10).',
    feedWindowUk: 'March and Late June (post-flowering)',
    feedFrequencyDosage: 'Apply 40g/m² Bone Meal + Vitax Q4 in a ring 15cm away from the crown in March and again after petals drop in late June.',
    pruneMonthsUk: 'Late October to Early November',
    pruneType: 'Sanitary autumn cut-down',
    pruneTechnique: 'Once foliage turns bronze-red and dies back in late October, cut all stems right down to 2cm above soil level and burn/bin (do not compost) to prevent Botrytis peony wilt.',
    pruneAvoid: 'Never bury the pink dormant crown buds under deep winter mulch—covering them deeper than 3cm stops flowering completely.',
    overwinteringProtocol: 'Leave the crown exposed to winter cold (essential vernalisation for June blooms); mark the crown location with short canes so it is not trodden on.'
  },
  {
    catalogId: 'hadston-17',
    photoRef: 17,
    isHadstonCollection: true,
    name: 'Cabbage Palm (Cordyline australis)',
    commonName: 'Torbay Palm / Cabbage Palm',
    botanicalName: 'Cordyline australis',
    category: 'TENDER_PATIO',
    rhsRating: 'H3',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Central spear-pull rot after freezing rain + below -5°C', 'Slime flux on frosted trunks'],
    clayNotes: 'Sheltered microclimates help Cordylines survive most winters, but central growing spears must be tied up before hard freezes.',
    soilAndSun: 'pH 6.0–7.2; Full Sun; sharply drained soil or large patio container.',
    characteristicsAndNative: 'Architectural evergreen palm-like monocot tree with sword-like leaves. Native to New Zealand.',
    feedTypeNpk: 'Balanced liquid feed (NPK 7-7-7) or slow-release palm fertilizer.',
    feedWindowUk: 'May to August',
    feedFrequencyDosage: 'Monthly liquid root drench from May to August; zero feeding from September onwards.',
    pruneMonthsUk: 'May (once frost risk has ended)',
    pruneType: 'Lower leaf stripping',
    pruneTechnique: 'Pull or snip off only the lowest brown, hanging dead leaves at the trunk base in May to reveal the clean trunk.',
    pruneAvoid: 'Never strip dying lower leaves in autumn/winter, and if frost damages the top crown, wait until June before cutting—new shoots often burst from the trunk base.',
    overwinteringProtocol: 'Before sub-zero spells (-3°C or colder) in Dec–Feb, gather all sword leaves upright into a bundle and tie with soft twine to keep freezing rain out of the central growing spear.'
  },
  {
    catalogId: 'hadston-18',
    photoRef: 18,
    isHadstonCollection: true,
    name: "Dappled Willow (Salix integra 'Hakuro-nishiki')",
    commonName: 'Flamingo Dappled Willow',
    botanicalName: "Salix integra 'Hakuro-nishiki'",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Leaf scorch if soil dries out in summer', 'Loss of pink-and-cream variegation if not hard-pruned annually'],
    clayNotes: 'Adores wet heavy clay; annual hard pruning in March produces the brightest coral-pink spring shoots and red winter stems.',
    soilAndSun: 'pH 5.5–7.2; Full Sun to Light Shade; moist-to-wet heavy clay loam.',
    characteristicsAndNative: 'Deciduous shrub or grafted standard tree with coral-pink, cream, and green marbled spring foliage. Japanese cultivar.',
    feedTypeNpk: 'Balanced general fertilizer (NPK 7-7-7 or Growmore) + moisture-retaining compost mulch.',
    feedWindowUk: 'March (immediately after hard pruning)',
    feedFrequencyDosage: 'Apply 50g/m² balanced granular feed in March and water generously during any dry summer week.',
    pruneMonthsUk: 'Early-to-Mid March (before catkins/leaf break) & optional light tip-trim in late June',
    pruneType: 'Hard annual pollard / coppice back to framework',
    pruneTechnique: 'In early March, cut all previous year’s stems hard back to 2–3 buds from the main framework or graft union (leaving 15–20cm stubs). This forces vigorous new shoots with intense flamingo-pink tips.',
    pruneAvoid: 'If grown as a grafted lollipop standard, never cut below the top graft union on the trunk, and immediately rub off any plain green suckers on the lower stem.',
    overwinteringProtocol: 'Fully hardy (H6); check standard trunk stake ties before winter gales.'
  },
  {
    catalogId: 'hadston-19',
    photoRef: 19,
    isHadstonCollection: true,
    name: 'Hosta (Hosta species)',
    commonName: 'Plantain Lily (Hosta)',
    botanicalName: 'Hosta species / hybrid',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Severe slug & snail grazing in wet clay', 'Late May frost scorch on unfurling leaves'],
    clayNotes: 'Moisture-retentive clay grows magnificent lush Hostas; use ferric phosphate pellets + garlic wash from March.',
    soilAndSun: 'pH 6.0–7.0; Partial to Dappled Shade; rich, moist clay loam amended with leafmould.',
    characteristicsAndNative: 'Herbaceous perennial grown for architectural ribbed, blue-glaucous, or variegated foliage and lilac summer spires. Native to NE Asia.',
    feedTypeNpk: 'Balanced organic feed (Blood, Fish & Bone NPK 5-5-6) + fortnightly liquid seaweed/garlic foliar spray.',
    feedWindowUk: 'April to July',
    feedFrequencyDosage: 'Top-dress 40g/m² Blood, Fish & Bone in April as noses poke through; apply garlic-water drench every 2 weeks from April to deter slugs.',
    pruneMonthsUk: 'November (after foliage turns golden-yellow and collapses)',
    pruneType: 'Complete winter crown clearance',
    pruneTechnique: 'Remove all slimy, decaying yellow leaves cleanly at ground level in November so keeled slugs and snail eggs cannot overwinter in the crown.',
    pruneAvoid: 'Do not leave rotting Hosta leaves over the crown in winter—they harbour slug colonies right on the dormant buds.',
    overwinteringProtocol: 'After clearing November foliage, ring the dormant crown with a 2cm barrier of sharp horticultural grit or crushed shells.'
  },
  {
    catalogId: 'hadston-20',
    photoRef: 20,
    isHadstonCollection: true,
    name: 'Astilbe (Astilbe species)',
    commonName: 'False Goat’s Beard (Astilbe)',
    botanicalName: 'Astilbe × arendsii',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Crispy brown leaf death if clay dries out in summer', 'Woody congested crowns after 4 years'],
    clayNotes: 'One of the very best perennials for wet, heavy clay—never let the root zone dry out between May and August.',
    soilAndSun: 'pH 5.5–6.8; Partial Shade to Full Sun (only if soil is constantly moist); wet/moist humus-rich clay.',
    characteristicsAndNative: 'Herbaceous perennial with bronze-green ferny foliage and feathery plumes of pink, crimson, or white in July–August. Asian origin.',
    feedTypeNpk: 'Balanced slow-release organic feed (NPK 5-7-10) + thick 7cm composted bark or manure mulch.',
    feedWindowUk: 'March to April',
    feedFrequencyDosage: 'Apply 50g/m² organic feed in March and immediately mulch with 7cm of well-rotted compost to lock moisture into the clay.',
    pruneMonthsUk: 'Early March',
    pruneType: 'Late-winter plume & foliage cut-down',
    pruneTechnique: 'Leave the russet-brown feathery seed plumes standing all autumn and winter for frost structure and crown protection; cut stems to ground level in early March.',
    pruneAvoid: 'Never allow Astilbe roots to dry out in June/July while flower plumes are forming, or buds will abort.',
    overwinteringProtocol: 'Fully hardy (H7); divide woody clumps every 3–4 years in March/April.'
  },
  {
    catalogId: 'hadston-21',
    photoRef: 21,
    isHadstonCollection: true,
    name: 'Black Elderberry (Sambucus nigra)',
    commonName: 'Black Elder / Elderberry',
    botanicalName: "Sambucus nigra (or purple-leaved cultivar e.g. 'Black Lace')",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Blackfly (aphids) on soft May shoot tips', 'Leggy bare base if left unpruned'],
    clayNotes: 'Tough, wind-resistant shrub; hard-pruning in March produces the largest, darkest foliage and strongest stems.',
    soilAndSun: 'pH 5.5–7.5; Full Sun (for deepest purple leaf colour) to Partial Shade; any moist clay loam.',
    characteristicsAndNative: 'Deciduous large shrub with pinnate or lacy dark foliage, flat creamy June elderflower corymbs, and purple-black autumn berries. UK Native.',
    feedTypeNpk: 'General purpose organic fertiliser (NPK 7-7-7) + garden compost mulch.',
    feedWindowUk: 'March',
    feedFrequencyDosage: 'Single spring feed of 50g/m² in March after pruning.',
    pruneMonthsUk: 'Early-to-Mid March',
    pruneType: 'Hard stooling (for foliage) OR selective renewal pruning (for flowers & berries)',
    pruneTechnique: 'For maximum foliage drama: cut all stems back to a low framework 30–45cm above ground in March. If you want June elderflowers and autumn berries (borne on 2-year wood): remove only one-third of the oldest stems to the base each March.',
    pruneAvoid: 'If you stool all stems to the ground every March, you will get magnificent foliage but fewer flowers/berries that summer.',
    overwinteringProtocol: 'Fully hardy (H6); zero winter protection required.'
  },
  {
    catalogId: 'hadston-22',
    photoRef: 22,
    isHadstonCollection: true,
    name: 'Rose #3 — Border / Patio Rose (Rosa species)',
    commonName: 'Rose (Border Specimen #22)',
    botanicalName: 'Rosa species (Repeat-Flowering Border / Patio Rose)',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Blackspot in humid weather', 'Powdery mildew if roots are restricted in dry wall shadows'],
    clayNotes: 'Thrives in deep clay; ensure at least 45cm spacing from neighbouring perennials so breezes dry wet foliage quickly.',
    soilAndSun: 'pH 6.0–6.8; Full Sun; fertile clay loam enriched with composted manure.',
    characteristicsAndNative: 'Compact deciduous repeat-flowering rose providing colour from late June through October.',
    feedTypeNpk: 'High-potash Rose Fertiliser with Magnesium (NPK 5-6-12 + 2% MgO) + Uncle Tom’s Rose Tonic.',
    feedWindowUk: 'Late March and Late June',
    feedFrequencyDosage: '50g/m² granular rose feed in late March and late June; deadhead faded blooms weekly in summer down to the first 5-leaflet leaf.',
    pruneMonthsUk: 'Mid-March',
    pruneType: 'Annual spring shaping & deadwood removal',
    pruneTechnique: 'In mid-March, cut out dead/crossing twiggy growth and reduce main stems by one-third to an outward-facing bud to maintain an open goblet centre.',
    pruneAvoid: 'Never plant a new rose into soil where an old rose grew without replacing a 45cm cube of soil (prevents Rose Replant Disease).',
    overwinteringProtocol: 'Clear fallen leaves in November and mulch around (not touching) the crown with 5cm well-rotted manure in March.',
    idDisambiguationNote: 'Photo Ref #22: Third rose specimen in your collection—tag by flower colour/location in the inventory so summer feeding and deadheading stay synchronized.'
  },
  {
    catalogId: 'hadston-23',
    photoRef: 23,
    isHadstonCollection: true,
    name: 'Purple Top Verbena (Verbena bonariensis)',
    commonName: 'Purple Top Verbena',
    botanicalName: 'Verbena bonariensis',
    category: 'ORNAMENTAL',
    rhsRating: 'H4',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Crown rot in waterlogged winter clay', 'Fatal dieback if cut down in autumn'],
    clayNotes: 'Short-lived perennial in heavy clay unless grit is mixed into the planting hole, though it self-sows freely in gravel paths.',
    soilAndSun: 'pH 6.0–7.5; Full Sun; sharply drained gritted loam.',
    characteristicsAndNative: 'Tall, see-through architectural perennial with square scabrous stems and clusters of violet-purple flowers beloved by Red Admiral butterflies. Native to South America.',
    feedTypeNpk: 'Light high-potash feed (NPK 4-4-8); avoid high nitrogen which causes weak, floppy stems.',
    feedWindowUk: 'June to August',
    feedFrequencyDosage: 'Liquid potash feed once a month in June, July, and August.',
    pruneMonthsUk: 'Late April to Early May (ONLY when new basal shoots appear)',
    pruneType: 'Late-spring cut-back',
    pruneTechnique: 'Leave the tall, wiry brown stems standing all winter—they trap air and stop frost reaching the hollow crown. Cut old stems down to 10cm in late April/early May once green basal shoots break.',
    pruneAvoid: 'NEVER cut Verbena bonariensis down in autumn, and do not hoe away the purple-tinged self-sown seedlings in May!',
    overwinteringProtocol: 'Mulch around the base with 5cm of coarse grit or dry bark in November.'
  },
  {
    catalogId: 'hadston-24',
    photoRef: 24,
    isHadstonCollection: true,
    name: 'Bigleaf Hydrangea #1 (Hydrangea macrophylla)',
    commonName: 'Mophead Hydrangea (Specimen #24)',
    botanicalName: 'Hydrangea macrophylla (Hortensia Group)',
    category: 'SHRUB_TREE',
    rhsRating: 'H5',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['May radiation frost killing top flower buds', 'Drought wilting in hot spells'],
    clayNotes: 'In pH 6.0–6.8 clay, blooms naturally shift between mauve-pink and violet-blue; add aluminium sulphate for rich gentian blue.',
    soilAndSun: 'pH 5.2–6.0 (for blue blooms) or pH 6.5–7.2 (for pink blooms); Morning Sun / Afternoon Shade; moist heavy clay.',
    characteristicsAndNative: 'Deciduous rounded shrub bearing large domed corymbs (mopheads) from July to October. Native to coastal Japan.',
    feedTypeNpk: 'Hydrangea Colourant (Aluminium Sulphate + Iron) for blue blooms OR Vitax Q4 (NPK 5-7.5-10) for pink blooms.',
    feedWindowUk: 'March to June',
    feedFrequencyDosage: 'Apply Vitax Q4 (50g/m²) in April; for blue flowers, drench roots monthly March–June with Hydrangea Colourant dissolved in rainwater (never tap water).',
    pruneMonthsUk: 'Mid-to-Late April',
    pruneType: 'Deadheading to fat paired buds + 1-in-4 old stem renewal',
    pruneTechnique: 'Leave papery old mophead blooms on all winter to insulate the top buds against spring frosts. In mid-April, snip off dead flower heads just above the first pair of plump green buds.',
    pruneAvoid: 'Never cut down healthy un-flowered 1-year stems in spring—those carry this July’s flower buds at their tips.',
    overwinteringProtocol: 'Keep dry flower heads intact all winter; mulch base with 7cm leafmould or bark in November.'
  },
  {
    catalogId: 'hadston-25',
    photoRef: 25,
    isHadstonCollection: true,
    name: 'Weigela (Weigela florida)',
    commonName: 'Weigela',
    botanicalName: 'Weigela florida',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Congested non-flowering wood if neglected', 'Eelworm in wet foliage'],
    clayNotes: 'Reliable deciduous shrub; flowers in June on wood grown the previous summer.',
    soilAndSun: 'pH 6.0–7.5; Full Sun to Partial Shade; fertile, moist clay loam.',
    characteristicsAndNative: 'Deciduous arching shrub producing masses of funnel-shaped rose-pink or crimson flowers in late May–June. Native to North China & Korea.',
    feedTypeNpk: 'Balanced shrub fertiliser (NPK 7-7-7) + well-rotted compost mulch.',
    feedWindowUk: 'April and Late June (immediately after pruning)',
    feedFrequencyDosage: 'Apply 50g/m² balanced feed in April and again in late June after post-flowering pruning to fuel new flowering shoots.',
    pruneMonthsUk: 'Late June to Early July (immediately after flowers fade)',
    pruneType: 'Post-flowering renewal prune',
    pruneTechnique: 'As soon as June flowers finish, cut the stems that have just flowered back to strong, upward-growing new shoots lower down, and remove 1 in 5 oldest woody stems right to the base.',
    pruneAvoid: 'Never prune Weigela in winter or early spring—you will cut off all the shoots programmed to flower in June!',
    overwinteringProtocol: 'Fully hardy (H6); no special winter protection needed.'
  },
  {
    catalogId: 'hadston-26',
    photoRef: 26,
    isHadstonCollection: true,
    name: 'Camellia (Camellia japonica)',
    commonName: 'Japanese Camellia',
    botanicalName: 'Camellia japonica',
    category: 'SHRUB_TREE',
    rhsRating: 'H5',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Budding / Flowering',
    vulnerabilities: ['Bud drop if roots dry out in August/September', 'Early morning frost-thaw scorch on east-facing walls', 'Lime-induced chlorosis'],
    clayNotes: 'Site in a west- or north-facing sheltered spot so early morning winter sun never hits frozen flower buds.',
    soilAndSun: 'pH 4.5–6.0 (strictly acidic / ericaceous); Sheltered Partial Shade (NEVER East-facing morning sun); moist ericaceous loam.',
    characteristicsAndNative: 'Glossy evergreen shrub producing opulent rose-like blooms from late February to April. Native to Japan, Korea & China.',
    feedTypeNpk: 'Ericaceous Liquid & Granular Feed (NPK 14-8-16 + Sequestered Iron) + rainwater irrigation.',
    feedWindowUk: 'April to Early July ONLY',
    feedFrequencyDosage: 'Feed with ericaceous granules (40g/m²) in April after flowering and liquid ericaceous feed in June. Keep soil moist with rainwater in August–September while next year’s flower buds form.',
    pruneMonthsUk: 'May (immediately after spring flowering finishes)',
    pruneType: 'Light post-flowering shaping',
    pruneTechnique: 'Only trim straggly branches back to a healthy leaf node in May right after the last petals fall, before new summer flower buds set.',
    pruneAvoid: 'Do not feed after July (causes late leafy growth at the expense of flower buds) and never let roots dry out in late summer.',
    overwinteringProtocol: 'Mulch with 7cm composted pine bark in autumn; cover with fleece on nights below -3°C during March–April flowering.'
  },
  {
    catalogId: 'hadston-27',
    photoRef: 27,
    isHadstonCollection: true,
    name: 'Masterwort (Astrantia major)',
    commonName: 'Greater Masterwort',
    botanicalName: 'Astrantia major',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Powdery mildew & leaf scorch if planted in dry soil', 'Aphids on flower stems'],
    clayNotes: 'Loves cool, moisture-retentive clay; shear back after the first July flush for a second wave of pincushion blooms in September.',
    soilAndSun: 'pH 6.0–7.2; Partial Shade to Sun; fertile, constantly moist heavy clay loam.',
    characteristicsAndNative: 'Herbaceous perennial with palmate leaves and intricate papery pincushion bracts in ruby, rose, or silver-white. Native to European mountain meadows.',
    feedTypeNpk: 'Balanced organic perennial feed (NPK 5-7-10) + rich compost mulch.',
    feedWindowUk: 'March and Late July (after mid-summer cutback)',
    feedFrequencyDosage: 'Apply 40g/m² organic feed in March; after cutting back faded stems in July, water in a liquid seaweed/potash feed to trigger a second flush.',
    pruneMonthsUk: 'Mid-July (for repeat flush) & November or Early March',
    pruneType: 'Mid-summer rejuvenation cut-back',
    pruneTechnique: 'In mid-July when first flowers fade, cut spent flower stems and tatty outer leaves right to the base—fresh foliage and a second crop of flowers will emerge within 4 weeks.',
    pruneAvoid: 'Do not plant in dry, sun-baked sandy pockets.',
    overwinteringProtocol: 'Fully hardy (H7); mulch crowns with 5cm garden compost in March.'
  },
  {
    catalogId: 'hadston-28',
    photoRef: 28,
    isHadstonCollection: true,
    name: 'Bigleaf Hydrangea #2 (Hydrangea macrophylla)',
    commonName: 'Bigleaf Hydrangea (Specimen #28)',
    botanicalName: 'Hydrangea macrophylla (Specimen #2)',
    category: 'SHRUB_TREE',
    rhsRating: 'H5',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Late spring frost on swelling terminal buds', 'Midday wilting in south-facing sun if unmulched'],
    clayNotes: 'Second Bigleaf Hydrangea in your plot—if sited in a sunnier border, maintain a deep 7cm bark mulch so clay stays cool and moist.',
    soilAndSun: 'pH 5.5–7.0; Dappled Shade or Morning Sun; moisture-retentive heavy clay loam.',
    characteristicsAndNative: 'Showy deciduous shrub with bold serrated leaves and long-lasting summer flower heads.',
    feedTypeNpk: 'Vitax Q4 (NPK 5-7.5-10) or Ericaceous Hydrangea Feed.',
    feedWindowUk: 'April to June',
    feedFrequencyDosage: '50g/m² granular feed in April; water deeply with rainwater during dry summer periods.',
    pruneMonthsUk: 'Mid-to-Late April',
    pruneType: 'Spring deadheading & selective old stem thinning',
    pruneTechnique: 'Retain old flower heads through winter; in late April cut just above the top pair of fat green buds and remove 1–2 oldest basal stems.',
    pruneAvoid: 'Avoid autumn pruning and avoid high-nitrogen lawn feed drift.',
    overwinteringProtocol: 'Leave faded heads on until late April; fleece if a late May air frost is forecast.',
    idDisambiguationNote: 'Photo Ref #28: Second H. macrophylla specimen in your collection—you can experiment by feeding #24 with Aluminium Sulphate (for blue blooms) and #28 with neutral Vitax Q4 (for rose-pink blooms).'
  },
  {
    catalogId: 'hadston-29',
    photoRef: 29,
    isHadstonCollection: true,
    name: 'Clematis (Clematis species)',
    commonName: 'Clematis Vine',
    botanicalName: 'Clematis species (Pruning Group 1, 2 or 3)',
    category: 'ORNAMENTAL',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Clematis wilt (Phoma clematidina) on Group 2 hybrids', 'Slug girdling of young spring shoots', 'Hot sun baking root zone'],
    clayNotes: 'Plant Clematis crowns 5–7cm DEEPER than the pot level in heavy clay so underground nodes can resprout if Clematis wilt or frost strikes.',
    soilAndSun: 'pH 6.5–7.5 (neutral to slightly alkaline); "Heads in the Sun, Feet in the Shade"; deep, cool, moist clay loam.',
    characteristicsAndNative: 'Woody deciduous or evergreen climbing vine clinging by twining leaf petioles. Northern Hemisphere temperate origins.',
    feedTypeNpk: 'High-potash Rose or Tomato Fertiliser (NPK 5-6-12 or 4-4-8).',
    feedWindowUk: 'March to August',
    feedFrequencyDosage: 'Granular rose feed (50g/m²) in March; fortnightly liquid tomato feed from May until flower buds show colour.',
    pruneMonthsUk: 'Depends on Flowering Group: Late Feb/March (Group 2 & 3) OR May post-bloom (Group 1)',
    pruneType: 'RHS Clematis Group 1, 2, or 3 Precision Prune',
    pruneTechnique: '• Group 1 (flowers Jan–April, e.g. C. alpina, C. montana): No routine pruning; tidy after flowering in May.\n• Group 2 (large flowers May–June, e.g. Nelly Moser, The President): In late Feb, remove dead stem tips down to the first pair of fat green buds.\n• Group 3 (flowers July–Oct, e.g. Jackmanii, Viticella): Hard-prune ALL stems down to 30cm above ground (above a strong pair of buds) in late Feb/early March.',
    pruneAvoid: 'Never hard-prune a spring-flowering Group 1 or Group 2 Clematis in March or you will remove the spring display.',
    overwinteringProtocol: 'Shade the root zone with flat stones or low perennials and apply a 7cm compost mulch (kept 5cm clear of the stems).',
    idDisambiguationNote: 'Photo Ref #29 Diagnostic: Note the month your Clematis flowers—Spring (Group 1), Early Summer large blooms (Group 2), or Midsummer-to-Autumn (Group 3).'
  },
  {
    catalogId: 'hadston-30',
    photoRef: 30,
    isHadstonCollection: true,
    name: 'Common Lilac (Syringa vulgaris)',
    commonName: 'Common Fragrant Lilac',
    botanicalName: 'Syringa vulgaris',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Prolific root suckering from rootstock', 'Lilac blight (Pseudomonas syringae) in wet springs', 'Poor flowering in shade or acidic soil'],
    clayNotes: 'Loves neutral-to-alkaline boulder clay; add a handful of garden lime in February if soil pH is below 6.5.',
    soilAndSun: 'pH 6.5–7.5 (neutral to alkaline); Full Sun; fertile, well-drained clay loam.',
    characteristicsAndNative: 'Deciduous large shrub/small tree famed for intensely fragrant conical panicles of lilac, purple, or white in May–June. Native to Balkan Peninsula.',
    feedTypeNpk: 'Bone Meal (NPK 3.5-17-0) + Sulphate of Potash (0-0-48); avoid high nitrogen.',
    feedWindowUk: 'March and June',
    feedFrequencyDosage: 'Apply 50g/m² Bone Meal + 25g/m² Sulphate of Potash in March; apply garden lime in winter if soil is acidic.',
    pruneMonthsUk: 'Mid-June (immediately after May/June blossom fades)',
    pruneType: 'Post-blossom deadheading & sucker removal',
    pruneTechnique: 'In mid-June right after flowers fade, snip off spent flower trusses just above the pair of new leafy shoots at their base, and tear/cut away all root suckers emerging from the ground.',
    pruneAvoid: 'Never prune Lilac after July or in winter—next May’s flower buds are already formed at the shoot tips by August!',
    overwinteringProtocol: 'Fully hardy (H6); dormant buds require winter cold to open evenly in May.'
  },
  {
    catalogId: 'hadston-31',
    photoRef: 31,
    isHadstonCollection: true,
    name: 'Butterfly Bush (Buddleja davidii)',
    commonName: 'Butterfly Bush',
    botanicalName: 'Buddleja davidii',
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Autumn/winter wind-rock snapping long stems in wet clay', 'Unwanted self-seeding if not deadheaded'],
    clayNotes: 'Flowers on current season’s wood—hard-pruning every March keeps the shrub compact (1.5–2m) and loaded with July–September butterfly plumes.',
    soilAndSun: 'pH 6.0–7.8; Full Sun; any well-drained to medium clay loam.',
    characteristicsAndNative: 'Vigorous deciduous shrub bearing honey-scented conical panicles in summer that attract Peacock, Red Admiral, and Comma butterflies. Native to China.',
    feedTypeNpk: 'Minimal feeding required; light Vitax Q4 (NPK 5-7.5-10) after March pruning only.',
    feedWindowUk: 'Late March',
    feedFrequencyDosage: 'Single light dressing of 35g/m² in late March; excess nitrogen produces soft 3m stems that snap in strong winds.',
    pruneMonthsUk: 'Late October (1/2 wind reduction) & Mid-to-Late March (hard framework prune)',
    pruneType: 'Hard annual spring framework cut-back',
    pruneTechnique: 'In mid-to-late March, cut all previous year’s stems hard back to 2 buds from the low woody framework (30–50cm above ground). Deadhead faded plumes in August–September to extend blooming and prevent seeding.',
    pruneAvoid: 'Never leave Buddleja unpruned in spring or it rapidly becomes a 4m woody monster with flowers out of sight at the top.',
    overwinteringProtocol: 'Shorten long whippy branches by half in late October so winter gales do not rock the roots in wet clay.'
  },
  {
    catalogId: 'hadston-32',
    photoRef: 32,
    isHadstonCollection: true,
    name: 'California Lilac (Ceanothus species)',
    commonName: 'California Lilac',
    botanicalName: "Ceanothus thyrsiflorus / Ceanothus 'Concha' / 'Puget Blue'",
    category: 'SHRUB_TREE',
    rhsRating: 'H4',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Cold wind scorch', 'Root rot in ungritted waterlogged clay', 'Fatal dieback if cut into thick old wood'],
    clayNotes: 'Train or plant against a warm, sheltered South- or West-facing wall with 30% grit mixed into the planting hole.',
    soilAndSun: 'pH 6.0–7.2; Full Sun (sheltered warm wall); free-draining gritted loam.',
    characteristicsAndNative: 'Evergreen (or deciduous) shrub with glossy small leaves and electric-blue flower clusters in May–June (or late summer). Native to California.',
    feedTypeNpk: 'Low-nitrogen potash feed (Sulphate of Potash 0-0-48) or none (Ceanothus fixes its own nitrogen via root nodules).',
    feedWindowUk: 'April',
    feedFrequencyDosage: 'Light 20g/m² Sulphate of Potash in April; avoid high-nitrogen or manure mulches which cause soft frost-tender growth.',
    pruneMonthsUk: 'Early June (immediately after May/June flowering for evergreen types)',
    pruneType: 'Light post-flowering tip trim',
    pruneTechnique: 'For spring-flowering evergreen Ceanothus: immediately after blooms fade in June, trim flowered shoots back by one-third to half their length, cutting only into leafy green stems.',
    pruneAvoid: 'Never cut into leafless woody branches thicker than a pencil—Ceanothus rarely breaks from old wood.',
    overwinteringProtocol: 'Shield from freezing northeast gales with a south-facing wall or temporary windbreak mesh during severe sub-zero spells.'
  }
];

/**
 * Additional Regional UK Allotment & Border Staples
 */
export const REGIONAL_UK_STAPLES: RhsCatalogPlant[] = [
  {
    catalogId: 'cat-01',
    name: "Rosa 'Gertrude Jekyll' (English Shrub Rose)",
    commonName: 'Rose Gertrude Jekyll',
    botanicalName: "Rosa 'Gertrude Jekyll' (Ausbord)",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Blackspot in damp summers', 'Autumn wind-rock on tall canes in wet clay'],
    clayNotes: 'Thrives in deep, fertile heavy clay; shorten tall canes by one-third in October to prevent winter wind-rock.',
    soilAndSun: 'pH 6.0–7.0; Full Sun; deep moisture-retentive heavy clay loam.',
    characteristicsAndNative: 'Quintessential rich pink English shrub rose prized for its powerful classic damask-rose fragrance.',
    feedTypeNpk: 'Specialist Rose Fertiliser with Magnesium (NPK 6-5-10 + MgO).',
    feedWindowUk: 'March and Late June (after first flush)',
    feedFrequencyDosage: 'Apply 60g/m² in March and again after the first flower flush in late June.',
    pruneMonthsUk: 'Late October (1/3 wind reduction) & Mid-February to Early March',
    pruneType: 'Winter open-goblet prune',
    pruneTechnique: 'Prune in February/March by reducing stems by one-third to half to an outward-facing bud and removing dead or crossing canes.',
    pruneAvoid: 'Never feed with nitrogen after July or hard-prune in autumn.',
    overwinteringProtocol: 'Mulch with 8cm well-rotted manure in late winter, keeping mulch clear of the stem collar.'
  },
  {
    catalogId: 'cat-02',
    name: "Rhubarb 'Timperley Early' (Rheum × hybridum)",
    commonName: 'Rhubarb Timperley Early',
    botanicalName: "Rheum × hybridum 'Timperley Early'",
    category: 'EDIBLE_ALLOTMENT',
    rhsRating: 'H6',
    recommendedLocation: 'Open Allotment Bed (Exposed)',
    defaultOctGrowthStage: 'Winter Dormant',
    vulnerabilities: ['Crown rot in waterlogged winter clay', 'Slugs around emerging buds'],
    clayNotes: 'Expose dormant crowns to November/December frosts to break dormancy early, but plant on a raised clay ridge to prevent crown rot.',
    soilAndSun: 'pH 6.0–7.0; Full Sun to Light Shade; deep manure-enriched clay ridge.',
    characteristicsAndNative: 'Earliest outdoor and forcing rhubarb cultivar producing tender pink-crimson stalks from February/March.',
    feedTypeNpk: 'Well-rotted manure mulch + General Purpose Fertiliser (NPK 7-7-7).',
    feedWindowUk: 'February to March',
    feedFrequencyDosage: 'Apply 100g/m² general fertiliser in February and mulch around (never over) the crown.',
    pruneMonthsUk: 'April to June (pull stalks, never cut) & stop harvesting by July',
    pruneType: 'Pull stalks & remove flowering spikes immediately',
    pruneTechnique: 'Twist and pull stalks cleanly from the base from April to June; cut off any tall hollow flower stems as soon as they appear.',
    pruneAvoid: 'Never harvest more than half the stalks or pull stalks after June.',
    overwinteringProtocol: 'Leave dormant crown exposed to November frosts before mulching around the edges.'
  },
  {
    catalogId: 'cat-03',
    name: "Allium sativum 'Solent Wight' (Autumn Garlic)",
    commonName: 'Garlic Solent Wight',
    botanicalName: "Allium sativum 'Solent Wight'",
    category: 'EDIBLE_ALLOTMENT',
    rhsRating: 'H6',
    recommendedLocation: 'Raised Bed (Compost / Loam Mix)',
    defaultOctGrowthStage: 'Active Vegetative Growth',
    vulnerabilities: ['Bulb basal rot in ungritted heavy clay', 'Allium white rot', 'Rust in damp spring'],
    clayNotes: 'Plant cloves in October on a 2cm layer of sharp horticultural grit or start in modules over winter if clay beds are waterlogged.',
    soilAndSun: 'pH 6.5–7.0; Full Sun; well-drained raised bed or gritted loam.',
    characteristicsAndNative: 'Isle of Wight softneck garlic with vigorous UK performance, large aromatic bulbs, and 9-month storage life.',
    feedTypeNpk: 'Sulphate of Potash in autumn + light Chicken Manure Pellets in March.',
    feedWindowUk: 'October (at planting) and February/March',
    feedFrequencyDosage: 'Apply 35g/m² potash at planting and 40g/m² nitrogen-rich pellets in late February.',
    pruneMonthsUk: 'June (snip off any flower scapes) & July (lift when lower leaves yellow)',
    pruneType: 'June scape removal & July harvest',
    pruneTechnique: 'Snip off any curly flower stems in June so all energy swells the bulb; lift in July when the bottom 4–5 leaves turn yellow.',
    pruneAvoid: 'Never add fresh manure before planting garlic.',
    overwinteringProtocol: 'Needs 4–6 weeks of winter cold below 5°C to split single cloves into full segmented bulbs.'
  },
  {
    catalogId: 'cat-04',
    name: "Vicia faba 'Aquadulce Claudia' (Overwintering Broad Bean)",
    commonName: 'Broad Bean Aquadulce Claudia',
    botanicalName: "Vicia faba 'Aquadulce Claudia'",
    category: 'EDIBLE_ALLOTMENT',
    rhsRating: 'H5',
    recommendedLocation: 'Open Allotment Bed (Exposed)',
    defaultOctGrowthStage: 'Seedling / Young Plug',
    vulnerabilities: ['Seed rot in cold waterlogged clay', 'Wind-scorch if over 15cm tall before mid-winter', 'Chocolate spot'],
    clayNotes: 'Sow late October/early November or start in deep rootrainers under cold glass for firmer root establishment.',
    soilAndSun: 'pH 6.5–7.5; Full Sun (sheltered); firm moisture-retentive clay loam.',
    characteristicsAndNative: 'Hardiest autumn-sown broad bean producing early May–June harvests of long white-seeded pods.',
    feedTypeNpk: 'Sulphate of Potash (fixes its own nitrogen).',
    feedWindowUk: 'March',
    feedFrequencyDosage: 'Apply 30g/m² potash in early spring.',
    pruneMonthsUk: 'May (pinch out top 8cm shoot tips to deter blackfly)',
    pruneType: 'May shoot-tip pinch against blackfly',
    pruneTechnique: 'Once the lowest flowers set tiny bean pods in May, pinch out the soft top 8cm of every stem to remove blackfly breeding tips.',
    pruneAvoid: 'Do not sow too early in September or plants become too tall and frost-soft before winter.',
    overwinteringProtocol: 'Support rows with string between corner stakes in November to prevent winter wind-rock.'
  },
  {
    catalogId: 'cat-05',
    name: "Brassica oleracea 'Nero di Toscana' (Cavolo Nero Kale)",
    commonName: 'Cavolo Nero Tuscan Kale',
    botanicalName: "Brassica oleracea (Acephala Group) 'Nero di Toscana'",
    category: 'EDIBLE_ALLOTMENT',
    rhsRating: 'H5',
    recommendedLocation: 'Open Allotment Bed (Exposed)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Wind-rock in wet clay creating water sockets', 'Wood pigeon grazing', 'Clubroot in acidic clay'],
    clayNotes: 'Earth up stems 8–10cm and stake firmly in heavy clay; frost sweetens leaf flavour.',
    soilAndSun: 'pH 6.8–7.5; Full Sun to Light Shade; firm alkaline heavy clay.',
    characteristicsAndNative: 'Architectural Italian black kale with savoyed dark blue-green strap leaves harvested all autumn and winter.',
    feedTypeNpk: 'Pelleted Chicken Manure in spring/summer.',
    feedWindowUk: 'June to August, then February',
    feedFrequencyDosage: 'Feed at transplanting and again in early February for spring side-shoots.',
    pruneMonthsUk: 'October to March (pick lower leaves upwards)',
    pruneType: 'Bottom-up leaf harvesting',
    pruneTechnique: 'Harvest a few lower outer leaves at a time from October onwards, always leaving the central top rosette intact to keep growing.',
    pruneAvoid: 'Never cut off the top growing crown until final spring clearance.',
    overwinteringProtocol: 'Firm soil around stem, earth up, and cover with fine bird netting against winter pigeons.'
  },
  {
    catalogId: 'cat-06',
    name: "Agapanthus 'Northern Star' (African Lily)",
    commonName: 'Agapanthus Northern Star',
    botanicalName: "Agapanthus 'Northern Star'",
    category: 'TENDER_PATIO',
    rhsRating: 'H3',
    recommendedLocation: 'Terracotta Patio Pot',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Crown rot in wet winter compost', 'Terracotta pot freeze-cracking below -3°C'],
    clayNotes: 'Move pots into a rain-shadowed porch or cold greenhouse over winter; winter wet kills more Agapanthus than cold alone.',
    soilAndSun: 'pH 6.0–7.2; Full Sun; gritty John Innes No. 3 in a snug terracotta pot.',
    characteristicsAndNative: 'Deciduous hardier Agapanthus bred in the UK with deep violet-blue starry umbels on dark stems in July–August.',
    feedTypeNpk: 'High-Potash Liquid Tomato Feed (NPK 4-3-8).',
    feedWindowUk: 'April to August',
    feedFrequencyDosage: 'Feed fortnightly from April until flowers open in August, then stop.',
    pruneMonthsUk: 'September (cut spent flower stalks, leave leaves to yellow)',
    pruneType: 'Post-flowering stem removal',
    pruneTechnique: 'Cut spent flower stalks at the base in autumn so energy isn’t wasted on seed, leaving strap leaves to die down naturally.',
    pruneAvoid: 'Do not repot into an oversized container—Agapanthus flowers best when roots are slightly pot-bound.',
    overwinteringProtocol: 'Move pots under a dry south eaves or unheated greenhouse from November to March.'
  },
  {
    catalogId: 'cat-07',
    name: "Hydrangea arborescens 'Annabelle'",
    commonName: 'Smooth Hydrangea Annabelle',
    botanicalName: "Hydrangea arborescens 'Annabelle'",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Heavy rain/snow snapping large flower heads', 'Spring frost on new shoots'],
    clayNotes: 'Loves moisture-retentive clay; leave faded flower heads on over winter to shield buds from frosts and prune in late March.',
    soilAndSun: 'pH 5.5–7.5; Partial Shade to Sun (sheltered from wind); moist clay loam.',
    characteristicsAndNative: 'Deciduous shrub producing enormous 25cm spherical heads of lime-to-creamy-white flowers on current season’s stems.',
    feedTypeNpk: 'Balanced Organic Shrub Feed (Vitax Q4).',
    feedWindowUk: 'March to April',
    feedFrequencyDosage: 'Apply 50g/m² in spring and mulch with 5cm compost.',
    pruneMonthsUk: 'Mid-to-Late March',
    pruneType: 'Annual spring cut-back to 30–40cm framework',
    pruneTechnique: 'Because Annabelle flowers on new wood, prune all stems back to 30–40cm above ground in March (leaving a knee-high framework prevents flopping).',
    pruneAvoid: 'Avoid cutting right to ground level if you want sturdier stems that hold up the huge snowball heads.',
    overwinteringProtocol: 'Fully hardy (H6).'
  },
  {
    catalogId: 'cat-08',
    name: "Hosta 'Halcyon' (Plantain Lily)",
    commonName: 'Hosta Halcyon',
    botanicalName: "Hosta (Tardiana Group) 'Halcyon'",
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Heavy keeled slug & snail grazing in damp clay', 'Late May frost scorch on unfurling leaves'],
    clayNotes: 'Clear decaying yellow autumn foliage promptly so slugs do not overwinter in the crown; top-dress with sharp grit.',
    soilAndSun: 'pH 5.8–7.2; Partial to Full Shade; moist humus-rich clay or patio pot.',
    characteristicsAndNative: 'Thick-textured chalky blue-grey ribbed leaves (more slug-resistant than thin green hostas) with pale lilac summer bells.',
    feedTypeNpk: 'Balanced Slow-Release Feed + organic mulch.',
    feedWindowUk: 'March to June',
    feedFrequencyDosage: 'Apply 40g/m² in March as bullet buds poke through.',
    pruneMonthsUk: 'August (cut spent flower scapes) & November (clear yellow leaves)',
    pruneType: 'Autumn hygiene leaf clearance',
    pruneTechnique: 'Remove yellowed slimy leaves in November to eliminate hiding places for overwintering slugs and their eggs.',
    pruneAvoid: 'Avoid hot afternoon sun which melts the blue wax bloom on the leaves.',
    overwinteringProtocol: 'Extremely hardy (H7); top-dress dormant crown with 2cm sharp horticultural grit.'
  },
  {
    catalogId: 'cat-09',
    name: "Lavandula × intermedia 'Grosso' (English Lavender)",
    commonName: 'Lavender Grosso',
    botanicalName: "Lavandula × intermedia 'Grosso'",
    category: 'ORNAMENTAL',
    rhsRating: 'H5',
    recommendedLocation: 'Raised Bed (Compost / Loam Mix)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Root rot in unamended heavy winter clay', 'Woody legginess if pruned into old wood'],
    clayNotes: 'Must be planted on a gritted mound or raised bed—flat winter-wet clay rapidly suffocates lavender roots.',
    soilAndSun: 'pH 6.5–8.0 (neutral to alkaline); Full Sun; sharply drained gritty soil.',
    characteristicsAndNative: 'Vigorous aromatic evergreen sub-shrub with silver-grey leaves and long, intensely scented violet flower wands in July–August.',
    feedTypeNpk: 'Light Sulphate of Potash in spring (never feed nitrogen or manure).',
    feedWindowUk: 'April',
    feedFrequencyDosage: 'Minimal feeding—20g/m² potash in April only.',
    pruneMonthsUk: 'Mid-to-Late August (RHS "8-8-8" rule: 8th month, cut to 8 inches)',
    pruneType: 'Late-summer post-flowering shear above old wood',
    pruneTechnique: 'Every August right after flowering, shear off all flower stalks and 2.5cm of the grey leafy tips, always leaving green/grey shoots below the cut.',
    pruneAvoid: 'NEVER cut into bare brown leafless wood—lavender will not regrow from old wood.',
    overwinteringProtocol: 'Ensure free winter drainage; never mulch with wet organic compost around the stem neck.'
  },
  {
    catalogId: 'cat-10',
    name: "Salvia 'Amistad' (Shrubby Sage)",
    commonName: 'Salvia Amistad',
    botanicalName: "Salvia 'Amistad'",
    category: 'TENDER_PATIO',
    rhsRating: 'H3',
    recommendedLocation: 'Sheltered Courtyard Pot',
    defaultOctGrowthStage: 'Late Flowering / Pre-Dormancy',
    vulnerabilities: ['Air frost blackens top growth', 'Winter waterlogging rots woody base'],
    clayNotes: 'Take August/September nodal cuttings as insurance; leave top growth unpruned until May and mulch crown deeply with dry bark.',
    soilAndSun: 'pH 6.0–7.5; Full Sun; well-drained loam or large patio container.',
    characteristicsAndNative: 'Half-hardy shrubby perennial producing velvety royal-purple flowers with near-black calyxes nonstop from May to November.',
    feedTypeNpk: 'High-Potash Liquid Tomato Feed.',
    feedWindowUk: 'May to September',
    feedFrequencyDosage: 'Feed fortnightly during summer for continuous flower spikes.',
    pruneMonthsUk: 'Late April to May (ONLY after frost risk ends and green basal shoots appear)',
    pruneType: 'Late-spring cut-back of old winter stems',
    pruneTechnique: 'Leave all woody top stems untouched through winter to shield the crown, then cut old stems back to new green basal shoots in late April/May.',
    pruneAvoid: 'Never cut back in autumn—autumn pruning lets frost and winter rain straight into the hollow crown.',
    overwinteringProtocol: 'Mulch crown with 8cm dry bark in November and root 3–4 softwood cuttings on a windowsill in August.'
  },
  {
    catalogId: 'cat-11',
    name: "Malus domestica 'Discovery' (MM106 Rootstock Apple)",
    commonName: 'Apple Tree Discovery',
    botanicalName: "Malus domestica 'Discovery' (MM106)",
    category: 'SHRUB_TREE',
    rhsRating: 'H6',
    recommendedLocation: 'South-Facing Mixed Border (Heavy Clay)',
    defaultOctGrowthStage: 'Leaf Drop / Autumn Dormancy',
    vulnerabilities: ['Apple canker in poorly drained heavy clay', 'Late May blossom frost in valley frost pockets'],
    clayNotes: 'MM106 rootstock tolerates heavier soils well; winter-prune in January to maintain open airflow.',
    soilAndSun: 'pH 6.0–7.0; Full Sun; fertile moisture-retentive clay loam.',
    characteristicsAndNative: 'Early-season British dessert apple with good disease resistance and crisp crimson-flushed apples harvested in August.',
    feedTypeNpk: 'Sulphate of Potash + Balanced Fruit Feed.',
    feedWindowUk: 'February to March',
    feedFrequencyDosage: 'Apply 60g/m² around the canopy drip line in late winter.',
    pruneMonthsUk: 'November to February (when fully dormant)',
    pruneType: 'Winter open-goblet pruning',
    pruneTechnique: 'Remove dead, diseased, or crossing branches first (the 3 Ds), then shorten last year’s leader growth by one-third to an outward bud.',
    pruneAvoid: 'Discovery is a tip/partial-tip bearer—avoid cutting back all short side-shoots (<20cm) which carry the fruit buds at their tips.',
    overwinteringProtocol: 'Apply winter tree wash or grease band in autumn; prune on a dry frost-free winter day.'
  },
  {
    catalogId: 'cat-12',
    name: "Pelargonium 'Graveolens' (Scented Geranium)",
    commonName: 'Scented Pelargonium Geranium',
    botanicalName: 'Pelargonium graveolens',
    category: 'TENDER_PATIO',
    rhsRating: 'H1c',
    recommendedLocation: 'Terracotta Patio Pot',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Killed outright by 0°C air frost', 'Botrytis grey mould in damp unventilated glass'],
    clayNotes: 'Bring indoors to a bright frost-free windowsill (min 5°C) before October frosts and keep compost barely moist.',
    soilAndSun: 'pH 6.0–7.2; Full Sun; gritty John Innes No. 2 compost in terracotta pot.',
    characteristicsAndNative: 'Tender sub-shrub with deeply incised leaves releasing a rich Turkish-delight rose scent when brushed.',
    feedTypeNpk: 'High-Potash Liquid Tomato Feed.',
    feedWindowUk: 'April to September',
    feedFrequencyDosage: 'Feed fortnightly from spring to early autumn; zero feed in winter.',
    pruneMonthsUk: 'March (cut back leggy winter stems by half)',
    pruneType: 'Spring framework reshape & cutting propagation',
    pruneTechnique: 'In March, cut leggy overwintered stems back by half to a leaf node and use the trimmings as nodal cuttings.',
    pruneAvoid: 'Never overwater in winter.',
    overwinteringProtocol: 'Overwinter indoors on a sunny cool windowsill or frost-free conservatory (min 5–7°C) from October to May.'
  },
  {
    catalogId: 'cat-13',
    name: "Helleborus × hybridus (Lenten Rose)",
    commonName: 'Hellebore Lenten Rose',
    botanicalName: 'Helleborus × hybridus',
    category: 'ORNAMENTAL',
    rhsRating: 'H7',
    recommendedLocation: 'North-Facing Shaded Border (Heavy Clay)',
    defaultOctGrowthStage: 'Overwintering Vegetative Growth',
    vulnerabilities: ['Hellebore black death / leaf spot on old foliage', 'Aphids on emerging flower buds'],
    clayNotes: 'Excels in alkaline-to-neutral heavy clay; cut away leathery old leaves in December/January to expose emerging flower buds.',
    soilAndSun: 'pH 6.5–7.8; Partial Shade; deep, fertile heavy clay enriched with leafmould.',
    characteristicsAndNative: 'Evergreen winter-flowering perennial bearing nodding saucer blooms in plum, slate, rose, and cream from January to April.',
    feedTypeNpk: 'Bone Meal & Well-Rotted Compost Mulch.',
    feedWindowUk: 'February and September',
    feedFrequencyDosage: 'Apply 50g/m² Bone Meal and mulch around crowns in autumn and late winter.',
    pruneMonthsUk: 'Late December to Early January (remove old leathery leaves)',
    pruneType: 'Mid-winter old-leaf removal',
    pruneTechnique: 'In late December or January as fat flower buds appear at the base, cut ALL old tattered leathery leaves off at ground level to stop fungal leaf spot jumping onto the flowers.',
    pruneAvoid: 'Do not disturb established roots.',
    overwinteringProtocol: 'Extremely hardy (H7).'
  },
  {
    catalogId: 'cat-14',
    name: "Lathyrus odoratus 'Matucana' (Autumn-Sown Sweet Pea)",
    commonName: 'Sweet Pea Matucana',
    botanicalName: "Lathyrus odoratus 'Matucana'",
    category: 'ORNAMENTAL',
    rhsRating: 'H4',
    recommendedLocation: 'Cold Frame / Cloche',
    defaultOctGrowthStage: 'Seedling / Young Plug',
    vulnerabilities: ['Mouse predation on seeds', 'Leggy etiolation if kept too warm indoors', 'Damping off'],
    clayNotes: 'Sow in deep rootrainers in mid-October in a cold frame; pinch out shoots after 3 pairs of leaves for deep fibrous roots.',
    soilAndSun: 'pH 6.5–7.5; Full Sun; deep manure-lined trench in moisture-retentive clay.',
    characteristicsAndNative: 'Heirloom grandiflora sweet pea renowned for the strongest old-fashioned fragrance and bicolour maroon-and-violet blooms.',
    feedTypeNpk: 'High-Potash Liquid Tomato Feed.',
    feedWindowUk: 'May to August',
    feedFrequencyDosage: 'Feed fortnightly once flower buds show in May.',
    pruneMonthsUk: 'November/December (pinch out tip above 2–3 leaf pairs) & June–August (daily flower picking)',
    pruneType: 'Seedling tip pinch & continuous flower cutting',
    pruneTechnique: 'Pinch out the central shoot when seedlings have 3 pairs of leaves to force sturdy basal side-shoots; cut flowers every 2 days in summer.',
    pruneAvoid: 'Never allow a single seed pod to form in summer or flowering stops immediately.',
    overwinteringProtocol: 'Overwinter autumn-sown rootrainers in a bright, ventilated cold frame (lift lid on frost-free days so plants stay stocky).'
  }
];

export const RHS_PLANT_CATALOG: RhsCatalogPlant[] = [
  ...HADSTON_GARDEN_COLLECTION_32,
  ...REGIONAL_UK_STAPLES,
  ...EXTENDED_RHS_CATALOG_PLANTS
];

export type PlantGroupCategoryId = 'SHRUBS' | 'FLOWERS' | 'VEGETABLES' | 'FOLIAGE';

export interface PlantCategoryDefinition {
  id: PlantGroupCategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface GroupedPlantInventorySection<T = any> extends PlantCategoryDefinition {
  plants: T[];
  tenderCount: number;
}

export const PLANT_CATEGORY_DEFINITIONS: PlantCategoryDefinition[] = [
  {
    id: 'SHRUBS',
    label: 'Shrubs & Trees',
    shortLabel: 'Shrubs',
    description: 'Woody shrubs, roses, hydrangeas, and ornamental trees'
  },
  {
    id: 'FLOWERS',
    label: 'Flowers & Perennials',
    shortLabel: 'Flowers',
    description: 'Flowering border perennials, climbers, and patio blooms'
  },
  {
    id: 'VEGETABLES',
    label: 'Vegetables & Herbs',
    shortLabel: 'Vegetables',
    description: 'Allotment vegetables, culinary herbs, and edible crops'
  },
  {
    id: 'FOLIAGE',
    label: 'Ferns & Architectural Foliage',
    shortLabel: 'Ferns & Foliage',
    description: 'Woodland ferns, hostas, bamboo, and evergreen foliage'
  }
];

const CATALOG_BY_REF = new Map<number, RhsCatalogPlant>();
const CATALOG_BY_ID = new Map<string, RhsCatalogPlant>();
const CATALOG_BY_NAME = new Map<string, RhsCatalogPlant>();
const CATEGORY_DEF_BY_ID = new Map<PlantGroupCategoryId, PlantCategoryDefinition>();
const CATEGORY_SEARCH_LABEL_BY_ID = new Map<PlantGroupCategoryId, string>();

for (const def of PLANT_CATEGORY_DEFINITIONS) {
  CATEGORY_DEF_BY_ID.set(def.id, def);
  CATEGORY_SEARCH_LABEL_BY_ID.set(def.id, `${def.label} ${def.shortLabel}`.toLowerCase());
}

for (const item of RHS_PLANT_CATALOG) {
  if (typeof item.photoRef === 'number') {
    CATALOG_BY_REF.set(item.photoRef, item);
  }
  CATALOG_BY_ID.set(item.catalogId.toLowerCase(), item);
  CATALOG_BY_NAME.set(item.name.toLowerCase(), item);
  CATALOG_BY_NAME.set(item.commonName.toLowerCase(), item);
  if (item.botanicalName) {
    CATALOG_BY_NAME.set(item.botanicalName.toLowerCase(), item);
  }
}

const FOLIAGE_REGEX =
  /\b(fern|dryopteris|polystichum|asplenium|athyrium|dicksonia|hosta|plantain lily|bamboo|fargesia|cypress|cupressus|cordyline|cabbage palm|torbay palm|grass|sedge|carex|miscanthus|stipa|nassella|festuca|fatsia|bergenia|euphorbia|phormium)\b/i;

const VEGETABLES_REGEX =
  /\b(thyme|thymus|rosemary|mint|mentha|basil|parsley|chive|oregano|bay tree|laurus|broccoli|brassica|kale|cavolo|bean|vicia|phaseolus|garlic|rhubarb|rheum|tomato|solanum|potato|carrot|daucus|beetroot|beta|lettuce|courgette|cucurbita|onion|leek|porrum|chilli|pepper|strawberry|fragaria|raspberry|rubus|currant|ribes|gooseberry|blueberry|vaccinium|citrus|meyer lemon|lemon tree|vegetable|edible)\b/i;

const SHRUBS_REGEX =
  /\b(rose|rosa|hydrangea|spruce|picea|skimmia|crabapple|malus|apple|cherry|plum|prunus|pear|pyrus|willow|salix|elder|elderberry|sambucus|weigela|camellia|lilac|syringa|buddleja|butterfly bush|ceanothus|acer|maple|azalea|rhododendron|pieris|viburnum|forsythia|hamamelis|witch hazel|cornus|dogwood|choisya|photinia|magnolia|holly|ilex|yew|taxus|box|buxus|amelanchier|juneberry|wisteria|trachelospermum|star jasmine|lonicera|honeysuckle|shrub|tree)\b/i;

const RESOLVED_CATEGORY_CACHE = new Map<string, PlantGroupCategoryId>();
const TENDER_RHS_RATINGS_SET = new Set(['H1a', 'H1b', 'H1c', 'H2', 'H3']);
const COLD_SEASON_MONTHS_SET = new Set([9, 10, 11, 0, 1]);

/**
 * Resolves the display group category ('SHRUBS' | 'FLOWERS' | 'VEGETABLES' | 'FOLIAGE')
 * for any plant inventory item or RHS catalog plant.
 */
export function resolvePlantGroupCategory(plant: {
  id?: string;
  catalogId?: string;
  photoRef?: number;
  name?: string;
  commonName?: string;
  category?: string;
}): PlantGroupCategoryId {
  if (!plant) return 'FLOWERS';

  const rawCat = String(plant.category || '').toUpperCase().trim();
  if (
    rawCat === 'SHRUBS' ||
    rawCat === 'FLOWERS' ||
    rawCat === 'VEGETABLES' ||
    rawCat === 'FOLIAGE'
  ) {
    return rawCat as PlantGroupCategoryId;
  }

  const cacheKey = `${plant.catalogId || plant.id || ''}|${plant.photoRef ?? ''}|${plant.name || plant.commonName || ''}|${rawCat}`;
  const cached = RESOLVED_CATEGORY_CACHE.get(cacheKey);
  if (cached) return cached;

  const nameStr = String(plant.name || plant.commonName || '').trim();
  const lowerName = nameStr.toLowerCase();

  // Check if plant matches a known RHS catalog item by photoRef, id, or name
  let matchedCatalog: RhsCatalogPlant | undefined;
  if (typeof plant.photoRef === 'number') {
    matchedCatalog = CATALOG_BY_REF.get(plant.photoRef);
  }
  if (!matchedCatalog && plant.catalogId) {
    matchedCatalog = CATALOG_BY_ID.get(plant.catalogId.toLowerCase());
  }
  if (!matchedCatalog) {
    const refMatch = nameStr.match(/^#(\d+)\b/);
    if (refMatch) {
      matchedCatalog = CATALOG_BY_REF.get(Number(refMatch[1]));
    }
  }
  if (!matchedCatalog && plant.id) {
    const idStr = String(plant.id);
    const idRefMatch = idStr.match(/hadston-(?:plt-)?0*(\d+)/i);
    if (idRefMatch) {
      matchedCatalog = CATALOG_BY_REF.get(Number(idRefMatch[1]));
    } else {
      matchedCatalog = CATALOG_BY_ID.get(idStr.toLowerCase());
    }
  }
  if (!matchedCatalog && lowerName) {
    const strippedLower = lowerName.replace(/^#\d+\s+/, '');
    matchedCatalog =
      CATALOG_BY_NAME.get(lowerName) ||
      CATALOG_BY_NAME.get(strippedLower) ||
      RHS_PLANT_CATALOG.find(
        (c) =>
          strippedLower.includes(c.name.toLowerCase()) ||
          strippedLower.includes(c.commonName.toLowerCase())
      );
  }

  const effectiveText = matchedCatalog
    ? `${matchedCatalog.name} ${matchedCatalog.commonName} ${matchedCatalog.botanicalName || ''}`.toLowerCase()
    : lowerName;

  const catalogCategory = matchedCatalog?.category || rawCat;

  let result: PlantGroupCategoryId = 'FLOWERS';
  if (FOLIAGE_REGEX.test(effectiveText)) {
    result = 'FOLIAGE';
  } else if (catalogCategory === 'EDIBLE_ALLOTMENT' || VEGETABLES_REGEX.test(effectiveText)) {
    result = 'VEGETABLES';
  } else if (catalogCategory === 'SHRUB_TREE' || SHRUBS_REGEX.test(effectiveText)) {
    result = 'SHRUBS';
  }

  RESOLVED_CATEGORY_CACHE.set(cacheKey, result);
  return result;
}

// Pre-index all RHS catalog plants once at module initialization for O(1) category filtering and fast text search
interface IndexedRhsCatalogEntry {
  item: RhsCatalogPlant;
  resolvedGroup: PlantGroupCategoryId;
  photoRefExactToken: string;
  searchableBlob: string;
}

const INDEXED_RHS_CATALOG: IndexedRhsCatalogEntry[] = RHS_PLANT_CATALOG.map((item) => {
  const resolvedGroup = resolvePlantGroupCategory(item);
  const groupSearchable = CATEGORY_SEARCH_LABEL_BY_ID.get(resolvedGroup) || '';
  const photoRefExactToken = item.photoRef !== undefined ? `#${item.photoRef}` : '';
  const searchableBlob = [
    item.name,
    item.commonName,
    item.botanicalName || '',
    item.rhsRating,
    item.recommendedLocation,
    item.clayNotes || '',
    item.soilAndSun || '',
    item.characteristicsAndNative || '',
    groupSearchable,
    ...(item.vulnerabilities || [])
  ]
    .join(' ')
    .toLowerCase();

  return {
    item,
    resolvedGroup,
    photoRefExactToken,
    searchableBlob
  };
});

/**
 * Groups an array of plant inventory records by category in canonical display order.
 * Only non-empty categories are returned by default unless includeEmpty is true.
 */
export function groupPlantInventoryByCategory<
  T extends {
    id?: string;
    name?: string;
    rhsRating?: string;
    category?: string;
  }
>(plants: T[], includeEmpty: boolean = false): GroupedPlantInventorySection<T>[] {
  const buckets = new Map<PlantGroupCategoryId, T[]>();
  const tenderCounts = new Map<PlantGroupCategoryId, number>();
  for (const def of PLANT_CATEGORY_DEFINITIONS) {
    buckets.set(def.id, []);
    tenderCounts.set(def.id, 0);
  }

  for (const plant of plants || []) {
    const catId = resolvePlantGroupCategory(plant);
    const targetCat = buckets.has(catId) ? catId : 'FLOWERS';
    buckets.get(targetCat)!.push(plant);
    if (TENDER_RHS_RATINGS_SET.has(String(plant.rhsRating || ''))) {
      tenderCounts.set(targetCat, (tenderCounts.get(targetCat) || 0) + 1);
    }
  }

  const sections: GroupedPlantInventorySection<T>[] = [];
  for (const def of PLANT_CATEGORY_DEFINITIONS) {
    const groupPlants = buckets.get(def.id)!;
    if (includeEmpty || groupPlants.length > 0) {
      sections.push({
        ...def,
        plants: groupPlants,
        tenderCount: tenderCounts.get(def.id) || 0
      });
    }
  }
  return sections;
}

/**
 * Converts the 32 Garden Collection items into active PlantInventory records.
 */
export function getHadston32InventoryRecords() {
  return HADSTON_GARDEN_COLLECTION_32.map((item) => ({
    id: item.catalogId,
    name: `#${item.photoRef} ${item.name}`,
    category: resolvePlantGroupCategory(item),
    rhsRating: item.rhsRating,
    location: item.recommendedLocation,
    growthStage: item.defaultOctGrowthStage,
    vulnerabilities: [...item.vulnerabilities]
  }));
}

/**
 * Converts ALL plants in the complete RHS Plant Catalogue into active PlantInventory records.
 */
export function getAllRhsCatalogInventoryRecords() {
  return INDEXED_RHS_CATALOG.map(({ item, resolvedGroup }) => ({
    id: item.catalogId,
    name: item.photoRef ? `#${item.photoRef} ${item.name}` : item.name,
    category: resolvedGroup,
    rhsRating: item.rhsRating,
    location: item.recommendedLocation,
    growthStage: item.defaultOctGrowthStage,
    vulnerabilities: [...item.vulnerabilities]
  }));
}

/**
 * Searches the RHS Plant Catalog by query string and optional category filter.
 * Uses pre-indexed lowercase blobs and pre-resolved categories for zero-allocation filtering.
 */
export function searchRhsPlantCatalog(
  query: string = '',
  categoryFilter: string = 'ALL'
): RhsCatalogPlant[] {
  const cleanQuery = query.trim().toLowerCase();
  const results: RhsCatalogPlant[] = [];

  for (const entry of INDEXED_RHS_CATALOG) {
    const { item, resolvedGroup, photoRefExactToken, searchableBlob } = entry;
    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'HADSTON_32' && Boolean(item.isHadstonCollection)) ||
      item.category === categoryFilter ||
      resolvedGroup === categoryFilter;
    if (!matchesCategory) continue;

    if (
      !cleanQuery ||
      photoRefExactToken === cleanQuery ||
      searchableBlob.includes(cleanQuery)
    ) {
      results.push(item);
    }
  }

  return results;
}

const UK_MONTH_METADATA = [
  { index: 0, full: 'january', short: 'jan', label: 'January', directRegex: /\b(january|jant?)\b/i },
  { index: 1, full: 'february', short: 'feb', label: 'February', directRegex: /\b(february|febt?)\b/i },
  { index: 2, full: 'march', short: 'mar', label: 'March', directRegex: /\b(march|mart?)\b/i },
  { index: 3, full: 'april', short: 'apr', label: 'April', directRegex: /\b(april|aprt?)\b/i },
  { index: 4, full: 'may', short: 'may', label: 'May', directRegex: /\b(may|mayt?)\b/i },
  { index: 5, full: 'june', short: 'jun', label: 'June', directRegex: /\b(june|junt?)\b/i },
  { index: 6, full: 'july', short: 'jul', label: 'July', directRegex: /\b(july|jult?)\b/i },
  { index: 7, full: 'august', short: 'aug', label: 'August', directRegex: /\b(august|augt?)\b/i },
  { index: 8, full: 'september', short: 'sep', label: 'September', directRegex: /\b(september|sept?)\b/i },
  { index: 9, full: 'october', short: 'oct', label: 'October', directRegex: /\b(october|octt?)\b/i },
  { index: 10, full: 'november', short: 'nov', label: 'November', directRegex: /\b(november|novt?)\b/i },
  { index: 11, full: 'december', short: 'dec', label: 'December', directRegex: /\b(december|dect?)\b/i }
];

const UK_MONTH_INDEX_BY_SHORT = new Map<string, number>(
  UK_MONTH_METADATA.map((m) => [m.short, m.index])
);

const UK_MONTH_RANGE_REGEX =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(?:to|–|-|through)\s*(?:early\s+|mid[- ]+|late\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi;

const MONTH_MENTION_CACHE = new Map<string, boolean>();

/**
 * Checks whether a horticultural schedule string (e.g. "April to July", "Late October to Early November")
 * includes the target 0-indexed UK month (0 = Jan ... 11 = Dec).
 */
export function doesTextMentionUkMonth(scheduleText?: string | null, monthIndex: number = 0): boolean {
  if (!scheduleText) return false;
  const targetIdx = ((monthIndex % 12) + 12) % 12;
  const cacheKey = `${targetIdx}::${scheduleText}`;
  const cached = MONTH_MENTION_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  const lower = String(scheduleText).toLowerCase();
  const targetMeta = UK_MONTH_METADATA[targetIdx];

  if (targetMeta.directRegex.test(lower)) {
    MONTH_MENTION_CACHE.set(cacheKey, true);
    return true;
  }

  UK_MONTH_RANGE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = UK_MONTH_RANGE_REGEX.exec(lower)) !== null) {
    const startIdx = UK_MONTH_INDEX_BY_SHORT.get(match[1].slice(0, 3));
    const endIdx = UK_MONTH_INDEX_BY_SHORT.get(match[2].slice(0, 3));
    if (startIdx !== undefined && endIdx !== undefined) {
      const inRange =
        startIdx <= endIdx
          ? targetIdx >= startIdx && targetIdx <= endIdx
          : targetIdx >= startIdx || targetIdx <= endIdx;
      if (inRange) {
        MONTH_MENTION_CACHE.set(cacheKey, true);
        return true;
      }
    }
  }

  MONTH_MENTION_CACHE.set(cacheKey, false);
  return false;
}

export interface PlantMonthlyCareStatus {
  isDueThisMonth: boolean;
  feedDue: boolean;
  pruneDue: boolean;
  winterProtectDue: boolean;
  badgeLabel: string | null;
  monthName: string;
}

/**
 * Evaluates whether a plant has active feeding, pruning, or winter protection tasks
 * due in the given 0-indexed UK month.
 */
export function getPlantMonthlyCareStatus(
  plant: {
    id?: string;
    catalogId?: string;
    photoRef?: number;
    name?: string;
    commonName?: string;
    rhsRating?: string;
    feedWindowUk?: string;
    pruneMonthsUk?: string;
  },
  monthIndex: number = new Date().getMonth()
): PlantMonthlyCareStatus {
  const safeMonthIdx = ((monthIndex % 12) + 12) % 12;
  const monthName = UK_MONTH_METADATA[safeMonthIdx].label;

  let catalogMatch: RhsCatalogPlant | undefined;
  if (!plant?.feedWindowUk && !plant?.pruneMonthsUk) {
    if (typeof plant?.photoRef === 'number') {
      catalogMatch = CATALOG_BY_REF.get(plant.photoRef);
    }
    const nameStr = String(plant?.name || plant?.commonName || '').trim();
    if (!catalogMatch && nameStr) {
      const refMatch = nameStr.match(/^#(\d+)\b/);
      if (refMatch) {
        catalogMatch = CATALOG_BY_REF.get(Number(refMatch[1]));
      } else {
        const stripped = nameStr.replace(/^#\d+\s+/, '').toLowerCase();
        catalogMatch = CATALOG_BY_NAME.get(nameStr.toLowerCase()) || CATALOG_BY_NAME.get(stripped);
      }
    }
    if (!catalogMatch && plant?.id) {
      catalogMatch = CATALOG_BY_ID.get(String(plant.id).toLowerCase());
    }
  }

  const feedWindow = plant?.feedWindowUk || catalogMatch?.feedWindowUk || '';
  const pruneWindow = plant?.pruneMonthsUk || catalogMatch?.pruneMonthsUk || '';
  const rhsRating = String(plant?.rhsRating || catalogMatch?.rhsRating || 'H4');

  const feedDue = doesTextMentionUkMonth(feedWindow, safeMonthIdx);
  const pruneDue = doesTextMentionUkMonth(pruneWindow, safeMonthIdx);
  const winterProtectDue =
    COLD_SEASON_MONTHS_SET.has(safeMonthIdx) && TENDER_RHS_RATINGS_SET.has(rhsRating);

  const isDueThisMonth = feedDue || pruneDue || winterProtectDue;

  let badgeLabel: string | null = null;
  if (pruneDue && feedDue) {
    badgeLabel = `Prune & Feed (${monthName.slice(0, 3)})`;
  } else if (pruneDue) {
    badgeLabel = `Prune Due (${monthName.slice(0, 3)})`;
  } else if (feedDue) {
    badgeLabel = `Feed Due (${monthName.slice(0, 3)})`;
  } else if (winterProtectDue) {
    badgeLabel = 'Winter Protection';
  }

  return {
    isDueThisMonth,
    feedDue,
    pruneDue,
    winterProtectDue,
    badgeLabel,
    monthName
  };
}

export type PlantHealthStatusLevel = 'THRIVING' | 'WATCH' | 'AT_RISK';

export interface PlantHealthFactorItem {
  label: string;
  impact: string;
  tone: 'NEUTRAL' | 'POSITIVE' | 'WARNING' | 'CRITICAL';
}

export interface PlantHealthAssessment {
  score: number;
  status: PlantHealthStatusLevel;
  label: 'Healthy' | 'Watch' | 'At Risk';
  growthStage: string;
  stageSensitivity: 'HIGH' | 'MODERATE' | 'RESILIENT';
  activeAlertCount: number;
  summaryReason: string;
  factors: string[];
  factorItems: PlantHealthFactorItem[];
}

export interface PlantHealthWeatherContext {
  weatherAlerts?: Array<{
    hazardType?: string;
    severity?: 'CRITICAL' | 'WARNING' | 'INFO' | string;
    affectedPlants?: string[];
  }>;
  hazardSummary?: {
    frostRiskDetected?: boolean;
    lowestForecastTempC?: number | null;
    windRockRiskDetected?: boolean;
    maxForecastGustMph?: number | null;
    waterloggingRiskDetected?: boolean;
    cumulativePrecip48hMm?: number | null;
  };
  isProtectedInAlertChecklist?: boolean;
  careLog?: {
    lastFed?: string;
    lastPruned?: string;
    lastProtected?: string;
  };
}

/**
 * Calculates a deterministic 0–100 health score for an inventory plant
 * based on its current growth stage, RHS hardiness/vulnerabilities, and recent weather alerts.
 */
export function calculatePlantHealthScore(
  plant: {
    id?: string;
    name?: string;
    rhsRating?: string;
    growthStage?: string;
    location?: string;
    vulnerabilities?: string[];
  },
  context: PlantHealthWeatherContext = {}
): PlantHealthAssessment {
  let score = 100;
  const factors: string[] = [];
  const rhsRating = String(plant?.rhsRating || 'H4').trim();
  const factorItems: PlantHealthFactorItem[] = [
    {
      label: `Base Plant Health (${rhsRating} Hardiness)`,
      impact: '100%',
      tone: 'NEUTRAL'
    }
  ];

  const rawStage = String(plant?.growthStage || 'Active Vegetative Growth').trim();
  const lowerStage = rawStage.toLowerCase();
  const lowerName = String(plant?.name || '')
    .replace(/^#\d+\s+/, '')
    .toLowerCase();
  const lowerNamePrimary = lowerName.split('(')[0].trim();
  const vulnsText = Array.isArray(plant?.vulnerabilities)
    ? plant.vulnerabilities.join(' ').toLowerCase()
    : '';

  // 1. Evaluate Growth Stage sensitivity
  let stageSensitivity: 'HIGH' | 'MODERATE' | 'RESILIENT' = 'MODERATE';
  let stageMultiplier = 1.0;

  if (
    lowerStage.includes('seedling') ||
    lowerStage.includes('plug') ||
    lowerStage.includes('hardening off') ||
    lowerStage.includes('budding') ||
    (lowerStage.includes('flowering') && !lowerStage.includes('late flowering'))
  ) {
    stageSensitivity = 'HIGH';
    stageMultiplier = 1.25;
    score -= 4;
    factors.push(`Sensitive growth stage (${rawStage})`);
    factorItems.push({
      label: `Sensitive stage (${rawStage})`,
      impact: '-4%',
      tone: 'WARNING'
    });
  } else if (
    lowerStage.includes('winter dormant') ||
    lowerStage.includes('autumn dormancy') ||
    lowerStage.includes('leaf drop')
  ) {
    stageSensitivity = 'RESILIENT';
    stageMultiplier = 0.6;
    factors.push(`Dormant stage resilience (${rawStage})`);
    factorItems.push({
      label: `Dormant resilience (${rawStage})`,
      impact: '0%',
      tone: 'POSITIVE'
    });
  } else if (lowerStage.includes('late flowering') || lowerStage.includes('pre-dormancy')) {
    stageSensitivity = 'MODERATE';
    stageMultiplier = 1.1;
    score -= 2;
    factors.push(`Transitioning to dormancy (${rawStage})`);
    factorItems.push({
      label: `Transitioning stage (${rawStage})`,
      impact: '-2%',
      tone: 'NEUTRAL'
    });
  } else {
    stageSensitivity = 'MODERATE';
    stageMultiplier = 1.0;
    factors.push(`Stage: ${rawStage}`);
    factorItems.push({
      label: `Growth stage (${rawStage})`,
      impact: '0%',
      tone: 'NEUTRAL'
    });
  }

  // 2. Check direct matches in recent weatherAlerts
  const alerts = Array.isArray(context.weatherAlerts) ? context.weatherAlerts : [];
  let matchedAlertsCount = 0;
  const matchedHazardTypes = new Set<string>();

  if (lowerName && alerts.length > 0) {
    for (const alert of alerts) {
      const affectedList = Array.isArray(alert?.affectedPlants) ? alert.affectedPlants : [];
      const isPlantNamed = affectedList.some((affectedName) => {
        const cleanAffected = String(affectedName || '')
          .replace(/^#\d+\s+/, '')
          .toLowerCase();
        if (!cleanAffected) return false;
        return (
          lowerName.includes(cleanAffected) ||
          cleanAffected.includes(lowerName) ||
          lowerNamePrimary === cleanAffected.split('(')[0].trim()
        );
      });

      if (isPlantNamed) {
        matchedAlertsCount += 1;
        const hazardKey = String(alert.hazardType || 'WEATHER').toUpperCase();
        matchedHazardTypes.add(hazardKey);

        const basePenalty =
          alert.severity === 'CRITICAL' ? 24 : alert.severity === 'WARNING' ? 16 : 8;
        const stageAdjustedPenalty = Math.round(basePenalty * stageMultiplier);
        score -= stageAdjustedPenalty;
        const readableHazard = hazardKey.replace(/_/g, ' ').toLowerCase();
        factors.push(
          `${alert.severity || 'ACTIVE'} ${readableHazard} alert (-${stageAdjustedPenalty})`
        );
        factorItems.push({
          label: `Active ${alert.severity || 'Weather'} ${readableHazard} alert`,
          impact: `-${stageAdjustedPenalty}%`,
          tone: alert.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING'
        });
      }
    }
  }

  // 3. Check general weather hazards against plant RHS hardiness, growth stage & vulnerabilities
  const hazards = context.hazardSummary || {};
  const isTender = TENDER_RHS_RATINGS_SET.has(rhsRating);
  const isHalfHardyH4 = rhsRating === 'H4';

  if (
    hazards.frostRiskDetected &&
    !matchedHazardTypes.has('FROST') &&
    !matchedHazardTypes.has('AIR_FROST') &&
    !matchedHazardTypes.has('GROUND_FROST')
  ) {
    if (isTender) {
      const frostPenalty = Math.round(22 * stageMultiplier);
      score -= frostPenalty;
      matchedAlertsCount += 1;
      factors.push(`Frost alert risk for tender ${rhsRating} plant (-${frostPenalty})`);
      factorItems.push({
        label: `Frost alert risk for tender RHS ${rhsRating} rating`,
        impact: `-${frostPenalty}%`,
        tone: 'CRITICAL'
      });
    } else if (isHalfHardyH4 && stageSensitivity !== 'RESILIENT') {
      const frostPenalty = Math.round(10 * stageMultiplier);
      score -= frostPenalty;
      matchedAlertsCount += 1;
      factors.push(`Frost exposure during ${rawStage} (-${frostPenalty})`);
      factorItems.push({
        label: `Frost exposure on RHS H4 plant during ${rawStage}`,
        impact: `-${frostPenalty}%`,
        tone: 'WARNING'
      });
    } else if (stageSensitivity === 'HIGH') {
      const frostPenalty = 10;
      score -= frostPenalty;
      matchedAlertsCount += 1;
      factors.push(`Frost risk to ${rawStage.toLowerCase()} (-${frostPenalty})`);
      factorItems.push({
        label: `Frost risk to sensitive ${rawStage.toLowerCase()}`,
        impact: `-${frostPenalty}%`,
        tone: 'WARNING'
      });
    } else if (vulnsText.includes('frost') && stageSensitivity !== 'RESILIENT') {
      const frostPenalty = 8;
      score -= frostPenalty;
      matchedAlertsCount += 1;
      factors.push(`Frost vulnerability active (-${frostPenalty})`);
      factorItems.push({
        label: 'Known frost vulnerability in active forecast',
        impact: `-${frostPenalty}%`,
        tone: 'WARNING'
      });
    }
  }

  if (hazards.windRockRiskDetected && !matchedHazardTypes.has('WIND_ROCK') && !matchedHazardTypes.has('WIND')) {
    if (
      vulnsText.includes('wind') ||
      vulnsText.includes('tall') ||
      vulnsText.includes('scorch') ||
      lowerName.includes('rose') ||
      lowerName.includes('cordyline')
    ) {
      const windPenalty = Math.round(12 * stageMultiplier);
      score -= windPenalty;
      matchedAlertsCount += 1;
      factors.push(`High wind / wind-rock exposure (-${windPenalty})`);
      factorItems.push({
        label: 'High wind / wind-rock exposure alert',
        impact: `-${windPenalty}%`,
        tone: 'WARNING'
      });
    } else if (stageSensitivity === 'HIGH') {
      score -= 6;
      matchedAlertsCount += 1;
      factors.push(`Gale exposure on young/flowering growth (-6)`);
      factorItems.push({
        label: 'High wind gusts on young / flowering growth',
        impact: '-6%',
        tone: 'WARNING'
      });
    }
  }

  if (
    hazards.waterloggingRiskDetected &&
    !matchedHazardTypes.has('WATERLOGGING') &&
    !matchedHazardTypes.has('HEAVY_RAIN')
  ) {
    if (
      vulnsText.includes('wet') ||
      vulnsText.includes('waterlog') ||
      vulnsText.includes('rot') ||
      vulnsText.includes('drainage')
    ) {
      const rainPenalty = stageSensitivity === 'RESILIENT' ? 10 : 14;
      score -= rainPenalty;
      matchedAlertsCount += 1;
      factors.push(`Wet clay / root waterlogging risk (-${rainPenalty})`);
      factorItems.push({
        label: 'Heavy rain / wet clay root-rot sensitivity',
        impact: `-${rainPenalty}%`,
        tone: 'WARNING'
      });
    }
  }

  if (matchedAlertsCount === 0) {
    factorItems.push({
      label: 'Recent weather alerts',
      impact: 'No active stress (0%)',
      tone: 'POSITIVE'
    });
  }

  // 4. Positive mitigation from logged care or alert protection
  if (context.isProtectedInAlertChecklist || context.careLog?.lastProtected) {
    if (score < 100) {
      const boost = Math.min(14, 100 - score);
      score += boost;
      factors.push(`Protected / mulched (+${boost})`);
      factorItems.push({
        label: 'Winter protection / mulch applied',
        impact: `+${boost}%`,
        tone: 'POSITIVE'
      });
    }
  }
  if (context.careLog?.lastFed || context.careLog?.lastPruned) {
    if (score < 100) {
      const boost = Math.min(6, 100 - score);
      score += boost;
      factors.push(`Recent care logged (+${boost})`);
      factorItems.push({
        label: 'Recent feeding / pruning logged',
        impact: `+${boost}%`,
        tone: 'POSITIVE'
      });
    }
  }

  const clampedScore = Math.max(15, Math.min(100, Math.round(score)));

  let status: PlantHealthStatusLevel = 'THRIVING';
  let label: 'Healthy' | 'Watch' | 'At Risk' = 'Healthy';
  if (clampedScore < 65) {
    status = 'AT_RISK';
    label = 'At Risk';
  } else if (clampedScore < 85) {
    status = 'WATCH';
    label = 'Watch';
  }

  const summaryReason =
    matchedAlertsCount > 0
      ? `${label} (${clampedScore}%) · ${rawStage} · ${matchedAlertsCount} weather ${
          matchedAlertsCount === 1 ? 'hazard' : 'hazards'
        }`
      : `${label} (${clampedScore}%) · ${rawStage} · No active weather stress`;

  return {
    score: clampedScore,
    status,
    label,
    growthStage: rawStage,
    stageSensitivity,
    activeAlertCount: matchedAlertsCount,
    summaryReason,
    factors,
    factorItems
  };
}




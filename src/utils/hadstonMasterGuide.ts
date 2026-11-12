/**
 * Master Horticulturist & Botanical Specialist Guide Data & Markdown Exporter
 * Calibrated for UK Hardiness Zone 8b / RHS H4–H5 gardens.
 */

import {
  HADSTON_GARDEN_COLLECTION_32,
  RHS_PLANT_CATALOG,
  RhsCatalogPlant,
  getPlantMonthlyCareStatus
} from './rhsPlantCatalog';

export interface WeeklyTaskCategoryBlock {
  wateringAndSoilCare: string;
  feedingAndMulching: string;
  pruningAndDeadheading: string;
  pestDiseaseAndFrost: string;
}

export interface MonthlyWeeklyCalendarEntry {
  monthIndex: number; // 0 = Jan .. 11 = Dec
  monthName: string;
  shortName: string;
  seasonSummary: string;
  typicalHadstonTempC: string;
  week1To2: WeeklyTaskCategoryBlock;
  week3To4: WeeklyTaskCategoryBlock;
}

export interface LocalRiskMitigationProtocol {
  id: string;
  hazardTitle: string;
  hadstonMicroclimateTrigger: string;
  affectedPlants: string[];
  actionableSteps: string[];
}

export const HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR: MonthlyWeeklyCalendarEntry[] = [
  {
    monthIndex: 0,
    monthName: 'January',
    shortName: 'Jan',
    seasonSummary: 'Deep Winter Dormancy · Hard Frosts & North Sea Gales',
    typicalHadstonTempC: '1°C to 6°C (Soil 6cm: 2.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Keep off saturated heavy clay borders completely to prevent structural pan compaction. Check container drainage holes on Lemon Cypress (#2) and Mealycup Sage (#1) so winter rain cannot pool.',
      feedingAndMulching:
        'Zero nitrogen or liquid feeding while plants are dormant. Top up wind-blown pine bark mulch around Camellia (#26) and Skimmia (#10) to 5cm depth.',
      pruningAndDeadheading:
        'Begin dormant winter pruning of Crabapple (#12): remove dead, diseased, and inward-crossing branches on a dry, frost-free afternoon.',
      pestDiseaseAndFrost:
        'Keep Cordyline australis (#17) sword leaves tied upright in a protective bundle during sub-zero spells (-3°C or colder) to prevent central spear rot.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Give overwintering patio pots under glass or porch shelter (Mealycup Sage #1, Fuchsia #3) a sparing 100ml splash of tepid water at the root collar only if compost is bone-dry.',
      feedingAndMulching:
        'Spread a 5cm layer of well-rotted leafmould around Scaly Male Fern (#6) and Soft Shield Fern (#8) without burying the shuttlecock crowns.',
      pruningAndDeadheading:
        'Do NOT prune Flowering Cherry (#15) in winter (high Silver Leaf fungal spore risk). Leave Hydrangea (#7, #24, #28) old flower heads intact.',
      pestDiseaseAndFrost:
        'Brush wet heavy snow off Dwarf Alberta Spruce (#4), Lemon Cypress (#2), and Bamboo (#11) immediately so branches do not splay or snap.'
    }
  },
  {
    monthIndex: 1,
    monthName: 'February',
    shortName: 'Feb',
    seasonSummary: 'Late Winter Awakening · Early Sap Rise & Potash Priming',
    typicalHadstonTempC: '1.5°C to 7°C (Soil 6cm: 3.4°C)',
    week1To2: {
      wateringAndSoilCare:
        'Water evergreen Camellia (#26) and Skimmia (#10) with collected rainwater if freezing east winds dry the topsoil.',
      feedingAndMulching:
        'Apply Sulphate of Potash (0-0-48 at 30g/m²) around Crabapple (#12) and Common Lilac (#30) to strengthen upcoming spring blossom buds. Add 50g/m² garden lime around Lilac (#30) if clay is acidic.',
      pruningAndDeadheading:
        'Complete Crabapple (#12) winter pruning before buds swell. Inspect Clematis (#29) to confirm flowering group.',
      pestDiseaseAndFrost:
        'Keep 30gsm horticultural fleece ready to drape over swelling Camellia (#26) flower buds when clear radiation frosts are forecast.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Fork over unoccupied raised bed edges lightly using timber staging boards if clay is frost-friable.',
      feedingAndMulching:
        'Top-dress Peony (#16) with Bone Meal (NPK 3.5-17-0 at 40g/m²) in a ring 15cm away from the emerging crimson shoots (never bury the crown).',
      pruningAndDeadheading:
        'Prune Clematis (#29): if Group 3 (late-flowering), hard-prune all stems to 30cm above ground; if Group 2 (early large-flowered), lightly trim dead tips down to the first pair of fat green buds.',
      pestDiseaseAndFrost:
        'Clear any remaining overwintering snails from beneath Hosta (#19) pots and terracotta rims before spring emergence.'
    }
  },
  {
    monthIndex: 2,
    monthName: 'March',
    shortName: 'Mar',
    seasonSummary: 'Early Spring Structural Prune · Rose, Willow & Buddleja Reset',
    typicalHadstonTempC: '3°C to 9.5°C (Soil 6cm: 5.5°C)',
    week1To2: {
      wateringAndSoilCare:
        'Check soil moisture around evergreen shrubs as spring winds increase transpiration. Aerate compacted lawn/border edges with a garden fork.',
      feedingAndMulching:
        'Mulch Astilbe (#20), Masterwort (#27), and Michaelmas Daisy (#13) with a 5–7cm blanket of well-rotted compost as soon as old stems are cleared.',
      pruningAndDeadheading:
        'Cut down standing winter stems of Michaelmas Daisy (#13) and Astilbe (#20) to ground level. Snip away tatty old fronds on Scaly Male Fern (#6) and Soft Shield Fern (#8) as new fiddleheads swell. Hard-pollard Dappled Willow (#18) back to 15–20cm stubs.',
      pestDiseaseAndFrost:
        'Scatter ferric phosphate slug pellets or sharp grit around emerging Hosta (#19) noses and Peony (#16) crimson buds.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Water newly mulched beds thoroughly if March is dry and windy.',
      feedingAndMulching:
        'First major spring feed: apply specialist Rose Fertiliser (NPK 5-6-12 + MgO at 50g/m²) to Roses (#5, #14, #22) and Clematis (#29), then mulch with 7cm well-rotted farmyard manure (kept 5cm off stems). Feed Black Elderberry (#21) and Dappled Willow (#18) with balanced NPK 7-7-7.',
      pruningAndDeadheading:
        'Main structural prune for Roses (#5, #14, #22) cutting 5mm above outward-facing buds. Hard-prune Butterfly Bush / Buddleja (#31) to 30–50cm framework. Prune Black Elderberry (#21).',
      pestDiseaseAndFrost:
        'Protect open Camellia (#26) blooms from early morning sun after overnight frost to prevent brown petal scorch.'
    }
  },
  {
    monthIndex: 3,
    monthName: 'April',
    shortName: 'Apr',
    seasonSummary: 'Mid-Spring Growth Surge · Hydrangea Prune & Ericaceous Feeding',
    typicalHadstonTempC: '4.5°C to 12°C (Soil 6cm: 8.2°C)',
    week1To2: {
      wateringAndSoilCare:
        'Begin regular rainwater irrigation for container plants and Camellia (#26). Divide congested clumps of Michaelmas Daisy (#13) and Astilbe (#20) every 3rd spring.',
      feedingAndMulching:
        'Feed acid-loving Camellia (#26) and Skimmia (#10) with Ericaceous Granules (NPK 14-8-16 + Sequestered Iron at 40g/m²). Feed Dwarf Alberta Spruce (#4) and Lemon Cypress (#2) with slow-release conifer feed.',
      pruningAndDeadheading:
        'Lightly tidy Common Thyme (#9) tips once active growth resumes.',
      pestDiseaseAndFrost:
        'Begin fortnightly garlic-water foliar sprays on Hosta (#19) as leaves unfurl. Watch Met Office alerts for North East polar maritime frost plunges.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Keep Astilbe (#20) and Dappled Willow (#18) root zones evenly moist in heavy clay.',
      feedingAndMulching:
        'Feed Hydrangeas (#7, #24, #28) with Vitax Q4 (NPK 5-7.5-10); if blue flowers are desired on #24/#28, drench with Aluminium Sulphate in rainwater. Feed Bamboo (#11) with high-nitrogen poultry manure pellets (60g/m²).',
      pruningAndDeadheading:
        'Prune Hydrangeas (#7, #24, #28) in late April: snip off papery winter flower heads just above the first pair of plump green buds and remove 1-in-4 oldest basal stems. Cut back Purple Top Verbena (#23) and Fuchsia (#3) once basal green shoots break.',
      pestDiseaseAndFrost:
        'Keep fleece handy to cover newly pruned Hydrangeas (#7, #24, #28) and tender Fuchsia (#3) shoots if an air frost threatens.'
    }
  },
  {
    monthIndex: 4,
    monthName: 'May',
    shortName: 'May',
    seasonSummary: 'Late Frost Vigilance (15–25 May Cutoff) & Chelsea Chop',
    typicalHadstonTempC: '7°C to 14.5°C (Soil 6cm: 11.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Increase watering on patio containers (Mealycup Sage #1, Lemon Cypress #2, Fuchsia #3). Tie in rapidly extending Clematis (#29) stems to trellis.',
      feedingAndMulching:
        'Apply liquid seaweed tonic to Roses (#5, #14, #22) and Common Thyme (#9). Begin fortnightly liquid potash feeding for Clematis (#29).',
      pruningAndDeadheading:
        'Untie Cordyline (#17) leaves and strip away any brown dead basal leaves. Cut back Mealycup Sage (#1) to 10cm above ground once late frost risk eases in mid-May. Shape Camellia (#26) and Skimmia (#10) immediately after spring flowers fade.',
      pestDiseaseAndFrost:
        'CRITICAL WINDOW: Average last spring frost falls between 15–25 May in RHS H4 zones. Fleece Fuchsia (#3), Mealycup Sage (#1), and Hydrangeas (#7, #24, #28) on clear nights <= 2°C.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Harden off and move tender patio pots (Mealycup Sage #1, Fuchsia #3) to their summer courtyard positions after 25 May.',
      feedingAndMulching:
        'Begin weekly half-strength balanced liquid feed (NPK 7-7-7) for container Fuchsia (#3) and Cordyline (#17).',
      pruningAndDeadheading:
        'Perform the "Chelsea Chop" on Michaelmas Daisy (#13): shear back one-third of stems by 30% for bushier autumn mounds. Thin dead/weak canes at the base of Bamboo (#11). Pinch Fuchsia (#3) shoot tips after 3 leaf pairs.',
      pestDiseaseAndFrost:
        'Inspect Rose (#5, #14, #22) and Black Elderberry (#21) shoot tips for greenfly/blackfly; rub off by hand or spray with potassium fatty acid soap in the evening.'
    }
  },
  {
    monthIndex: 5,
    monthName: 'June',
    shortName: 'Jun',
    seasonSummary: 'Early Summer Peak · Lilac, Ceanothus & Cherry Pruning Window',
    typicalHadstonTempC: '10°C to 17.5°C (Soil 6cm: 15.0°C)',
    week1To2: {
      wateringAndSoilCare:
        'Deep-soak Peony (#16), Astilbe (#20), and Hydrangeas (#7, #24, #28) at the base during dry spells. Stake heavy Peony (#16) blooms with circular grow-through supports.',
      feedingAndMulching:
        'Switch Fuchsia (#3) and Mealycup Sage (#1) to high-potash liquid feed (NPK 4-4-8) every 10–14 days. Apply Epsom salts drench (15g/5L) to Lemon Cypress (#2) if foliage pales.',
      pruningAndDeadheading:
        'Deadhead Common Lilac (#30) immediately after blossom fades and tear out root suckers. Lightly trim evergreen California Lilac / Ceanothus (#32) shoots by one-third right after June flowering. Clip Lemon Cypress (#2) soft tips only.',
      pestDiseaseAndFrost:
        'Tap Dwarf Alberta Spruce (#4) branches over white paper to check for spruce spider mite; mist foliage with water in dry weather.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Keep soil around Astilbe (#20) and Masterwort (#27) consistently moist—dry clay in June causes flower plumes to abort.',
      feedingAndMulching:
        'Second major Rose feed: apply 50g/m² granular Rose Fertiliser (NPK 5-6-12) to Roses (#5, #14, #22) and Peony (#16) after the first flush of petals drops. Give Camellia (#26) its final liquid ericaceous feed of the year.',
      pruningAndDeadheading:
        'Prune Weigela (#25) immediately after June flowers finish: cut flowered stems back to strong new lower shoots and remove 1-in-5 oldest basal stems. Begin safe midsummer pruning window for Flowering Cherry (#15).',
      pestDiseaseAndFrost:
        'Pick off and bin any early Rose (#5, #14, #22) leaves showing blackspot lesions; never add infected rose leaves to home compost.'
    }
  },
  {
    monthIndex: 6,
    monthName: 'July',
    shortName: 'Jul',
    seasonSummary: 'Midsummer Bloom · Prunus Pruning & Astrantia Rejuvenation',
    typicalHadstonTempC: '12°C to 19.5°C (Soil 6cm: 16.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Water patio pots (Mealycup Sage #1, Lemon Cypress #2, Fuchsia #3) daily in warm weather. Soak Bamboo (#11) and Hydrangeas (#7, #24, #28) deeply twice a week if rain is scarce.',
      feedingAndMulching:
        'Continue fortnightly high-potash liquid feed (NPK 4-4-8) on Mealycup Sage (#1), Fuchsia (#3), Purple Top Verbena (#23), and Clematis (#29).',
      pruningAndDeadheading:
        'Complete any formative or deadwood pruning on Flowering Cherry (#15) before the end of July while sap is active. Deadhead Roses (#5, #14, #22) down to a 5-leaflet leaf.',
      pestDiseaseAndFrost:
        'Ensure Michaelmas Daisy (#13) roots never dry out in July to prevent late-summer powdery mildew.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Check clay borders for surface cracking; hoe lightly or top up bark mulch to seal moisture into the root zone.',
      feedingAndMulching:
        'FINAL NITROGEN CUTOFF (31 July) for Roses (#5, #14, #22) and woody shrubs so stems ripen before autumn frosts. Give Masterwort (#27) a liquid seaweed/potash drench after cutting back.',
      pruningAndDeadheading:
        'Cut spent flower stems and old outer leaves of Masterwort / Astrantia (#27) right to the ground in mid-July to trigger a fresh second flush of blooms in September. Shear Common Thyme (#9) back by one-third after flowering.',
      pestDiseaseAndFrost:
        'Monitor Fuchsia (#3) undersides for fuchsia rust (orange pustules) and maintain good airflow around pots.'
    }
  },
  {
    monthIndex: 7,
    monthName: 'August',
    shortName: 'Aug',
    seasonSummary: 'Late Summer Colour · Camellia Bud Set & Semi-Ripe Cuttings',
    typicalHadstonTempC: '11.5°C to 19°C (Soil 6cm: 16.2°C)',
    week1To2: {
      wateringAndSoilCare:
        'CRITICAL FOR CAMELLIA (#26): Keep Camellia and Skimmia (#10) moist with rainwater throughout August and September—drought now causes spring flower buds to drop in March!',
      feedingAndMulching:
        'Continue high-potash liquid feed on container Fuchsia (#3), Mealycup Sage (#1), and Purple Top Verbena (#23) only.',
      pruningAndDeadheading:
        'Deadhead Butterfly Bush / Buddleja (#31) faded panicles regularly to prolong nectar supply for Peacock and Red Admiral butterflies and prevent unwanted seeding.',
      pestDiseaseAndFrost:
        'Maintain evening slug patrols around Hosta (#19) after late-summer showers.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Water Michaelmas Daisy (#13) at the base as flower buds swell for September.',
      feedingAndMulching:
        'Apply a late-summer dressing of Sulphate of Potash (0-0-48 at 25g/m²) around Roses (#5, #14, #22) and Ceanothus (#32) to toughen cell walls for winter.',
      pruningAndDeadheading:
        'Take 10cm semi-ripe nodal cuttings of Mealycup Sage (#1), Fuchsia (#3), and Ceanothus (#32) in gritty compost as winter insurance. Stop deadheading Roses (#5, #14, #22) by late August so hips form (signals stems to harden).',
      pestDiseaseAndFrost:
        'Inspect container compost on Fuchsia (#3) and Skimmia (#10) for C-shaped white vine weevil grubs; apply pathogenic nematodes (Steinernema kraussei) if present while soil temp is >12°C.'
    }
  },
  {
    monthIndex: 8,
    monthName: 'September',
    shortName: 'Sep',
    seasonSummary: 'Early Autumn Transition · Aster Peak & Overwinter Prep',
    typicalHadstonTempC: '9°C to 16°C (Soil 6cm: 13.5°C)',
    week1To2: {
      wateringAndSoilCare:
        'Reduce watering frequency on patio containers as nights lengthen. Raise all terracotta and glazed pots (Mealycup Sage #1, Lemon Cypress #2, Fuchsia #3) onto pot feet.',
      feedingAndMulching:
        'Cease all liquid feeding of Mealycup Sage (#1), Fuchsia (#3), and Cordyline (#17) by mid-September so soft growth halts.',
      pruningAndDeadheading:
        'Leave faded mophead and lacecap blooms on Hydrangeas (#7, #24, #28)—do NOT deadhead in autumn, as papery heads shield terminal buds from winter and spring frosts.',
      pestDiseaseAndFrost:
        'Stake tall Michaelmas Daisy (#13) stems if exposed to equinoctial westerly gales.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Clear fallen leaves and debris from patio drainage gullies ahead of autumn low-pressure rain bands.',
      feedingAndMulching:
        'Top-dress Common Thyme (#9) and Purple Top Verbena (#23) collars with 2cm of coarse horticultural grit to prevent winter collar rot.',
      pruningAndDeadheading:
        'Do NOT cut back Purple Top Verbena (#23), Mealycup Sage (#1), or Astilbe (#20) in autumn—standing stems protect crowns from winter wet.',
      pestDiseaseAndFrost:
        'Prepare frost-free porch or cold greenhouse space for tender patio pots before early October ground frosts arrive.'
    }
  },
  {
    monthIndex: 9,
    monthName: 'October',
    shortName: 'Oct',
    seasonSummary: 'First Frosts & Wind-Rock Prevention in Heavy Clay',
    typicalHadstonTempC: '6°C to 12.5°C (Soil 6cm: 9.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Install timber staging boards along heavy clay borders so autumn maintenance never compacts wet soil.',
      feedingAndMulching:
        'Mulch Camellia (#26), Skimmia (#10), and Hydrangeas (#7, #24, #28) with a 5–7cm insulating layer of composted pine bark.',
      pruningAndDeadheading:
        'Leave Michaelmas Daisy (#13) and Astilbe (#20) seedheads standing for winter goldfinches and frost architecture.',
      pestDiseaseAndFrost:
        'Move tender container Fuchsia (#3) and Mealycup Sage (#1) into a frost-free porch/conservatory (min 3–5°C) or sheltered house wall before the first air frost.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Firm soil collars around the base of Roses (#5, #14, #22) and Buddleja (#31) so winter gales cannot open water-collecting sockets in the clay.',
      feedingAndMulching:
        'Keep Peony (#16) crown completely unmulched and exposed to winter cold so buds vernalise properly for June flowering.',
      pruningAndDeadheading:
        'Cut Peony (#16) bronze foliage right down to 2cm above ground and bin/burn (prevents Botrytis wilt). Shorten tall whippy canes on Roses (#5, #14, #22) by one-third and Buddleja (#31) by half to prevent winter wind-rock.',
      pestDiseaseAndFrost:
        'Rake up and bin fallen Rose (#5, #14, #22) leaves to eliminate overwintering blackspot spores.'
    }
  },
  {
    monthIndex: 10,
    monthName: 'November',
    shortName: 'Nov',
    seasonSummary: 'Leaf-Fall Sanitation & Crown Insulation',
    typicalHadstonTempC: '3°C to 8.5°C (Soil 6cm: 6.1°C)',
    week1To2: {
      wateringAndSoilCare:
        'Ensure all patio saucers are removed from beneath Lemon Cypress (#2), Cordyline (#17), and Skimmia (#10) containers.',
      feedingAndMulching:
        'Mound 10cm of weathered bark or dry bracken over the crowns of border Fuchsia (#3) and Purple Top Verbena (#23).',
      pruningAndDeadheading:
        'Clear all yellow, collapsing Hosta (#19) leaves completely from the crown and bin them so slugs cannot overwinter in the decaying foliage.',
      pestDiseaseAndFrost:
        'Ring dormant Hosta (#19) crowns with a 2cm barrier of sharp grit or crushed shells after clearing foliage.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Check tree stakes and soft rubber ties on Crabapple (#12), Flowering Cherry (#15), and standard Dappled Willow (#18) before winter storms.',
      feedingAndMulching:
        'Leave fallen Bamboo (#11) leaves undisturbed around the clump base to supply silica and insulate rhizomes.',
      pruningAndDeadheading:
        'Leave Scaly Male Fern (#6) and Soft Shield Fern (#8) fronds intact over the winter crown.',
      pestDiseaseAndFrost:
        'Tie up the sword leaves of Cabbage Palm / Cordyline (#17) with soft twine before temperatures drop below -3°C to keep freezing rain out of the central spear.'
    }
  },
  {
    monthIndex: 11,
    monthName: 'December',
    shortName: 'Dec',
    seasonSummary: 'Winter Solstice Protection & Structural Inspection',
    typicalHadstonTempC: '1.5°C to 6.5°C (Soil 6cm: 3.6°C)',
    week1To2: {
      wateringAndSoilCare:
        'Stay off saturated or frozen heavy clay borders and lawns. Check that gutter downpipes are not overflowing onto border roots.',
      feedingAndMulching:
        'No feeding. Check that bark mulch around Camellia (#26) and Hydrangeas (#7, #24, #28) has not been scattered by blackbirds.',
      pruningAndDeadheading:
        'No pruning required—enjoy winter berries on Crabapple (#12) and crimson flower buds on Skimmia (#10) and Camellia (#26).',
      pestDiseaseAndFrost:
        'Wrap Lemon Cypress (#2) and patio pots in hessian/bubble wrap around the container sides if a prolonged sub--5°C freeze hits.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Water evergreen Bamboo (#11) and Camellia (#26) in pots only during mild spells if dry winds have parched the root ball.',
      feedingAndMulching:
        'Inventory your fertilisers (Rose NPK 5-6-12, Ericaceous 14-8-16, Bone Meal 3.5-17-0, Sulphate of Potash 0-0-48, Vitax Q4) ready for spring.',
      pruningAndDeadheading:
        'Clean, sharpen, and sterilise secateurs and loppers with methylated spirits ahead of January Crabapple (#12) pruning.',
      pestDiseaseAndFrost:
        'Inspect overwintering cuttings of Mealycup Sage (#1) and Fuchsia (#3) under glass; pick off any yellowing lower leaves to prevent Botrytis grey mould.'
    }
  }
];

export const HADSTON_LOCAL_RISK_MITIGATION: LocalRiskMitigationProtocol[] = [
  {
    id: 'risk-01',
    hazardTitle: '1. Wet Winters & Heavy Clay Waterlogging',
    hadstonMicroclimateTrigger:
      'Heavy boulder clay holds >80% pore saturation from November to March when 48h rainfall exceeds 30mm, suffocating fine roots and rotting half-hardy crowns.',
    affectedPlants: [],
    actionableSteps: [
      'Never walk directly on wet clay borders between October and March—always work from timber staging boards.',
      'Remove all saucers from under patio pots in autumn and elevate containers on pot feet.',
      'Leave hollow perennial stems unpruned until spring so winter rain cannot channel down cut stems into the crown.',
      'Top-dress crowns of drainage-sensitive perennials with a 2cm ring of coarse horticultural grit in autumn.'
    ]
  },
  {
    id: 'risk-02',
    hazardTitle: '2. Late Spring Radiation Frosts & Rapid Morning Thaw',
    hadstonMicroclimateTrigger:
      'In RHS H4 zones, clear skies in late April and May frequently bring -1°C to -3°C ground frosts that blacken newly emerged buds.',
    affectedPlants: [],
    actionableSteps: [
      'Retain old flower heads on frost-sensitive shrubs until mid-to-late April to act as natural frost protection over new buds.',
      'Shield early-flowering shrubs from direct early morning sun after frost—rapid thawing of frozen buds ruptures petal cells.',
      'Delay cutting back tender perennials until late April or May when green basal shoots are actively breaking.',
      'Drape 30gsm horticultural fleece over tender plants whenever night temperatures drop to <= 2.0°C.'
    ]
  },
  {
    id: 'risk-03',
    hazardTitle: '3. Strong Gales & Wind-Rock on Wet Clay',
    hadstonMicroclimateTrigger:
      'Exposed plots experience cold easterly winds and 25–45 mph autumn/winter gusts that rock tall shrubs, opening water-filled sockets around root collars.',
    affectedPlants: [],
    actionableSteps: [
      'Shorten tall whippy stems on shrubs by one-third in late autumn to reduce wind sail, then complete precision pruning in spring.',
      'Firm the soil collar around tall stems after autumn gales and top-fill any stem sockets with gritty compost.',
      'Shelter tender evergreen containers against a warm wall out of freezing easterlies.',
      'Check stakes and soft rubber ties ahead of forecasted gales >= 25 mph.'
    ]
  },
  {
    id: 'risk-04',
    hazardTitle: '4. Fungal Spore Pressure & Heavy Clay Slug Populations',
    hadstonMicroclimateTrigger:
      'Cool, humid summers and moisture-retentive clay favour fungal leaf spots, botrytis, and keeled slugs.',
    affectedPlants: [],
    actionableSteps: [
      'Prune stone-fruit and silver-leaf-susceptible trees only in midsummer (June to July) when active sap seals wounds.',
      'Clear collapsing or diseased foliage in autumn and bin (never compost) to eliminate overwintering fungal spores and slug eggs.',
      'Maintain good airflow through border canopies and water at soil level in the morning.',
      'Use sharp grit or organic ferric phosphate barriers around emerging spring shoots.'
    ]
  }
];

export function getDynamicRiskMitigation(
  plantInventory: Array<any> = []
): LocalRiskMitigationProtocol[] {
  const safeInventory = Array.isArray(plantInventory) ? plantInventory : [];
  if (safeInventory.length === 0) {
    return [];
  }

  const cleanName = (n: string) => String(n || '').replace(/^#\d+\s+/, '').trim();
  const allNames = safeInventory.map((p) => cleanName(p.commonName || p.name));
  const tenderNames = safeInventory
    .filter((p) => ['H1a', 'H1b', 'H1c', 'H2', 'H3', 'H4'].includes(String(p.rhsRating || 'H4')))
    .map((p) => cleanName(p.commonName || p.name));
  const windNames = safeInventory
    .filter((p) => {
      const blob = `${p.category || ''} ${p.location || ''} ${(p.vulnerabilities || []).join(' ')}`.toLowerCase();
      return blob.includes('shrub') || blob.includes('wind') || blob.includes('exposed') || blob.includes('stake');
    })
    .map((p) => cleanName(p.commonName || p.name));

  return HADSTON_LOCAL_RISK_MITIGATION.map((risk, idx) => {
    const affected =
      idx === 0 || idx === 1
        ? tenderNames.length > 0
          ? tenderNames
          : allNames
        : idx === 2
        ? windNames.length > 0
          ? windNames
          : allNames
        : allNames;
    return {
      ...risk,
      affectedPlants: affected
    };
  });
}

const CATALOG_LOOKUP_BY_ID = new Map<string, RhsCatalogPlant>();
const CATALOG_LOOKUP_BY_NAME = new Map<string, RhsCatalogPlant>();
for (const cp of RHS_PLANT_CATALOG) {
  CATALOG_LOOKUP_BY_ID.set(cp.catalogId.toLowerCase(), cp);
  CATALOG_LOOKUP_BY_NAME.set(cp.name.toLowerCase(), cp);
  CATALOG_LOOKUP_BY_NAME.set(cp.name.replace(/^#\d+\s+/, '').toLowerCase(), cp);
  if (cp.commonName) {
    CATALOG_LOOKUP_BY_NAME.set(cp.commonName.toLowerCase(), cp);
  }
}

function matchInventoryPlantToCatalog(plant: any): RhsCatalogPlant | null {
  if (!plant) return null;
  if (plant.id) {
    const byId = CATALOG_LOOKUP_BY_ID.get(String(plant.id).toLowerCase());
    if (byId) return byId;
  }
  const rawName = String(plant.name || '').trim();
  const cleanName = rawName.replace(/^#\d+\s+/, '').toLowerCase();
  return (
    CATALOG_LOOKUP_BY_NAME.get(rawName.toLowerCase()) ||
    CATALOG_LOOKUP_BY_NAME.get(cleanName) ||
    null
  );
}

/**
 * Generates the structured 5-Section Markdown Master Guide strictly from the user's selected plants in `plantInventory`.
 */
export function generateHadstonMasterGuideMarkdown(
  locationName: string = 'My Garden Plot',
  plantInventory: Array<any> = []
): string {
  const safeInventory = Array.isArray(plantInventory) ? plantInventory : [];
  const lines: string[] = [
    `# ${locationName} — Master Horticulturist Garden Guide`,
    `**Location:** ${locationName} (Hardiness Zone UK 8b / RHS H4–H5)`,
    '**Soil & Microclimate:** Heavy clay to alluvial loam (pH 6.0–6.8); last spring frost mid-to-late May.',
    '',
    '---',
    '',
    `## Section 1: Plant Inventory & Identification Summary (${safeInventory.length} Selected ${
      safeInventory.length === 1 ? 'Plant' : 'Plants'
    })`,
    ''
  ];

  if (safeInventory.length === 0) {
    lines.push('_No plants currently selected in My Garden Plants._', '');
  } else {
    lines.push(
      '| Plant Name | Botanical Name | RHS Zone | Soil & Sun Requirements | Location |',
      '| :--- | :--- | :--- | :--- | :--- |'
    );
    safeInventory.forEach((gp) => {
      const cat = matchInventoryPlantToCatalog(gp);
      const name = String(gp.commonName || gp.name || 'Garden Plant').replace(/^#\d+\s+/, '').trim();
      const bot = gp.botanicalName || cat?.botanicalName || '—';
      const rhs = gp.rhsRating || cat?.rhsRating || 'H4';
      const soil = gp.soilAndSun || cat?.soilAndSun || 'Fertile, well-drained soil';
      const loc = gp.location || cat?.recommendedLocation || 'Main Border';
      lines.push(`| **${name}** | *${bot}* | ${rhs} | ${soil} | ${loc} |`);
    });
    lines.push('');
  }

  lines.push('---', '', '## Section 2: Month-by-Month & Weekly Task Calendar (Jan–Dec)', '');
  for (let mIdx = 0; mIdx < 12; mIdx++) {
    const m = getDynamicFortnightlyCareSchedule(mIdx, safeInventory);
    lines.push(`### ${m.monthName} — ${m.seasonSummary} (${m.typicalHadstonTempC})`, '');
    lines.push('#### Week 1–2 Focus Tasks');
    lines.push(`1. **Watering & Soil Care:** ${m.week1To2.wateringAndSoilCare}`);
    lines.push(`2. **Feeding & Mulching:** ${m.week1To2.feedingAndMulching}`);
    lines.push(`3. **Pruning & Deadheading:** ${m.week1To2.pruningAndDeadheading}`);
    lines.push(`4. **Pest, Disease & Frost Protection:** ${m.week1To2.pestDiseaseAndFrost}`, '');
    lines.push('#### Week 3–4 Focus Tasks');
    lines.push(`1. **Watering & Soil Care:** ${m.week3To4.wateringAndSoilCare}`);
    lines.push(`2. **Feeding & Mulching:** ${m.week3To4.feedingAndMulching}`);
    lines.push(`3. **Pruning & Deadheading:** ${m.week3To4.pruningAndDeadheading}`);
    lines.push(`4. **Pest, Disease & Frost Protection:** ${m.week3To4.pestDiseaseAndFrost}`, '');
  }

  lines.push('---', '', '## Section 3: Specialized Feed & Nutrition Strategy', '');
  if (safeInventory.length === 0) {
    lines.push('_Select plants in My Garden Plants to view feeding strategies._', '');
  } else {
    lines.push('| Plant | Specific Feed Type & NPK Ratio | Application Window | Frequency & Method |');
    lines.push('| :--- | :--- | :--- | :--- |');
    safeInventory.forEach((gp) => {
      const cat = matchInventoryPlantToCatalog(gp);
      const name = String(gp.commonName || gp.name || 'Garden Plant').replace(/^#\d+\s+/, '').trim();
      lines.push(
        `| **${name}** | ${gp.feedTypeNpk || cat?.feedTypeNpk || 'Balanced organic feed'} | ${
          gp.feedWindowUk || cat?.feedWindowUk || 'March to July'
        } | ${gp.feedFrequencyDosage || cat?.feedFrequencyDosage || 'Monthly during active growth'} |`
      );
    });
    lines.push('');
  }

  lines.push('---', '', '## Section 4: Precision Pruning & Shaping Guide', '');
  if (safeInventory.length === 0) {
    lines.push('_Select plants in My Garden Plants to view pruning schedules._', '');
  } else {
    lines.push('| Plant | Optimal Month(s) | Pruning Type | Step-by-Step Technique | What to Avoid |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    safeInventory.forEach((gp) => {
      const cat = matchInventoryPlantToCatalog(gp);
      const name = String(gp.commonName || gp.name || 'Garden Plant').replace(/^#\d+\s+/, '').trim();
      lines.push(
        `| **${name}** | **${gp.pruneMonthsUk || cat?.pruneMonthsUk || 'Seasonal'}** | ${
          gp.pruneType || cat?.pruneType || 'Maintenance prune'
        } | ${((gp.pruneTechnique || cat?.pruneTechnique || 'Remove dead or crossing stems.') as string).replace(/\n/g, ' ')} | ${
          gp.pruneAvoid || cat?.pruneAvoid || 'Avoid pruning in hard frost.'
        } |`
      );
    });
    lines.push('');
  }

  lines.push('---', '', `## Section 5: Climate & Seasonal Risk Management (${locationName})`, '');
  const dynamicRisks = getDynamicRiskMitigation(safeInventory);
  if (dynamicRisks.length === 0) {
    lines.push('_Select plants in My Garden Plants to view plant-specific risk mitigation._', '');
  } else {
    dynamicRisks.forEach((r) => {
      lines.push(`### ${r.hazardTitle}`);
      lines.push(`- **Local Microclimate Trigger:** ${r.hadstonMicroclimateTrigger}`);
      lines.push(`- **Selected Plants Affected:** ${r.affectedPlants.join(', ')}`);
      r.actionableSteps.forEach((s) => lines.push(`  - ${s}`));
      lines.push('');
    });
  }

  return lines.join('\n');
}

const EMPTY_FORTNIGHT_PILLAR_MESSAGE =
  'No plants selected in My Garden Plants yet. Add plants on the Plants tab to generate care tasks for your garden.';

export const GENERAL_SEASONAL_FORTNIGHT_CALENDAR: MonthlyWeeklyCalendarEntry[] = [
  {
    monthIndex: 0,
    monthName: 'January',
    shortName: 'Jan',
    seasonSummary: 'Deep Winter Dormancy · Hard Frosts & Drainage Care',
    typicalHadstonTempC: '1°C to 6°C (Soil 6cm: 2.8°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 1,
    monthName: 'February',
    shortName: 'Feb',
    seasonSummary: 'Late Winter Awakening · Early Sap Rise & Soil Prep',
    typicalHadstonTempC: '1.5°C to 7°C (Soil 6cm: 3.4°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 2,
    monthName: 'March',
    shortName: 'Mar',
    seasonSummary: 'Early Spring Awakening · Structural Prune & Mulching',
    typicalHadstonTempC: '3°C to 9.5°C (Soil 6cm: 5.5°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 3,
    monthName: 'April',
    shortName: 'Apr',
    seasonSummary: 'Mid-Spring Growth Surge · Soil Warming & Frost Watch',
    typicalHadstonTempC: '4.5°C to 12°C (Soil 6cm: 8.2°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 4,
    monthName: 'May',
    shortName: 'May',
    seasonSummary: 'Late Spring Transition · Hardening Off & Canopy Growth',
    typicalHadstonTempC: '7°C to 14.5°C (Soil 6cm: 11.4°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 5,
    monthName: 'June',
    shortName: 'Jun',
    seasonSummary: 'Early Summer Peak · Moisture Retention & Deadheading',
    typicalHadstonTempC: '10°C to 17.5°C (Soil 6cm: 14.5°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 6,
    monthName: 'July',
    shortName: 'Jul',
    seasonSummary: 'Midsummer Bloom · Deep Soaking & Summer Pruning',
    typicalHadstonTempC: '12°C to 19.5°C (Soil 6cm: 16.5°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 7,
    monthName: 'August',
    shortName: 'Aug',
    seasonSummary: 'Late Summer Ripening · Potash Transition & Stop-Nitrogen Rule',
    typicalHadstonTempC: '12°C to 19°C (Soil 6cm: 16.0°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 8,
    monthName: 'September',
    shortName: 'Sep',
    seasonSummary: 'Early Autumn Prep · Perennial Division & Potash Hardening',
    typicalHadstonTempC: '9.5°C to 16°C (Soil 6cm: 12.8°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 9,
    monthName: 'October',
    shortName: 'Oct',
    seasonSummary: 'Mid-Autumn Frost Sentinel · Drainage & Wind-Rock Protection',
    typicalHadstonTempC: '6.5°C to 12.5°C (Soil 6cm: 9.1°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 10,
    monthName: 'November',
    shortName: 'Nov',
    seasonSummary: 'Late Autumn Overwintering · Winter Mulch & Drainage',
    typicalHadstonTempC: '3.5°C to 9°C (Soil 6cm: 5.8°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  },
  {
    monthIndex: 11,
    monthName: 'December',
    shortName: 'Dec',
    seasonSummary: 'Winter Solstice · Strict No-Tread Clay Policy & Dormant Care',
    typicalHadstonTempC: '1.5°C to 6.5°C (Soil 6cm: 3.5°C)',
    week1To2: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    },
    week3To4: {
      wateringAndSoilCare: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      feedingAndMulching: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pruningAndDeadheading: EMPTY_FORTNIGHT_PILLAR_MESSAGE,
      pestDiseaseAndFrost: EMPTY_FORTNIGHT_PILLAR_MESSAGE
    }
  }
];

/**
 * Dynamically builds the Fortnightly Care Schedule for a given month (0 = Jan .. 11 = Dec)
 * tailored strictly and exclusively to the plants currently in `plantInventory`.
 */
export function getDynamicFortnightlyCareSchedule(
  monthIndex: number,
  plantInventory: Array<any> = []
): MonthlyWeeklyCalendarEntry {
  const safeIdx = ((Math.floor(monthIndex) % 12) + 12) % 12;
  const baseMonth =
    GENERAL_SEASONAL_FORTNIGHT_CALENDAR[safeIdx] || GENERAL_SEASONAL_FORTNIGHT_CALENDAR[9];

  if (!Array.isArray(plantInventory) || plantInventory.length === 0) {
    return baseMonth;
  }

  const resolvedPlants = plantInventory.map((gp) => {
    const catalogMatch = matchInventoryPlantToCatalog(gp);
    const displayName =
      gp.commonName ||
      catalogMatch?.commonName ||
      String(gp.name || 'Garden Plant').replace(/^#\d+\s+/, '').trim();
    const rhsRating = gp.rhsRating || catalogMatch?.rhsRating || 'H4';
    const soilAndSun =
      gp.soilAndSun ||
      catalogMatch?.soilAndSun ||
      'Moist, well-drained border soil; avoid winter waterlogging.';
    const feedWindowUk = gp.feedWindowUk || catalogMatch?.feedWindowUk || 'March to July';
    const feedTypeNpk =
      gp.feedTypeNpk || catalogMatch?.feedTypeNpk || 'Balanced seasonal organic fertiliser';
    const feedFrequencyDosage =
      gp.feedFrequencyDosage ||
      catalogMatch?.feedFrequencyDosage ||
      'Apply according to active growth stage';
    const pruneMonthsUk =
      gp.pruneMonthsUk || catalogMatch?.pruneMonthsUk || 'Late winter or after flowering';
    const pruneTechnique =
      gp.pruneTechnique ||
      catalogMatch?.pruneTechnique ||
      'Remove dead, damaged, or crossing stems cleanly.';
    const pruneAvoid =
      gp.pruneAvoid || catalogMatch?.pruneAvoid || 'Avoid pruning during frost.';
    const overwinteringProtocol =
      gp.overwinteringProtocol ||
      catalogMatch?.overwinteringProtocol ||
      `RHS ${rhsRating}: Mulch crown zone and prevent winter waterlogging.`;
    const vulnerabilities =
      Array.isArray(gp.vulnerabilities) && gp.vulnerabilities.length > 0
        ? gp.vulnerabilities
        : catalogMatch?.vulnerabilities || [];

    const monthlyCare = getPlantMonthlyCareStatus(
      {
        id: catalogMatch?.catalogId || gp.id,
        catalogId: catalogMatch?.catalogId,
        name: gp.name || displayName,
        commonName: displayName,
        rhsRating,
        feedWindowUk,
        pruneMonthsUk
      },
      safeIdx
    );

    return {
      displayName,
      rhsRating,
      location: gp.location || 'Main Border',
      soilAndSun,
      feedWindowUk,
      feedTypeNpk,
      feedFrequencyDosage,
      pruneMonthsUk,
      pruneTechnique,
      pruneAvoid,
      overwinteringProtocol,
      vulnerabilities,
      monthlyCare
    };
  });

  const plantNamesList = resolvedPlants.map((p) => p.displayName);
  const feedDuePlants = resolvedPlants.filter((p) => p.monthlyCare.feedDue);
  const pruneDuePlants = resolvedPlants.filter((p) => p.monthlyCare.pruneDue);
  const protectionDuePlants = resolvedPlants.filter(
    (p) =>
      p.monthlyCare.winterProtectDue ||
      ['H1a', 'H1b', 'H1c', 'H2', 'H3'].includes(p.rhsRating)
  );
  const containerPlants = resolvedPlants.filter((p) =>
    /pot|container|courtyard|terracotta|patio/i.test(p.location)
  );

  // Build Weeks 1–2 and Weeks 3–4 Watering & Soil strictly from selected plants
  const week1Soil =
    containerPlants.length > 0
      ? `Check container drainage and moisture for ${containerPlants
          .slice(0, 4)
          .map((p) => `${p.displayName} (${p.location})`)
          .join(', ')}.`
      : `Monitor soil moisture and drainage around ${plantNamesList.slice(0, 4).join(', ')}.`;

  const week3Soil = `Soil & aspect requirements for your selected plants: ${resolvedPlants
    .slice(0, 3)
    .map((p) => `${p.displayName} (${p.soilAndSun})`)
    .join('; ')}.`;

  // Build Feeding & Mulch strictly from selected plants
  const week1Feed =
    feedDuePlants.length > 0
      ? feedDuePlants
          .slice(0, 3)
          .map((p) => `${p.displayName}: ${p.feedTypeNpk} (${p.feedFrequencyDosage}).`)
          .join(' ')
      : `No active feed due in ${baseMonth.monthName} for ${plantNamesList
          .slice(0, 4)
          .join(', ')} (scheduled feed windows: ${resolvedPlants
          .slice(0, 3)
          .map((p) => `${p.displayName}: ${p.feedWindowUk}`)
          .join('; ')}).`;

  const week3Feed =
    feedDuePlants.length > 3
      ? feedDuePlants
          .slice(3, 6)
          .map((p) => `${p.displayName}: ${p.feedTypeNpk}.`)
          .join(' ')
      : feedDuePlants.length > 0
      ? `Follow up feeding and mulch check for ${feedDuePlants
          .slice(0, 3)
          .map((p) => p.displayName)
          .join(', ')}.`
      : `Maintain organic mulch around ${plantNamesList.slice(0, 4).join(', ')}; withhold fertiliser outside active feeding windows.`;

  // Build Pruning strictly from selected plants
  const week1Prune =
    pruneDuePlants.length > 0
      ? pruneDuePlants
          .slice(0, 3)
          .map((p) => `${p.displayName} (${p.pruneMonthsUk}): ${p.pruneTechnique}`)
          .join(' ')
      : `No structural pruning due in ${baseMonth.monthName} for ${plantNamesList
          .slice(0, 4)
          .join(', ')} (optimal pruning windows: ${resolvedPlants
          .slice(0, 3)
          .map((p) => `${p.displayName}: ${p.pruneMonthsUk}`)
          .join('; ')}).`;

  const week3Prune =
    pruneDuePlants.length > 3
      ? pruneDuePlants
          .slice(3, 6)
          .map((p) => `${p.displayName}: ${p.pruneTechnique}`)
          .join(' ')
      : resolvedPlants
          .slice(0, 3)
          .map((p) => `${p.displayName} pruning note: ${p.pruneAvoid}`)
          .join(' ');

  // Build Frost & Pests strictly from selected plants
  const isColdSeason = [0, 1, 2, 3, 9, 10, 11].includes(safeIdx);
  const week1Frost =
    isColdSeason && protectionDuePlants.length > 0
      ? protectionDuePlants
          .slice(0, 3)
          .map((p) => `${p.displayName} (RHS ${p.rhsRating}): ${p.overwinteringProtocol}`)
          .join(' ')
      : resolvedPlants
          .slice(0, 3)
          .map(
            (p) =>
              `${p.displayName} (RHS ${p.rhsRating}): ${
                p.vulnerabilities.length > 0
                  ? `Watch for ${p.vulnerabilities.join(', ')}`
                  : p.overwinteringProtocol
              }.`
          )
          .join(' ');

  const week3Frost =
    isColdSeason && protectionDuePlants.length > 3
      ? protectionDuePlants
          .slice(3, 6)
          .map((p) => `${p.displayName} (RHS ${p.rhsRating}): ${p.overwinteringProtocol}`)
          .join(' ')
      : resolvedPlants
          .slice(0, 3)
          .map((p) => `${p.displayName}: ${p.overwinteringProtocol}`)
          .join(' ');

  return {
    ...baseMonth,
    week1To2: {
      wateringAndSoilCare: week1Soil,
      feedingAndMulching: week1Feed,
      pruningAndDeadheading: week1Prune,
      pestDiseaseAndFrost: week1Frost
    },
    week3To4: {
      wateringAndSoilCare: week3Soil,
      feedingAndMulching: week3Feed,
      pruningAndDeadheading: week3Prune,
      pestDiseaseAndFrost: week3Frost
    }
  };
}



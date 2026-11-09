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
    affectedPlants: [
      '#1 Mealycup Sage',
      '#2 Lemon Cypress',
      '#3 Fuchsia',
      '#9 Common Thyme',
      '#16 Peony',
      '#23 Purple Top Verbena',
      '#32 California Lilac (Ceanothus)'
    ],
    actionableSteps: [
      'Never walk directly on wet clay borders between October and March—always work from 2.4m timber staging boards.',
      'Remove all saucers from under patio pots in September and elevate containers on 3cm pot feet.',
      'Leave hollow stems of Mealycup Sage (#1), Fuchsia (#3), and Verbena bonariensis (#23) unpruned until late April/May so winter rain cannot channel down cut stems into the crown.',
      'Top-dress the collars of Common Thyme (#9), Verbena (#23), and Hosta (#19) with a 2cm ring of coarse horticultural grit in October.'
    ]
  },
  {
    id: 'risk-02',
    hazardTitle: '2. Late Spring Radiation Frosts (Up to 25 May) & Rapid Morning Thaw',
    hadstonMicroclimateTrigger:
      'In RHS H4 zones, clear skies in late April and May frequently bring -1°C to -3°C ground frosts that blacken newly emerged buds.',
    affectedPlants: [
      '#1 Mealycup Sage',
      '#3 Fuchsia',
      '#7 Variegated Hydrangea',
      '#19 Hosta',
      '#24 & #28 Bigleaf Hydrangea',
      '#26 Camellia japonica'
    ],
    actionableSteps: [
      'Retain papery old flower heads on all three Hydrangeas (#7, #24, #28) until mid-to-late April to act as natural frost umbrellas over the top green buds.',
      'Shield Camellia (#26) from direct East-facing early morning sun—rapid thawing of frozen flower buds ruptures petal cells and turns blooms brown.',
      'Delay cutting back Mealycup Sage (#1), Fuchsia (#3), and Verbena (#23) until late April or mid-May when green basal shoots are actively breaking.',
      'Drape a double layer of 30gsm horticultural fleece (supported on bamboo canes so it does not touch wet leaves) whenever May night temperatures drop to <= 2.0°C.'
    ]
  },
  {
    id: 'risk-03',
    hazardTitle: '3. Strong Gales & Wind-Rock on Wet Clay',
    hadstonMicroclimateTrigger:
      'Exposed gardens experience cold easterly winds and 25–45 mph autumn/winter westerly gusts that rock tall shrubs, opening water-filled sockets around root collars.',
    affectedPlants: [
      '#2 Lemon Cypress',
      '#5, #14 & #22 Roses',
      '#11 Bamboo (Fargesia)',
      '#17 Cabbage Palm (Cordyline)',
      '#18 Dappled Willow',
      '#31 Butterfly Bush (Buddleja)',
      '#32 California Lilac (Ceanothus)'
    ],
    actionableSteps: [
      'Perform a two-stage prune on Roses (#5, #14, #22) and Buddleja (#31): shorten tall whippy stems by one-third to one-half in late October to reduce wind sail, then complete the precision prune in March.',
      'Firm the soil collar around Roses and Buddleja after autumn gales and top-fill any stem sockets with gritty compost.',
      'Shelter Lemon Cypress (#2) and Ceanothus (#32) against a warm South- or West-facing wall out of freezing easterlies.',
      'Bundle and tie Cordyline (#17) sword leaves upright before winter storms so gales cannot kink the central growing spear.'
    ]
  },
  {
    id: 'risk-04',
    hazardTitle: '4. Fungal Spore Pressure & Heavy Clay Slug Populations',
    hadstonMicroclimateTrigger:
      'Cool, humid summers and moisture-retentive clay favour Rose Blackspot, Prunus Silver Leaf, Peony Botrytis, and keeled slugs.',
    affectedPlants: [
      '#5, #14 & #22 Roses',
      '#15 Flowering Cherry (Prunus)',
      '#16 Peony',
      '#19 Hosta',
      '#29 Clematis'
    ],
    actionableSteps: [
      'Prune Flowering Cherry (#15) ONLY in midsummer (mid-June to late July) when active sap seals wounds against Silver Leaf spores—never prune Prunus in autumn or winter.',
      'Cut Peony (#16) stems to 2cm in late October and clear Hosta (#19) yellow leaves in November; bin (never compost) both to eliminate Botrytis spores and overwintering slug eggs.',
      'Plant Clematis (#29) 5–7cm deeper than its nursery pot level so underground buds re-sprout if Clematis Wilt strikes.',
      'Apply monthly foliar seaweed sprays to Roses (#5, #14, #22) from May to July to thicken leaf cuticles against blackspot.'
    ]
  }
];

/**
 * Generates the complete, structured 5-Section Markdown Master Guide for download or copy.
 */
export function generateHadstonMasterGuideMarkdown(locationName: string = 'My Garden Plot'): string {
  const lines: string[] = [
    `# ${locationName} — Master Horticulturist Garden Guide`,
    `**Location:** ${locationName} (Hardiness Zone UK 8b / RHS H4–H5)`,
    '**Soil & Microclimate:** Heavy clay to alluvial loam (pH 6.0–6.8); last spring frost mid-to-late May.',
    '',
    '---',
    '',
    '## Section 1: Plant Inventory & Identification Summary (32 Specimens)',
    '',
    '| Photo Ref | Plant Name (Botanical & Common) | RHS Zone | Soil & Sun Requirements (pH & Light) | Key Characteristics & Native Environment |',
    '| :--- | :--- | :--- | :--- | :--- |'
  ];

  HADSTON_GARDEN_COLLECTION_32.forEach((p: RhsCatalogPlant) => {
    lines.push(
      `| **#${p.photoRef}** | **${p.commonName}** (*${p.botanicalName}*) | ${p.rhsRating} | ${p.soilAndSun} | ${p.characteristicsAndNative} |`
    );
  });

  lines.push('', '### Identification Disambiguation & Multi-Specimen Notes', '');
  HADSTON_GARDEN_COLLECTION_32.filter((p) => p.idDisambiguationNote).forEach((p) => {
    lines.push(`- **Photo Ref #${p.photoRef} (${p.commonName}):** ${p.idDisambiguationNote}`);
  });

  lines.push('', '---', '', '## Section 2: Month-by-Month & Weekly Task Calendar (Jan–Dec)', '');
  HADSTON_MONTH_BY_MONTH_WEEKLY_CALENDAR.forEach((m) => {
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
  });

  lines.push('---', '', '## Section 3: Specialized Feed & Nutrition Strategy', '');
  lines.push('| Photo Ref & Plant | Specific Feed Type & NPK Ratio | Application Window (UK NE) | Frequency, Dosage & Method |');
  lines.push('| :--- | :--- | :--- | :--- |');
  HADSTON_GARDEN_COLLECTION_32.forEach((p) => {
    lines.push(
      `| **#${p.photoRef} ${p.commonName}** | ${p.feedTypeNpk} | ${p.feedWindowUk} | ${p.feedFrequencyDosage} |`
    );
  });

  lines.push('', '---', '', '## Section 4: Precision Pruning & Shaping Guide', '');
  lines.push('| Photo Ref & Plant | Optimal Month(s) | Pruning Type | Step-by-Step Technique | What to Avoid |');
  lines.push('| :--- | :--- | :--- | :--- | :--- |');
  HADSTON_GARDEN_COLLECTION_32.forEach((p) => {
    lines.push(
      `| **#${p.photoRef} ${p.commonName}** | **${p.pruneMonthsUk}** | ${p.pruneType} | ${(p.pruneTechnique || '').replace(/\n/g, ' ')} | ${p.pruneAvoid} |`
    );
  });

  lines.push('', '---', '', `## Section 5: Climate & Seasonal Risk Management (${locationName})`, '');
  HADSTON_LOCAL_RISK_MITIGATION.forEach((r) => {
    lines.push(`### ${r.hazardTitle}`);
    lines.push(`- **Local Microclimate Trigger:** ${r.hadstonMicroclimateTrigger}`);
    lines.push(`- **Key Vulnerable Plants:** ${r.affectedPlants.join(', ')}`);
    r.actionableSteps.forEach((s) => lines.push(`  - ${s}`));
    lines.push('');
  });

  lines.push('### Plant-by-Plant Overwintering Protocol', '');
  HADSTON_GARDEN_COLLECTION_32.forEach((p) => {
    lines.push(`- **#${p.photoRef} ${p.commonName} (${p.rhsRating}):** ${p.overwinteringProtocol}`);
  });

  return lines.join('\n');
}

/**
 * Plant-agnostic seasonal baseline for all 12 UK months (used when no plants are selected
 * or when none of the selected plants have a specific task in a given pillar).
 */
export const GENERAL_SEASONAL_FORTNIGHT_CALENDAR: MonthlyWeeklyCalendarEntry[] = [
  {
    monthIndex: 0,
    monthName: 'January',
    shortName: 'Jan',
    seasonSummary: 'Deep Winter Dormancy · Hard Frosts & Drainage Care',
    typicalHadstonTempC: '1°C to 6°C (Soil 6cm: 2.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Keep off saturated heavy clay borders completely to prevent structural pan compaction. Check patio container drainage holes so winter rain cannot pool.',
      feedingAndMulching:
        'Zero nitrogen or liquid feeding while plants are dormant. Top up wind-blown organic bark mulch on exposed borders to 5cm depth.',
      pruningAndDeadheading:
        'Inspect dormant deciduous trees and shrubs on dry, frost-free afternoons for dead, rubbing, or storm-damaged branches.',
      pestDiseaseAndFrost:
        'Check winter fleece ties and brush heavy wet snow off evergreen foliage and garden netting before branches split.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Give overwintering patio pots under glass or porch shelter a sparing splash of tepid water at the root collar only if compost is bone-dry.',
      feedingAndMulching:
        'Spread a 5cm layer of well-rotted garden compost or manure over vacant clay beds on frosty mornings so freeze-thaw cycles break down clods.',
      pruningAndDeadheading:
        'Avoid pruning stone fruit trees or spring-flowering shrubs in deep winter. Clean and sharpen secateurs ahead of spring.',
      pestDiseaseAndFrost:
        'Inspect stored tender tubers and overwintering pots for grey mould (Botrytis) and ventilate cold frames on bright frost-free middays.'
    }
  },
  {
    monthIndex: 1,
    monthName: 'February',
    shortName: 'Feb',
    seasonSummary: 'Late Winter Awakening · Early Sap Rise & Soil Prep',
    typicalHadstonTempC: '1.5°C to 7°C (Soil 6cm: 3.4°C)',
    week1To2: {
      wateringAndSoilCare:
        'Water sheltered evergreen containers with collected rainwater if drying easterly winds desiccate the top compost layer.',
      feedingAndMulching:
        'Apply a light dressing of Sulphate of Potash (30g/m²) around established fruit and flowering shrubs to strengthen spring blossom buds.',
      pruningAndDeadheading:
        'Complete winter formative pruning of dormant pip fruit trees and late-flowering deciduous shrubs before buds swell.',
      pestDiseaseAndFrost:
        'Keep 30gsm horticultural fleece ready to drape over early-swelling flower buds when clear radiation frosts are forecast.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Place cloches or black polythene over spring vegetable and flower sowing beds to shed cold February rain and pre-warm heavy clay.',
      feedingAndMulching:
        'Top-dress established perennial borders with slow-release bone meal (40g/m²) and a fresh 5cm organic compost mulch.',
      pruningAndDeadheading:
        'Cut back late-summer flowering perennial stems and ornamental grasses before new basal shoots emerge.',
      pestDiseaseAndFrost:
        'Clear overwintering slugs and snails from beneath pot rims and cold frame ledges before mild spring nights arrive.'
    }
  },
  {
    monthIndex: 2,
    monthName: 'March',
    shortName: 'Mar',
    seasonSummary: 'Early Spring Awakening · Structural Prune & Mulching',
    typicalHadstonTempC: '3°C to 9.5°C (Soil 6cm: 5.5°C)',
    week1To2: {
      wateringAndSoilCare:
        'Check soil moisture around evergreen shrubs and newly planted perennials as spring winds increase transpiration.',
      feedingAndMulching:
        'Mulch cleared perennial beds with a 5–7cm blanket of well-rotted garden compost to lock in spring moisture and suppress annual weeds.',
      pruningAndDeadheading:
        'Clear remaining winter debris from herbaceous borders and trim back frost-damaged tips as new buds break.',
      pestDiseaseAndFrost:
        'Apply organic ferric phosphate or sharp grit barriers around emerging perennial crowns to deter early spring slugs.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Water newly mulched beds and spring containers thoroughly if late March is dry and breezy.',
      feedingAndMulching:
        'Apply a balanced spring slow-release fertiliser across established shrub and perennial borders as active root growth resumes.',
      pruningAndDeadheading:
        'Carry out main spring structural pruning on hardy shrubs and roses, cutting cleanly above outward-facing buds.',
      pestDiseaseAndFrost:
        'Protect newly emerging spring shoots and blossom from overnight radiation frosts with breathable fleece.'
    }
  },
  {
    monthIndex: 3,
    monthName: 'April',
    shortName: 'Apr',
    seasonSummary: 'Mid-Spring Growth Surge · Soil Warming & Frost Watch',
    typicalHadstonTempC: '4.5°C to 12°C (Soil 6cm: 8.2°C)',
    week1To2: {
      wateringAndSoilCare:
        'Lightly fork and crumble dry clay surface crusts using staging boards; avoid cultivating heavy clay immediately after heavy April showers.',
      feedingAndMulching:
        'Feed acid-loving and evergreen shrubs with ericaceous or balanced organic feed and top up bark mulch.',
      pruningAndDeadheading:
        'Trim frost-bitten tips on mophead shrubs and deadhead early spring bulbs while leaving foliage to die back naturally.',
      pestDiseaseAndFrost:
        'Monitor overnight temperatures closely and fleece tender young shoots whenever sub-2°C radiation frosts are forecast.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Water spring containers and newly planted border specimens deeply in the morning so foliage dries before nightfall.',
      feedingAndMulching:
        'Apply a foliar seaweed tonic or liquid balanced feed to established border plants to build resilient cell walls.',
      pruningAndDeadheading:
        'Prune early spring-flowering shrubs immediately after their blossom fades to encourage strong summer extension growth.',
      pestDiseaseAndFrost:
        'Inspect soft new shoot tips for early greenfly colonies and renew slug protection after spring rain.'
    }
  },
  {
    monthIndex: 4,
    monthName: 'May',
    shortName: 'May',
    seasonSummary: 'Late Spring Transition · Hardening Off & Canopy Growth',
    typicalHadstonTempC: '7°C to 14.5°C (Soil 6cm: 11.4°C)',
    week1To2: {
      wateringAndSoilCare:
        'Keep newly planted shrubs, perennials, and vegetable modules evenly moist as daytime temperatures rise.',
      feedingAndMulching:
        'Apply liquid seaweed or balanced organic feed fortnightly to rapidly expanding border foliage.',
      pruningAndDeadheading:
        'Pinch out growing tips of bushy perennials and tender bedding under glass to promote branching.',
      pestDiseaseAndFrost:
        'Harden off tender plants by opening cold frames by day and closing them at night until late May frost risk passes.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Transition tender patio pots outdoors once night temperatures stay reliably above 7°C and elevate pots on feet.',
      feedingAndMulching:
        'Top-dress summer flowering borders and vegetable rows with a balanced organic fertiliser.',
      pruningAndDeadheading:
        'Tie in climbing stems and stake tall herbaceous perennials before summer winds arrive.',
      pestDiseaseAndFrost:
        'Watch for late May ground frosts in low-lying pockets and check undersides of leaves for aphids and sawfly larvae.'
    }
  },
  {
    monthIndex: 5,
    monthName: 'June',
    shortName: 'Jun',
    seasonSummary: 'Early Summer Peak · Moisture Retention & Deadheading',
    typicalHadstonTempC: '10°C to 17.5°C (Soil 6cm: 14.5°C)',
    week1To2: {
      wateringAndSoilCare:
        'Water patio containers daily in warm weather and soak heavy clay borders deeply once a week rather than light daily sprinkling.',
      feedingAndMulching:
        'Switch flowering containers and fruiting crops to a high-potash liquid feed every 10–14 days.',
      pruningAndDeadheading:
        'Deadhead spent late-spring blooms and pinch out side-shoots on trained crops.',
      pestDiseaseAndFrost:
        'Maintain good airflow around dense border canopies to prevent powdery mildew during warm, humid spells.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Top up surface mulch around moisture-loving border plants after rain to prevent heavy clay shrinkage cracks.',
      feedingAndMulching:
        'Give repeat-flowering shrubs a mid-season feed after their first flush of blooms.',
      pruningAndDeadheading:
        'Cut back early-flowering perennials after blooming to encourage fresh basal foliage and a second flush.',
      pestDiseaseAndFrost:
        'Water at soil level in the morning rather than wetting foliage at dusk to deter fungal leaf spot and slugs.'
    }
  },
  {
    monthIndex: 6,
    monthName: 'July',
    shortName: 'Jul',
    seasonSummary: 'Midsummer Bloom · Deep Soaking & Summer Pruning',
    typicalHadstonTempC: '12°C to 19.5°C (Soil 6cm: 16.5°C)',
    week1To2: {
      wateringAndSoilCare:
        'Deliver deep 20L/m² root-zone soaks to border plants during dry spells and check container moisture morning and evening.',
      feedingAndMulching:
        'Continue weekly high-potash liquid feeding for patio containers, tomatoes, and repeat-flowering perennials.',
      pruningAndDeadheading:
        'Deadhead summer border flowers regularly to keep plants producing fresh buds rather than setting seed.',
      pestDiseaseAndFrost:
        'Monitor warm, humid spells for blight or mildew and remove any yellowing lower leaves promptly.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Loosen any baked surface crust lightly before watering so water penetrates to the clay subsoil rather than running off.',
      feedingAndMulching:
        'Complete final nitrogen-rich feeds for woody shrubs by late July so late-summer growth has time to harden before autumn.',
      pruningAndDeadheading:
        'Carry out summer pruning on trained fruit trees, wisteria laterals, and stone fruits while sap is active.',
      pestDiseaseAndFrost:
        'Keep bird netting and plant ties secure ahead of midsummer convective gusts.'
    }
  },
  {
    monthIndex: 7,
    monthName: 'August',
    shortName: 'Aug',
    seasonSummary: 'Late Summer Ripening · Potash Transition & Stop-Nitrogen Rule',
    typicalHadstonTempC: '12°C to 19°C (Soil 6cm: 16.0°C)',
    week1To2: {
      wateringAndSoilCare:
        'Maintain consistent root moisture for late-summer flowering perennials and autumn-fruiting crops.',
      feedingAndMulching:
        'Cease high-nitrogen feeds on permanent border shrubs so soft shoots lignify before autumn frosts.',
      pruningAndDeadheading:
        'Trim lavender and evergreen hedges after flowering, cutting back into green growth without cutting into old brown wood.',
      pestDiseaseAndFrost:
        'Collect and bin any fallen diseased leaves beneath shrubs to prevent fungal spores overwintering in the clay.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Flush container compost thoroughly with rainwater and sow hardy green manure on cleared vegetable beds.',
      feedingAndMulching:
        'Apply high-potash autumn feed only to late-flowering patio pots and developing fruit crops.',
      pruningAndDeadheading:
        'Deadhead late-summer blooms and thin out congested canes or stems to let August sunshine ripen wood.',
      pestDiseaseAndFrost:
        'Check stakes and ties on tall late-season perennials ahead of early autumn equinox winds.'
    }
  },
  {
    monthIndex: 8,
    monthName: 'September',
    shortName: 'Sep',
    seasonSummary: 'Early Autumn Prep · Perennial Division & Potash Hardening',
    typicalHadstonTempC: '9.5°C to 16°C (Soil 6cm: 12.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Reduce container watering frequency as nights lengthen and cultivate heavy clay borders while soil remains warm and friable.',
      feedingAndMulching:
        'Apply an autumn lawn and border potash dressing (0-0-48) to toughen cell walls and root systems for winter.',
      pruningAndDeadheading:
        'Lift and divide congested herbaceous perennials now while soil temperatures remain above 10°C.',
      pestDiseaseAndFrost:
        'Clean greenhouse glass and prepare horticultural fleece ahead of the first early autumn ground frosts.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Plant spring-flowering bulbs (daffodils, crocus, alliums) on a 2cm layer of sharp horticultural grit to prevent basal rot in clay.',
      feedingAndMulching:
        'Cease all liquid feeding of outdoor border plants. Top-dress newly divided perennials with leafmould.',
      pruningAndDeadheading:
        'Shorten top-heavy shrub roses and tall perennials by one-third to reduce winter wind-rock leverage in wet clay.',
      pestDiseaseAndFrost:
        'Bring the most tender H1c–H2 patio containers under glass or porch shelter before night temperatures dip below 5°C.'
    }
  },
  {
    monthIndex: 9,
    monthName: 'October',
    shortName: 'Oct',
    seasonSummary: 'Mid-Autumn Frost Sentinel · Drainage & Wind-Rock Protection',
    typicalHadstonTempC: '6.5°C to 12.5°C (Soil 6cm: 9.1°C)',
    week1To2: {
      wateringAndSoilCare:
        'Remove all watering saucers from beneath outdoor pots and raise containers onto pot feet so autumn rain drains freely.',
      feedingAndMulching:
        'Zero fertiliser applications. Spread a 5cm blanket of leafmould or composted bark around acid-loving and woodland plants.',
      pruningAndDeadheading:
        'Leave hollow perennial stems and seedheads standing for winter insect shelter and crown frost protection.',
      pestDiseaseAndFrost:
        'Monitor overnight frost alerts closely; move half-hardy patio pots into a frost-free porch or cold frame.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Rough-dig vacant heavy clay vegetable beds on a dry afternoon and lay timber staging boards along border paths.',
      feedingAndMulching:
        'Rake fallen autumn leaves off lawns and evergreen crowns to pack into leafmould bays.',
      pruningAndDeadheading:
        'Cut back disease-prone herbaceous stems (such as peonies) above ground level and bin foliage rather than composting.',
      pestDiseaseAndFrost:
        'Lift tender H3 tubers once foliage is blackened by the first air frost, or apply a 15cm dry insulating mulch under a rain cloche.'
    }
  },
  {
    monthIndex: 10,
    monthName: 'November',
    shortName: 'Nov',
    seasonSummary: 'Late Autumn Overwintering · Winter Mulch & Bare-Root Planting',
    typicalHadstonTempC: '3.5°C to 9°C (Soil 6cm: 5.8°C)',
    week1To2: {
      wateringAndSoilCare:
        'Ensure all outdoor containers sit on pot feet with clear drainage holes and avoid stepping on wet heavy clay borders.',
      feedingAndMulching:
        'Mound 8–10cm of weathered bark or dry compost over the crowns of borderline-hardy border perennials.',
      pruningAndDeadheading:
        'Clear collapsing, slimy perennial leaves from border crowns and bin them so slugs cannot overwinter in decaying foliage.',
      pestDiseaseAndFrost:
        'Wrap outdoor taps and insulate exposed courtyard containers with hessian or bubble wrap ahead of November frosts.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Plant tulip bulbs 15–20cm deep on a 3cm layer of sharp grit now that cold soil suppresses tulip fire fungus.',
      feedingAndMulching:
        'Dust planting pits with mycorrhizal fungi when planting bare-root hedging, roses, or fruit trees in non-waterlogged soil.',
      pruningAndDeadheading:
        'Wait until full leaf drop before carrying out formative winter pruning on dormant deciduous trees and shrubs.',
      pestDiseaseAndFrost:
        'Check tree stakes, rubber ties, and brassica netting ahead of late-autumn gales so stems do not rock in wet clay.'
    }
  },
  {
    monthIndex: 11,
    monthName: 'December',
    shortName: 'Dec',
    seasonSummary: 'Winter Solstice · Strict No-Tread Clay Policy & Dormant Care',
    typicalHadstonTempC: '1.5°C to 6.5°C (Soil 6cm: 3.5°C)',
    week1To2: {
      wateringAndSoilCare:
        'Enforce a strict no-tread policy on saturated clay borders; flush silt and fallen leaves from field drains and gutters.',
      feedingAndMulching:
        'Check winter mulch mounds after gales and replenish any bark or bracken blown off tender crowns.',
      pruningAndDeadheading:
        'Carry out formative pruning on fully dormant maples, birches, and deciduous trees on dry frost-free days.',
      pestDiseaseAndFrost:
        'Ensure double-layered 30gsm horticultural fleece is secured over vulnerable shrubs during sub-zero spells.'
    },
    week3To4: {
      wateringAndSoilCare:
        'Keep overwintering pots under glass almost dry, watering sparingly only when compost pulls away from the pot rim.',
      feedingAndMulching:
        'Plan next season’s crop rotation and order seed potatoes and organic soil conditioners.',
      pruningAndDeadheading:
        'Prune free-standing apple, pear, and currant bushes while dormant on crisp, frost-free afternoons.',
      pestDiseaseAndFrost:
        'Ventilate unheated greenhouses for 2 hours at midday on sunny winter days to purge damp air and deter Botrytis.'
    }
  }
];

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
 * Dynamically builds the Fortnightly Care Schedule for a given month (0 = Jan .. 11 = Dec)
 * tailored strictly to the plants currently in `plantInventory`.
 * - If `plantInventory` is empty, returns clean plant-agnostic seasonal care (never mentioning unselected plants).
 * - If `plantInventory` has plants, weaves their specific feeding, pruning, soil, and frost care into Weeks 1–2 and Weeks 3–4.
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
      catalogMatch?.commonName || String(gp.name || 'Garden Plant').replace(/^#\d+\s+/, '');
    const rhsRating = gp.rhsRating || catalogMatch?.rhsRating || 'H4';
    const monthlyCare = getPlantMonthlyCareStatus(
      {
        id: catalogMatch?.catalogId || gp.id,
        catalogId: catalogMatch?.catalogId,
        name: gp.name || displayName,
        commonName: displayName,
        rhsRating,
        feedWindowUk: catalogMatch?.feedWindowUk,
        pruneMonthsUk: catalogMatch?.pruneMonthsUk
      },
      safeIdx
    );

    return {
      displayName,
      rhsRating,
      location: gp.location || 'Main Border',
      catalogMatch,
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

  // Build Weeks 1–2 and Weeks 3–4 Watering & Soil tailored to user's plants
  const week1Soil =
    containerPlants.length > 0
      ? `Check drainage and moisture for your container plants (${containerPlants
          .slice(0, 4)
          .map((p) => p.displayName)
          .join(', ')}). ${baseMonth.week1To2.wateringAndSoilCare}`
      : `Monitor soil moisture around ${plantNamesList.slice(0, 4).join(', ')}. ${
          baseMonth.week1To2.wateringAndSoilCare
        }`;

  const week3Soil =
    resolvedPlants[0]?.catalogMatch?.soilAndSun
      ? `Maintain optimal soil conditions for ${resolvedPlants
          .slice(0, 3)
          .map((p) => `${p.displayName} (${p.catalogMatch?.soilAndSun})`)
          .join('; ')}.`
      : baseMonth.week3To4.wateringAndSoilCare;

  // Build Feeding & Mulch tailored strictly to user's plants
  const week1Feed =
    feedDuePlants.length > 0
      ? feedDuePlants
          .slice(0, 3)
          .map(
            (p) =>
              `${p.displayName}: ${
                p.catalogMatch?.feedTypeNpk || 'Apply balanced seasonal fertiliser'
              } (${p.catalogMatch?.feedFrequencyDosage || p.catalogMatch?.feedWindowUk || 'this month'}).`
          )
          .join(' ')
      : `No active liquid feed due for ${plantNamesList
          .slice(0, 3)
          .join(', ')} this fortnight. ${baseMonth.week1To2.feedingAndMulching}`;

  const week3Feed =
    feedDuePlants.length > 3
      ? feedDuePlants
          .slice(3, 6)
          .map(
            (p) =>
              `${p.displayName}: ${
                p.catalogMatch?.feedTypeNpk || 'Continue scheduled seasonal feed'
              }.`
          )
          .join(' ')
      : feedDuePlants.length > 0
      ? `Follow up feeding and mulch check for ${feedDuePlants
          .slice(0, 3)
          .map((p) => p.displayName)
          .join(', ')}. ${baseMonth.week3To4.feedingAndMulching}`
      : baseMonth.week3To4.feedingAndMulching;

  // Build Pruning tailored strictly to user's plants
  const week1Prune =
    pruneDuePlants.length > 0
      ? pruneDuePlants
          .slice(0, 2)
          .map(
            (p) =>
              `${p.displayName} (${p.catalogMatch?.pruneMonthsUk || 'Due now'}): ${
                p.catalogMatch?.pruneTechnique || 'Remove dead, damaged, or crossing stems.'
              }`
          )
          .join(' ')
      : `No structural pruning due for ${plantNamesList
          .slice(0, 3)
          .join(', ')} in Weeks 1–2. ${baseMonth.week1To2.pruningAndDeadheading}`;

  const week3Prune =
    pruneDuePlants.length > 2
      ? pruneDuePlants
          .slice(2, 4)
          .map(
            (p) =>
              `${p.displayName}: ${
                p.catalogMatch?.pruneTechnique || 'Complete seasonal pruning.'
              }`
          )
          .join(' ')
      : pruneDuePlants.length > 0
      ? pruneDuePlants
          .slice(0, 2)
          .map(
            (p) =>
              `${p.displayName} caution: ${
                p.catalogMatch?.pruneAvoid || 'Avoid pruning during frost.'
              }`
          )
          .join(' ')
      : baseMonth.week3To4.pruningAndDeadheading;

  // Build Frost & Pests tailored strictly to user's plants
  const isColdSeason = [0, 1, 2, 3, 9, 10, 11].includes(safeIdx);
  const week1Frost =
    isColdSeason && protectionDuePlants.length > 0
      ? protectionDuePlants
          .slice(0, 3)
          .map(
            (p) =>
              `${p.displayName} (RHS ${p.rhsRating}): ${
                p.catalogMatch?.overwinteringProtocol ||
                'Protect crown and roots from frost and winter wet.'
              }`
          )
          .join(' ')
      : `Inspect ${plantNamesList.slice(0, 3).join(', ')} for seasonal pests and weather stress. ${
          baseMonth.week1To2.pestDiseaseAndFrost
        }`;

  const week3Frost =
    isColdSeason && protectionDuePlants.length > 3
      ? protectionDuePlants
          .slice(3, 6)
          .map(
            (p) =>
              `${p.displayName} (RHS ${p.rhsRating}): ${
                p.catalogMatch?.overwinteringProtocol || 'Maintain winter protection.'
              }`
          )
          .join(' ')
      : baseMonth.week3To4.pestDiseaseAndFrost;

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


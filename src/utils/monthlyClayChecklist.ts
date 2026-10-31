/**
 * Monthly RHS-Appropriate Gardening Checklist for Heavy Clay Soils in the UK
 * Calibrated for RHS Zone H4–H5 (pH 6.0-6.8 heavy clay to alluvial loam).
 */

export interface MonthlyClayTask {
  id: string;
  monthIndex: number; // 0 = January ... 9 = October ... 11 = December
  title: string;
  category: 'SOIL_CARE' | 'PROTECTION' | 'SOWING_PLANTING' | 'PRUNING' | 'PEST_DISEASE';
  priority: 'ESSENTIAL' | 'RECOMMENDED' | 'TIMELY';
  rhsGuidance: string;
  claySoilTip: string;
  targetWindowUk: string;
}

export interface MonthClayProfile {
  monthIndex: number;
  monthName: string;
  shortName: string;
  seasonLabel: string;
  typicalSoilTemp6cmC: string;
  clayWorkabilityStatus: string;
  northEastAdjustmentNote: string;
  tasks: MonthlyClayTask[];
}

export const MONTHLY_CLAY_PROFILES: MonthClayProfile[] = [
  {
    monthIndex: 0,
    monthName: 'January',
    shortName: 'Jan',
    seasonLabel: 'Deep Winter Dormancy',
    typicalSoilTemp6cmC: '2.0°C – 3.5°C',
    clayWorkabilityStatus: 'Saturated / Frozen — Keep Off Borders',
    northEastAdjustmentNote: 'Ground remains frozen or waterlogged in low-lying frost pockets; restrict foot traffic to timber duckboards.',
    tasks: [
      {
        id: 'jan-01',
        monthIndex: 0,
        title: 'Inspect Stored Dahlia Tubers & Begonia Corms for Botrytis Rot',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Check overwintered H3 tubers stored in frost-free sheds. Cut away any soft, mouldy lesions back to healthy white tissue and dust with yellow sulphur or charcoal.',
        claySoilTip: 'Tubers lifted from heavy clay often retain damp soil collars that harbour grey mould in mid-winter.',
        targetWindowUk: 'Early to Mid January'
      },
      {
        id: 'jan-02',
        monthIndex: 0,
        title: 'Brush Heavy Wet Snow Off Evergreen Shrubs & Brassica Netting',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Use a soft broom to dislodge wet North Sea snow before branches split on Japanese Maples (Acer palmatum) or flatten overwintering Purple Sprouting Broccoli cages.',
        claySoilTip: 'Use staging planks along path edges so you do not compact saturated clay root zones while reaching shrubs.',
        targetWindowUk: 'During Snow Events'
      },
      {
        id: 'jan-03',
        monthIndex: 0,
        title: 'Winter-Prune Free-Standing Apple & Pear Trees on Dry Frost-Free Days',
        category: 'PRUNING',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Remove crossing, rubbing, and dead branches to create an open goblet crown that promotes airflow against apple scab and canker.',
        claySoilTip: 'Trees on heavy clay are prone to canker in poorly drained soil; disinfect secateurs between cuts and mulch with composted bark.',
        targetWindowUk: 'Mid to Late January'
      },
      {
        id: 'jan-04',
        monthIndex: 0,
        title: 'Spread Well-Rotted Farmyard Manure Over Vacant Clay Allotment Beds',
        category: 'SOIL_CARE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Lay a 5–8cm surface blanket of well-rotted manure or garden compost over bare plots without digging it in, allowing winter frosts and earthworms to incorporate it.',
        claySoilTip: 'Frost heave (freeze-thaw cycles) breaks down heavy clay clods naturally into a fine spring tilth without mechanical rotavating.',
        targetWindowUk: 'On Frozen Mornings Only'
      }
    ]
  },
  {
    monthIndex: 1,
    monthName: 'February',
    shortName: 'Feb',
    seasonLabel: 'Late Winter Chitting & Prep',
    typicalSoilTemp6cmC: '2.5°C – 4.5°C',
    clayWorkabilityStatus: 'Cold & Sticky — Pre-Warm Under Cloches',
    northEastAdjustmentNote: 'Wait 2–3 weeks longer than Southern gardeners before outdoor sowing; start chitting potatoes indoors on a bright frost-free sill.',
    tasks: [
      {
        id: 'feb-01',
        monthIndex: 1,
        title: 'Chit First-Early & Second-Early Seed Potatoes Indoors',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Stand tubers rose-end up in egg boxes in a cool (7–10°C), bright room so sturdy, dark green 2cm shoots form before spring planting.',
        claySoilTip: 'Choose slug-resistant, scab-tolerant RHS AGM cultivars such as "Charlotte" or "Kestrel" suited to moisture-retentive clay.',
        targetWindowUk: 'Mid February'
      },
      {
        id: 'feb-02',
        monthIndex: 1,
        title: 'Place Polycarbonate Cloches or Black Polythene Over Spring Sowing Beds',
        category: 'SOIL_CARE',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Cover future carrot, parsnip, and broad bean rows with cloches 3–4 weeks ahead of sowing to shed cold February rain and raise soil temperature by 2–3°C.',
        claySoilTip: 'Heavy clay holds winter water in micropores, requiring far more solar energy to warm up than sandy southern soils.',
        targetWindowUk: 'Late February'
      },
      {
        id: 'feb-03',
        monthIndex: 1,
        title: 'Prune Group 3 Late-Flowering Clematis & Autumn Raspberry Canes',
        category: 'PRUNING',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Cut Group 3 clematis stems down to the lowest pair of strong buds (30cm above ground) and cut all fruited autumn raspberry canes to ground level.',
        claySoilTip: 'Top-dress around crowns with a handful of blood, fish and bone plus a 5cm compost mulch to prevent clay crusting.',
        targetWindowUk: 'Late February'
      },
      {
        id: 'feb-04',
        monthIndex: 1,
        title: 'Test Clay Soil pH & Apply Garden Lime to Future Brassica Beds',
        category: 'SOIL_CARE',
        priority: 'TIMELY',
        rhsGuidance: 'Check allotment bed pH. If below 6.8, apply ground limestone at 250–400g/m² to raise pH toward 7.0–7.2 ahead of May brassica transplanting.',
        claySoilTip: 'Calcium ions flocculate heavy clay particles into stable crumbs while suppressing clubroot spores in wet soil.',
        targetWindowUk: 'Mid to Late February'
      }
    ]
  },
  {
    monthIndex: 2,
    monthName: 'March',
    shortName: 'Mar',
    seasonLabel: 'Early Spring Awakening',
    typicalSoilTemp6cmC: '4.5°C – 6.8°C',
    clayWorkabilityStatus: 'Drying Surface / Wet Subsoil — Fork Lightly',
    northEastAdjustmentNote: 'Only sow outdoors once weed seedlings germinate naturally; start tender crops in modules under glass rather than open clay.',
    tasks: [
      {
        id: 'mar-01',
        monthIndex: 2,
        title: 'Sow Broad Beans, Peas & Hardy Brassicas in Deep Rootrainers Under Glass',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Sow in deep modular trays in an unheated greenhouse or cold frame rather than directly into cold, wet clay where seeds rot.',
        claySoilTip: 'Module-raised transplants establish vigorous root balls that resist slug grazing and cold clay impedance when planted out in April.',
        targetWindowUk: 'Early to Mid March'
      },
      {
        id: 'mar-02',
        monthIndex: 2,
        title: 'Harvest Early Spears of Overwintered Purple Sprouting Broccoli',
        category: 'SOWING_PLANTING',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Snap off central spears before flower buds open yellow to encourage prolific side-shoot production through April.',
        claySoilTip: 'Give plants a high-nitrogen top-dressing (sulphate of ammonia at 35g/m²) as cold clay limits early spring nitrogen mineralization.',
        targetWindowUk: 'Throughout March'
      },
      {
        id: 'mar-03',
        monthIndex: 2,
        title: 'Prune Bush & Climbing Roses as Forsythia Begins to Flower',
        category: 'PRUNING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Prune hybrid tea and floribunda roses in mid-to-late March to prevent frost dieback on newly stimulated buds.',
        claySoilTip: 'Roses thrive in nutrient-rich heavy clay; mulch immediately after pruning with 7cm of well-rotted manure.',
        targetWindowUk: 'Mid to Late March'
      },
      {
        id: 'mar-04',
        monthIndex: 2,
        title: 'Install Copper Tape & Organic Ferric Phosphate Slug Barriers',
        category: 'PEST_DISEASE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Protect emerging delphiniums, hostas, and lupins before mild damp nights trigger peak keeled slug activity.',
        claySoilTip: 'Heavy clay cracks and clods offer ideal daytime refuges for subterranean keeled slugs.',
        targetWindowUk: 'Late March'
      }
    ]
  },
  {
    monthIndex: 3,
    monthName: 'April',
    shortName: 'Apr',
    seasonLabel: 'Northern Spring Planting Window',
    typicalSoilTemp6cmC: '7.0°C – 9.5°C',
    clayWorkabilityStatus: 'Friable Tilth on Dry Days — Avoid Working After Rain',
    northEastAdjustmentNote: 'Wait until mid-April when 6cm soil temperature reaches 7°C before planting first-early potatoes in heavy clay.',
    tasks: [
      {
        id: 'apr-01',
        monthIndex: 3,
        title: 'Plant Chitted First-Early & Second-Early Potatoes in Gritted Drills',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Set tubers 12cm deep and 30cm apart in trenches lined with garden compost so emerging haulms avoid early frosts until mid-May.',
        claySoilTip: 'Line the base of clay trenches with sharp horticultural grit and leafmould to improve tuber drainage and cleaner skin finish.',
        targetWindowUk: 'Mid April'
      },
      {
        id: 'apr-02',
        monthIndex: 3,
        title: 'Pot Up Overwintered Dahlia Tubers Under Glass to Start Shooting',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Start "Bishop of Llandaff" tubers in multi-purpose compost mixed with 20% perlite in a frost-free greenhouse, ready for planting out after 20 May.',
        claySoilTip: 'Starting tubers in pots prevents cold April clay rain from rotting dormant crowns.',
        targetWindowUk: 'Early to Mid April'
      },
      {
        id: 'apr-03',
        monthIndex: 3,
        title: 'Protect Emerging Japanese Maple (Acer palmatum) Buds from Radiation Frosts',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Keep 30gsm horticultural fleece ready to drape over Acer palmatum "Bloodgood" whenever clear skies and sub-2°C nights are forecast.',
        claySoilTip: 'Moist, bare clay radiates heat slowly, but cold air pools in low-lying garden corners at dawn.',
        targetWindowUk: 'Throughout April'
      },
      {
        id: 'apr-04',
        monthIndex: 3,
        title: 'Hoe & Mulch Exposed Clay Borders Before Spring Sun Bakes a Crust',
        category: 'SOIL_CARE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Lightly Dutch-hoe annual weeds on a breezy dry day and apply 5cm of organic compost mulch to lock in spring moisture.',
        claySoilTip: 'Unmulched heavy clay rapidly transitions from sticky mud to brick-hard shrinkage cracks during dry easterly April winds.',
        targetWindowUk: 'Mid to Late April'
      }
    ]
  },
  {
    monthIndex: 4,
    monthName: 'May',
    shortName: 'May',
    seasonLabel: 'Last Spring Frost Transition',
    typicalSoilTemp6cmC: '10.0°C – 13.0°C',
    clayWorkabilityStatus: 'Optimal Spring Tilth — Prime Planting Month',
    northEastAdjustmentNote: 'Average last spring frost is mid-to-late May in cooler UK zones; do not plant tender H2/H3 crops outdoors hardened-off until late May.',
    tasks: [
      {
        id: 'may-01',
        monthIndex: 4,
        title: 'Earth Up Potato Haulms & Keep Fleece Ready Through 25 May',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Draw friable soil up over emerging potato shoots whenever they reach 20cm tall to shield foliage from late May radiation frosts.',
        claySoilTip: 'Break up clay clods with the back of a border fork before earthing up so light cannot reach developing tubers and turn them green.',
        targetWindowUk: 'Early to Late May'
      },
      {
        id: 'may-02',
        monthIndex: 4,
        title: 'Harden Off Dahlias, Courgettes & Runner Beans in a Cold Frame',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Acclimatize tender H2/H3 plants over 10–14 days by opening cold frame lids by day and closing them at night before planting out in the final week of May.',
        claySoilTip: 'Mix a bucket of grit and well-rotted compost into each planting hole in heavy clay borders to prevent root collar stagnation.',
        targetWindowUk: '10 – 25 May'
      },
      {
        id: 'may-03',
        monthIndex: 4,
        title: 'Transplant Winter Brassicas (Purple Sprouting Broccoli) into Firm Alkaline Clay',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Plant sturdy module-grown broccoli seedlings deeply and firm the soil vigorously with your heel, spacing 60cm apart under fine mesh netting.',
        claySoilTip: 'Brassicas love firm, heavy clay—loose soil leads to wind-rock and poor buttoning.',
        targetWindowUk: 'Mid to Late May'
      },
      {
        id: 'may-04',
        monthIndex: 4,
        title: 'Move Patio Citrus (Meyer Lemon) Outdoors to a Sunny Sheltered Terrace',
        category: 'PROTECTION',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Once night temperatures reliably stay above 7°C in late May, move terracotta citrus pots outside and switch to high-nitrogen summer citrus feed.',
        claySoilTip: 'Elevate terracotta pots on feet so summer downpours drain freely.',
        targetWindowUk: 'Late May'
      }
    ]
  },
  {
    monthIndex: 5,
    monthName: 'June',
    shortName: 'Jun',
    seasonLabel: 'Midsummer Growth & Moisture Retention',
    typicalSoilTemp6cmC: '13.5°C – 16.0°C',
    clayWorkabilityStatus: 'Firm — Mulch Against Surface Fissures',
    northEastAdjustmentNote: 'Long northern daylight hours (17+ hours at 55°N) drive rapid vegetative growth once clay warms.',
    tasks: [
      {
        id: 'jun-01',
        monthIndex: 5,
        title: 'Pinch Out Dahlia Growing Tips & Stake Tall Stems',
        category: 'PRUNING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Pinch out the main central shoot of young Dahlias above the 4th pair of leaves to promote bushy, multi-stemmed flowering.',
        claySoilTip: 'Drive stout bamboo canes or metal supports into clay now while moist; driving stakes in baked July clay damages tubers.',
        targetWindowUk: 'Early to Mid June'
      },
      {
        id: 'jun-02',
        monthIndex: 5,
        title: 'Apply Deep Mulch Around Moisture-Loving Shrubs & Fruit Bushes',
        category: 'SOIL_CARE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Spread grass clippings (thin layers) or composted bark around crops after rain to prevent clay shrinkage cracks.',
        claySoilTip: 'Deep cracks in unmulched clay shear fibrous feeder roots and funnel water straight past the root zone.',
        targetWindowUk: 'Throughout June'
      },
      {
        id: 'jun-03',
        monthIndex: 5,
        title: 'Monitor Humidity & Temperature for Early Potato/Tomato Blight Periods',
        category: 'PEST_DISEASE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Watch for Hutton Criteria (2 consecutive days with min temp >= 10°C and >= 6 hours of relative humidity >= 90%) and water crops at soil level in the morning.',
        claySoilTip: 'Heavy clay retains surface dampness overnight, raising canopy humidity in sheltered borders.',
        targetWindowUk: 'Mid to Late June'
      }
    ]
  },
  {
    monthIndex: 6,
    monthName: 'July',
    shortName: 'Jul',
    seasonLabel: 'Peak Summer Canopy & Crack Prevention',
    typicalSoilTemp6cmC: '15.5°C – 18.0°C',
    clayWorkabilityStatus: 'Hard Baked Crust if Unmulched — Deep Soak Only',
    northEastAdjustmentNote: 'Sea frets (coastalhaar) from the North Sea can spike humidity rapidly even during warm weeks.',
    tasks: [
      {
        id: 'jul-01',
        monthIndex: 6,
        title: 'Deep-Water Clay Borders Infrequently Rather Than Light Daily Sprinkling',
        category: 'SOIL_CARE',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Deliver 20 litres/m² once a week directly to the base of plants rather than frequent light watering, encouraging roots to delve deep into cool clay subsoil.',
        claySoilTip: 'Heavy clay holds huge reserves of plant-available water at 20–30cm depth if surface evaporation is blocked by mulch.',
        targetWindowUk: 'Throughout July'
      },
      {
        id: 'jul-02',
        monthIndex: 6,
        title: 'Summer-Prune Trained Fruit Trees & Wisteria Lateral Shoots',
        category: 'PRUNING',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Shorten whippy current-season wisteria shoots to 5–6 buds and prune cordon/espalier apple laterals in late July.',
        claySoilTip: 'Summer pruning checks excessive vegetative vigour caused by fertile clay soils and ripens fruiting spurs.',
        targetWindowUk: 'Late July'
      },
      {
        id: 'jul-03',
        monthIndex: 6,
        title: 'Deadhead Dahlias & Feed Weekly with High-Potash Liquid Tomato Fertiliser',
        category: 'SOWING_PLANTING',
        priority: 'TIMELY',
        rhsGuidance: 'Remove spent flower heads (cutting back to a leaf node) to keep "Bishop of Llandaff" producing blooms until October.',
        claySoilTip: 'Potash strengthens cell walls and tuber starch storage ahead of autumn.',
        targetWindowUk: 'Weekly in July'
      }
    ]
  },
  {
    monthIndex: 7,
    monthName: 'August',
    shortName: 'Aug',
    seasonLabel: 'Late Summer Harvest & Green Manuring',
    typicalSoilTemp6cmC: '15.0°C – 17.0°C',
    clayWorkabilityStatus: 'Warm & Receptive to Green Manure Sowing',
    northEastAdjustmentNote: 'Sow winter green manures by late August while soil is still warm enough for rapid germination.',
    tasks: [
      {
        id: 'aug-01',
        monthIndex: 7,
        title: 'Sow Grazing Rye, Field Beans or Phacelia on Cleared Potato & Onion Beds',
        category: 'SOIL_CARE',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Broadcast hardy green manure seed over bare allotment soil as soon as second-early potatoes are lifted.',
        claySoilTip: 'Dense fibrous roots of Hungarian grazing rye and deep taproots of field beans open drainage channels in heavy clay and prevent winter nitrogen leaching.',
        targetWindowUk: 'Mid to Late August'
      },
      {
        id: 'aug-02',
        monthIndex: 7,
        title: 'Switch Patio Citrus (Meyer Lemon) to High-Potash Autumn Feed',
        category: 'SOIL_CARE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Transition from summer nitrogen feed to autumn/winter citrus feed to ripen developing lemons and harden sappy shoots before autumn.',
        claySoilTip: 'Flush container compost once in August to prevent salt accumulation.',
        targetWindowUk: 'Mid August'
      },
      {
        id: 'aug-03',
        monthIndex: 7,
        title: 'Firm Soil & Check Netting Around Growing Purple Sprouting Broccoli',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Ensure wood-pigeon and cabbage white butterfly netting is raised on taller canes as brassica canopies reach full height.',
        claySoilTip: 'August thunder-showers soften clay around stems; heel in firmly before autumn gales arrive.',
        targetWindowUk: 'Late August'
      }
    ]
  },
  {
    monthIndex: 8,
    monthName: 'September',
    shortName: 'Sep',
    seasonLabel: 'Early Autumn Preparation & Bulb Planting',
    typicalSoilTemp6cmC: '11.5°C – 14.0°C',
    clayWorkabilityStatus: 'Moist & Warm — Cultivate Before Autumn Rains Set In',
    northEastAdjustmentNote: 'Complete heavy clay cultivation and perennial division in September while soil is still warm and friable—October rains quickly make clay unworkable.',
    tasks: [
      {
        id: 'sep-01',
        monthIndex: 8,
        title: 'Divide Congested Herbaceous Perennials While Clay Remains Warm',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Lift and divide clumps of hardy geraniums, hostas, and irises now so new roots establish before soil temperature drops below 7°C.',
        claySoilTip: 'In heavy clay, autumn division in September succeeds far better than November when wet clay rots cut crowns.',
        targetWindowUk: 'Early to Mid September'
      },
      {
        id: 'sep-02',
        monthIndex: 8,
        title: 'Plant Narcissus & Spring Bulbs with Sharp Horticultural Grit in Clay Holes',
        category: 'SOWING_PLANTING',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Plant daffodils at 3 times their bulb depth, placing a 2cm layer of coarse horticultural grit beneath each bulb.',
        claySoilTip: 'Grit prevents water pooling around the basal plate in heavy clay during wet winters.',
        targetWindowUk: 'Mid to Late September'
      },
      {
        id: 'sep-03',
        monthIndex: 8,
        title: 'Prepare Frost Fleece & Clean Glasshouse Panes Ahead of October',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Wash algae off greenhouse glass to maximize low autumn light and stage pot feet for incoming tender plants.',
        claySoilTip: 'Low-lying valley ground frosts can strike from late September onward on clear, calm nights.',
        targetWindowUk: 'Late September'
      }
    ]
  },
  {
    monthIndex: 9,
    monthName: 'October',
    shortName: 'Oct',
    seasonLabel: 'Autumn Frost Sentinel & Clay Drainage Protection',
    typicalSoilTemp6cmC: '7.0°C – 10.0°C',
    clayWorkabilityStatus: 'Near Field Capacity — Avoid Compaction After 30mm+ Rain',
    northEastAdjustmentNote: 'First air frost typically arrives in October. Heavy clay rapidly approaches saturation—prioritize drainage, staking, and lifting tender tubers.',
    tasks: [
      {
        id: 'oct-01',
        monthIndex: 9,
        title: "Lift or Fleece Dahlia 'Bishop of Llandaff' Tubers After First Blackening Frost",
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Once air frost blackens foliage, cut hollow stems to 15cm, carefully fork up tubers from the clay border, stand upside-down for 7 days to drain stems, and store in dry grit/compost at 5°C.',
        claySoilTip: 'Never leave H3 Dahlia tubers overwintering in flat, unraised heavy clay—saturated winter clay freezes solid and rots tubers.',
        targetWindowUk: 'Mid to Late October'
      },
      {
        id: 'oct-02',
        monthIndex: 9,
        title: "Stake & Earth Up Purple Sprouting Broccoli 'Rudolph' Against Autumn Wind-Rock",
        category: 'SOIL_CARE',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Draw 10cm of soil up around lower brassica stems, firm the collar with your boot, and tie stems to sturdy angled stakes with soft figure-of-eight twine.',
        claySoilTip: 'Gales (>= 25 mph) rock tall brassicas in wet clay, reaming out a funnel-shaped socket around the stem that fills with freezing rainwater and causes collar rot.',
        targetWindowUk: 'Throughout October'
      },
      {
        id: 'oct-03',
        monthIndex: 9,
        title: "Move Terracotta Citrus ('Meyer Lemon') Under Frost-Free Glass & Remove Saucers",
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Bring H2 Citrus pots into a bright, unheated conservatory, porch, or cool greenhouse (min 2–5°C) before overnight temperatures drop to 0°C.',
        claySoilTip: 'Remove all watering saucers and stand outdoor terracotta pots on pot feet so porous clay walls do not spall and crack during freeze-thaw nights.',
        targetWindowUk: 'Early to Mid October'
      },
      {
        id: 'oct-04',
        monthIndex: 9,
        title: 'Rough-Dig Vacant Heavy Clay Beds & Lay Timber Staging Boards',
        category: 'SOIL_CARE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'On a dry October afternoon before winter waterlogging sets in, turn vacant clay beds into rough, unbroken ridges and lay timber planks along access paths.',
        claySoilTip: 'Leaving clay in rough ridges increases surface area for winter frost-shattering while shedding excess rainwater into furrow channels.',
        targetWindowUk: 'Dry Spells in October'
      },
      {
        id: 'oct-05',
        monthIndex: 9,
        title: 'Rake Fallen Leaves Off Lawns & Borders to Make Acidic Leafmould for Maples',
        category: 'PEST_DISEASE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Clear wet autumn leaves from crowns of alpines and lawns; pack damp leaves into wire mesh bays or perforated sacks to rot down into crumbly leafmould.',
        claySoilTip: 'Decaying leaves left on wet clay harbour grey field slugs and botrytis; finished leafmould is the single best conditioner for Acer palmatum in clay.',
        targetWindowUk: 'Late October'
      }
    ]
  },
  {
    monthIndex: 10,
    monthName: 'November',
    shortName: 'Nov',
    seasonLabel: 'Bare-Root Planting & Winter Insulation',
    typicalSoilTemp6cmC: '4.5°C – 7.0°C',
    clayWorkabilityStatus: 'Wet & Heavy — Use Grit & Compost in Planting Pits',
    northEastAdjustmentNote: 'Plant tulips in November when cold clay suppresses tulip fire (*Botrytis tulipae*); heel in bare-root trees in a spare trench if clay is waterlogged.',
    tasks: [
      {
        id: 'nov-01',
        monthIndex: 10,
        title: 'Plant Tulip Bulbs Deeply on a 3cm Bed of Sharp Horticultural Grit',
        category: 'SOWING_PLANTING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Plant tulip bulbs 15–20cm deep in November once soil temperatures drop below 7°C to prevent fungal tulip fire.',
        claySoilTip: 'Avoid using a narrow bulb planter in sticky clay (which glazes the hole walls and creates a water sump); dig a wider hole with a trowel and add grit.',
        targetWindowUk: 'Early to Mid November'
      },
      {
        id: 'nov-02',
        monthIndex: 10,
        title: 'Plant Bare-Root Hedging, Roses & Fruit Trees (If Clay is Not Waterlogged)',
        category: 'SOWING_PLANTING',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Dig square planting pits wider than the roots, prick the pit walls with a fork to prevent clay glazing, and dust roots with mycorrhizal fungi.',
        claySoilTip: 'Never dig a deep sump into impervious clay subsoil where water pools; plant slightly proud on a low mound if drainage is slow.',
        targetWindowUk: 'Mid to Late November'
      },
      {
        id: 'nov-03',
        monthIndex: 10,
        title: 'Wrap Outdoor Standpipes & Insulate Sheltered Courtyard Containers',
        category: 'PROTECTION',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Lag outdoor taps, drain hosepipes, and wrap exposed pots in hessian and bubble insulation ahead of hard North East frosts.',
        claySoilTip: 'Wet compost in pots freezes from the sides inward, crushing fibrous roots.',
        targetWindowUk: 'Mid November'
      }
    ]
  },
  {
    monthIndex: 11,
    monthName: 'December',
    shortName: 'Dec',
    seasonLabel: 'Winter Solstice & Structural Pruning',
    typicalSoilTemp6cmC: '2.5°C – 4.5°C',
    clayWorkabilityStatus: 'Waterlogged — Strict No-Tread Policy on Clay',
    northEastAdjustmentNote: 'Acer palmatum and birches are now fully dormant and safe for formative pruning without sap bleeding.',
    tasks: [
      {
        id: 'dec-01',
        monthIndex: 11,
        title: "Carry Out Formative Pruning on Fully Dormant Acer palmatum 'Bloodgood'",
        category: 'PRUNING',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Now that Japanese Maples are completely leafless and dormant, remove dead, crossing, or inward-growing twigs with sterilized secateurs.',
        claySoilTip: 'Pruning Acers in early winter prevents spring sap bleeding and reduces wind drag during winter gales.',
        targetWindowUk: 'Early to Mid December'
      },
      {
        id: 'dec-02',
        monthIndex: 11,
        title: 'Clear Field Drains, Ditch Outfalls & Greenhouse Gutters',
        category: 'SOIL_CARE',
        priority: 'ESSENTIAL',
        rhsGuidance: 'Flush silt and fallen maple leaves from drainage channels and water-butt diverters so winter storms drain away from plot borders.',
        claySoilTip: 'Standing surface water over heavy clay starves perennial roots of oxygen within 48–72 hours.',
        targetWindowUk: 'Throughout December'
      },
      {
        id: 'dec-03',
        monthIndex: 11,
        title: 'Ventilate Unheated Greenhouses on Bright Crisp Days to Deter Botrytis',
        category: 'PEST_DISEASE',
        priority: 'RECOMMENDED',
        rhsGuidance: 'Open vents for 2–3 hours around midday on sunny frost-free days to purge stagnant damp air around overwintering citrus and cuttings.',
        claySoilTip: 'Close vents by 14:30 GMT in winter to trap solar warmth before rapid dusk cooling.',
        targetWindowUk: 'Sunny Days in December'
      }
    ]
  }
];

/**
 * Returns the 0-indexed month (0 = Jan ... 9 = Oct ... 11 = Dec) in UK time ('Europe/London').
 */
export function getCurrentUkMonthIndex(referenceDate: Date = new Date()): number {
  try {
    const monthStr = new Intl.DateTimeFormat('en-GB', {
      month: 'numeric',
      timeZone: 'Europe/London'
    }).format(referenceDate);
    const parsed = parseInt(monthStr, 10) - 1;
    if (parsed >= 0 && parsed <= 11) return parsed;
  } catch {
    // Fallback to UTC/local month
  }
  return referenceDate.getMonth();
}

/**
 * Retrieves the monthly heavy clay checklist profile for a given month index (0-11).
 */
export function getMonthlyClayChecklist(monthIndex: number): MonthClayProfile {
  const safeIndex = ((Math.floor(monthIndex) % 12) + 12) % 12;
  return MONTHLY_CLAY_PROFILES[safeIndex];
}

/**
 * Filters monthly tasks by category ('ALL' returns all tasks).
 */
export function filterMonthlyTasks(
  tasks: MonthlyClayTask[],
  categoryFilter: string = 'ALL'
): MonthlyClayTask[] {
  if (!categoryFilter || categoryFilter === 'ALL') return tasks;
  return tasks.filter((t) => t.category === categoryFilter);
}

/**
 * Computes completion counts and percentage for a month's tasks.
 */
export function calculateChecklistProgress(
  tasks: MonthlyClayTask[],
  completedMap: Record<string, boolean> = {}
): {
  completedCount: number;
  totalCount: number;
  percentComplete: number;
} {
  const totalCount = tasks.length;
  if (totalCount === 0) {
    return { completedCount: 0, totalCount: 0, percentComplete: 0 };
  }
  const completedCount = tasks.filter((t) => Boolean(completedMap[t.id])).length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percentComplete };
}

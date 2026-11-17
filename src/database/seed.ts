import { getDatabase } from './db'
import type {
  AppSettings,
  Area,
  Category,
  ContentTranslation,
  Destination,
  Language,
  LocalMedia,
} from './schema'

const emptyTranslation = (): ContentTranslation => ({
  name: '',
  shortDescription: '',
  description: '',
  historicalBackground: '',
  facts: [],
  highlights: [],
  dressCode: '',
  etiquette: '',
  photography: '',
  accessibility: '',
  bestTime: '',
  videoDescription: '',
})

const areas: Area[] = [
  {
    id: 'south_coast',
    translations: {
      en: 'South Coast',
      de: 'Südküste',
      ru: 'Южное побережье',
      ja: '南部海岸',
    },
    descriptions: {
      en: 'Beautiful southern coastline with pristine beaches and historic sites.',
      de: 'Wunderschöne südliche Küste mit unberührten Stränden und historischen Stätten.',
      ru: 'Красивое южное побережье с первобытными пляжами и историческими местами.',
      ja: '美しい南部海岸線、手つかずのビーチと史跡。',
    },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 1,
  },
  {
    id: 'west_coast',
    translations: {
      en: 'West Coast',
      de: 'Westküste',
      ru: 'Западное побережье',
      ja: '西部海岸',
    },
    descriptions: {
      en: 'Vibrant western coast with temples, culture, and surf spots.',
      de: 'Lebendige Westküste mit Tempeln, Kultur und Surfspots.',
      ru: 'Жизненное западное побережье с храмами, культурой и серф-спотами.',
      ja: '寺院、文化、サーフスポットが揃う活気ある西海岸。',
    },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 2,
  },
  {
    id: 'cultural_triangle',
    translations: {
      en: 'Cultural Triangle',
      de: 'Kulturelles Dreieck',
      ru: 'Культурный треугольник',
      ja: '文化の三角地帯',
    },
    descriptions: {
      en: 'Ancient kingdoms and UNESCO heritage sites in the heart of Sri Lanka.',
      de: 'Antike Königreiche und UNESCO-Weltkulturerbe im Herzen Sri Lankas.',
      ru: 'Древние королевства и объекты Всемирного наследия ЮНЕСКО в сердце Шри-Ланки.',
      ja: 'スリランカの中心部にある古代王国とユネスコ世界遺産。',
    },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 3,
  },
  {
    id: 'central_highlands',
    translations: {
      en: 'Central Highlands',
      de: 'Zentrales Hochland',
      ru: 'Центральное нагорье',
      ja: '中央高地',
    },
    descriptions: {
      en: 'Cool mountain climate, tea plantations, and misty peaks.',
      de: 'Kühles Bergklima, Teeplantagen und neblige Gipfel.',
      ru: 'Прохладный горный климат, чайные плантации и туманные пики.',
      ja: '涼しい山岳気候、茶畑、霧深い山々。',
    },
    parentAreaId: null,
    imageMediaId: null,
    sortOrder: 4,
  },
]

const categories: Category[] = [
  {
    id: 'temples',
    translations: {
      en: 'Temples & Sacred Sites',
      de: 'Tempel & Heilige Stätten',
      ru: 'Храмы и священные места',
      ja: '寺院・聖地',
    },
    descriptions: {
      en: 'Buddhist temples, Hindu kovils, and sacred pilgrimage sites.',
      de: 'Buddhistische Tempel, Hindu-Kovils und heilige Pilgerstätten.',
      ru: 'Буддийские храмы, индуистские ковилы и святые места паломничества.',
      ja: '仏教寺院、ヒンドゥー教コーヴィル、聖なる巡礼地。',
    },
    icon: '🛕',
    imageMediaId: null,
    sortOrder: 1,
  },
  {
    id: 'history',
    translations: {
      en: 'Historical Places',
      de: 'Historische Orte',
      ru: 'Исторические места',
      ja: '歴史的名所',
    },
    descriptions: {
      en: 'UNESCO World Heritage sites, colonial forts, and ancient cities.',
      de: 'UNESCO-Weltkulturerbe, Kolonialfestungen und antike Städte.',
      ru: 'Объекты Всемирного наследия ЮНЕСКО, колониальные форты и древние города.',
      ja: 'ユネスコ世界遺産、植民地時代の要塞、古代都市。',
    },
    icon: '🏛️',
    imageMediaId: null,
    sortOrder: 2,
  },
  {
    id: 'surfing',
    translations: {
      en: 'Surfing & Beaches',
      de: 'Surfen & Strände',
      ru: 'Серфинг и пляжи',
      ja: 'サーフィン・ビーチ',
    },
    descriptions: {
      en: 'World-class surf breaks, sandy beaches, and coastal activities.',
      de: 'Weltklasse Surf-Breaks, Sandstrände und Küstenaktivitäten.',
      ru: 'Мировые серф-споты, песчаные пляжи и прибрежные развлечения.',
      ja: '世界レベルのサーフブレイク、砂浜、沿岸アクティビティ。',
    },
    icon: '🏄',
    imageMediaId: null,
    sortOrder: 3,
  },
  {
    id: 'traditional',
    translations: {
      en: 'Traditional & Culture',
      de: 'Tradition & Kultur',
      ru: 'Традиции и культура',
      ja: '伝統・文化',
    },
    descriptions: {
      en: 'Traditional arts, crafts, masks, dance, and cultural heritage.',
      de: 'Traditionelle Künste, Handwerk, Masken, Tanz und Kulturerbe.',
      ru: 'Традиционные искусства, ремесла, маски, танцы и культурное наследие.',
      ja: '伝統芸術、工芸、仮面、舞踊、文化遺産。',
    },
    icon: '🎨',
    imageMediaId: null,
    sortOrder: 4,
  },
]

function createFacts(stats: Array<{ label: Record<Language, string>; value: Record<Language, string> }>): ContentTranslation['facts'] {
  return stats.map((stat, index) => ({
    id: `fact-${index}`,
    label: stat.label.en,
    value: stat.value.en,
  }))
}

const destinations: Destination[] = [
  {
    id: 'kande_vihara',
    slug: 'kande-vihara',
    areaId: 'west_coast',
    categoryIds: ['temples'],
    translations: {
      en: {
        ...emptyTranslation(),
        name: 'Kande Vihara Temple',
        shortDescription: 'Home to one of the world\'s tallest sitting Buddha statues and a sacred 300+ year-old Bodhi tree.',
        description: 'Kande Vihara Temple, founded in 1734, is a government-declared archaeological site featuring a historic octagonal image house and ancient floral ceiling artwork from the Kandy era. The temple complex includes a 160-foot (48.8m) tall sitting Buddha statue, one of the tallest in the world, and a sacred Bodhi tree over 300 years old.',
        historicalBackground: 'Founded in 1734 by Venerable Karapagala Dewamitta Thero, Kande Vihara is a government-declared archaeological site. It features a historic octagonal image house and ancient floral ceiling artwork from the Kandy era.',
        facts: createFacts([
          { label: { en: 'Statue Height', de: 'Statuenhöhe', ru: 'Высота статуи', ja: '仏像の高さ' }, value: { en: '160 ft (48.8 m)', de: '160 Fuß (48,8 m)', ru: '160 футов (48,8 м)', ja: '160フィート (48.8m)' } },
          { label: { en: 'Bodhi Tree Lineage', de: 'Bodhi-Baum Geschichte', ru: 'История дерева Бодхи', ja: '菩提樹の歴史' }, value: { en: '300+ Years', de: 'Über 300 Jahre', ru: 'Более 300 лет', ja: '300年以上' } },
          { label: { en: 'Establishment', de: 'Gründungsjahr', ru: 'Основание', ja: '創立' }, value: { en: '1734 AD', de: '1734 n. Chr.', ru: '1734 г. н.э.', ja: '1734年' } },
          { label: { en: 'Dress Code', de: 'Kleidungsvorschrift', ru: 'Дресс-код', ja: 'ドレスコード' }, value: { en: 'Cover shoulders & knees, remove shoes/hats', de: 'Schultern & Knie bedecken, Schuhe/Hüte ausziehen', ru: 'Плечи и колени закрыты, снять обувь и головные уборы', ja: '肩と膝を隠すこと。靴・帽子は脱ぐ' } },
        ]),
        highlights: [
          'World\'s tallest sitting Buddha statue (160 ft)',
          'Sacred 300+ year-old Bodhi tree',
          'Historic octagonal image house',
          'Ancient Kandy-era floral ceiling artwork',
          'Government-declared archaeological site',
        ],
        dressCode: 'Cover shoulders and knees. Remove shoes and hats before entering.',
        etiquette: 'Speak softly. Do not turn your back on Buddha statues. No photography inside the image house.',
        photography: 'Photography allowed in outdoor areas only. No flash photography near statues.',
        accessibility: 'Ramp access available to main temple grounds. Image house has steps.',
        bestTime: 'Early morning (6-8 AM) or late afternoon (4-6 PM) for cooler temperatures and fewer crowds.',
        videoDescription: 'Virtual tour of Kande Vihara Temple including the giant Buddha statue and Bodhi tree.',
      },
      de: {
        ...emptyTranslation(),
        name: 'Kande Vihara Tempel',
        shortDescription: 'Heimat einer der höchsten sitzenden Buddha-Statuen der Welt und eines über 300 Jahre alten Bodhi-Baums.',
        description: 'Der Kande Vihara Tempel, 1734 gegründet, ist eine staatlich anerkannte archäologische Stätte mit einem historischen achteckigen Bildhaus und alten floralen Deckenmalereien aus der Kandy-Ära. Der Tempelkomplex umfasst eine 48,8 m hohe sitzende Buddha-Statue, eine der höchsten der Welt, und einen heiligen Bodhi-Baum, der über 300 Jahre alt ist.',
        historicalBackground: 'Der 1734 vom Ehrwürdigen Karapagala Dewamitta Thero gegründete Kande Vihara ist eine staatlich anerkannte archäologische Stätte mit einem historischen achteckigen Bildhaus und alten floralen Deckenmalereien aus der Kandy-Ära.',
        facts: createFacts([
          { label: { en: 'Statue Height', de: 'Statuenhöhe', ru: 'Высота статуи', ja: '仏像の高さ' }, value: { en: '160 ft (48.8 m)', de: '160 Fuß (48,8 m)', ru: '160 футов (48,8 м)', ja: '160フィート (48.8m)' } },
          { label: { en: 'Bodhi Tree Lineage', de: 'Bodhi-Baum Geschichte', ru: 'История дерева Бодхи', ja: '菩提樹の歴史' }, value: { en: '300+ Years', de: 'Über 300 Jahre', ru: 'Более 300 лет', ja: '300年以上' } },
          { label: { en: 'Establishment', de: 'Gründungsjahr', ru: 'Основание', ja: '創立' }, value: { en: '1734 AD', de: '1734 n. Chr.', ru: '1734 г. н.э.', ja: '1734年' } },
          { label: { en: 'Dress Code', de: 'Kleidungsvorschrift', ru: 'Дресс-код', ja: 'ドレスコード' }, value: { en: 'Cover shoulders & knees, remove shoes/hats', de: 'Schultern & Knie bedecken, Schuhe/Hüte ausziehen', ru: 'Плечи и колени закрыты, снять обувь и головные уборы', ja: '肩と膝を隠すこと。靴・帽子は脱ぐ' } },
        ]),
        highlights: [
          'Weltweit höchste sitzende Buddha-Statue (48,8 m)',
          'Heiliger 300+ Jahre alter Bodhi-Baum',
          'Historisches achteckiges Bildhaus',
          'Antike florale Deckenmalereien aus Kandy-Ära',
          'Staatlich anerkannte archäologische Stätte',
        ],
        dressCode: 'Schultern und Knie bedecken. Schuhe und Hüte vor dem Betreten ablegen.',
        etiquette: 'Leise sprechen. Buddha-Statuen nicht den Rücken zuwenden. Keine Fotografie im Bildhaus.',
        photography: 'Fotografie nur im Außenbereich erlaubt. Kein Blitzlicht nahe Statuen.',
        accessibility: 'Rampenzugang zum Haupttempelgelände. Bildhaus hat Stufen.',
        bestTime: 'Frühmorgens (6-8 Uhr) oder spätnachmittags (16-18 Uhr) für kühlere Temperaturen und weniger Besucher.',
        videoDescription: 'Virtueller Rundgang durch den Kande Vihara Tempel mit der riesigen Buddha-Statue und dem Bodhi-Baum.',
      },
      ru: {
        ...emptyTranslation(),
        name: 'Храм Канде Вихара',
        shortDescription: 'Здесь находится одна из самых высоких в мире статуй сидящего Будды и священное дерево Бодхи возрастом более 300 лет.',
        description: 'Храм Канде Вихара, основанный в 1734 году, является официальным археологическим памятником с историческим восьмиугольным зданием для статуй и древней флоренской росписью потолка эпохи Канди. Храмовый комплекс включает статую сидящего Будды высотой 160 футов (48,8 м) — одну из самых высоких в мире — и священное дерево Бодхи возрастом более 300 лет.',
        historicalBackground: 'Основанный в 1734 году преподобным Карапагала Девамитта Тхеро, Канде Вихара является официальным археологическим памятником с историческим восьмиугольным зданием для статуй и древней флоренской росписью потолка эпохи Канди.',
        facts: createFacts([
          { label: { en: 'Statue Height', de: 'Statuenhöhe', ru: 'Высота статуи', ja: '仏像の高さ' }, value: { en: '160 ft (48.8 m)', de: '160 Fuß (48,8 m)', ru: '160 футов (48,8 м)', ja: '160フィート (48.8m)' } },
          { label: { en: 'Bodhi Tree Lineage', de: 'Bodhi-Baum Geschichte', ru: 'История дерева Бодхи', ja: '菩提樹の歴史' }, value: { en: '300+ Years', de: 'Über 300 Jahre', ru: 'Более 300 лет', ja: '300年以上' } },
          { label: { en: 'Establishment', de: 'Gründungsjahr', ru: 'Основание', ja: '創立' }, value: { en: '1734 AD', de: '1734 n. Chr.', ru: '1734 г. н.э.', ja: '1734年' } },
          { label: { en: 'Dress Code', de: 'Kleidungsvorschrift', ru: 'Дресс-код', ja: 'ドレスコード' }, value: { en: 'Cover shoulders & knees, remove shoes/hats', de: 'Schultern & Knie bedecken, Schuhe/Hüte ausziehen', ru: 'Плечи и колени закрыты, снять обувь и головные уборы', ja: '肩と膝を隠すこと。靴・帽子は脱ぐ' } },
        ]),
        highlights: [
          'Одна из самых высоких в мире статуй сидящего Будды (48,8 м)',
          'Священное дерево Бодхи возрастом 300+ лет',
          'Историческое восьмиугольное здание для статуй',
          'Древние флоренские росписи потолка эпохи Канди',
          'Официальный археологический памятник',
        ],
        dressCode: 'Плечи и колени должны быть закрыты. Снять обувь и головные уборы перед входом.',
        etiquette: 'Говорить тихо. Не поворачиваться к статуям Будды спиной. Не фотографировать внутри здания для статуй.',
        photography: 'Фотография разрешена только на открытом террасе. Без вспышки у статуй.',
        accessibility: 'Панорамная рампа к основной территории храма. Здание для статуй имеет ступени.',
        bestTime: 'Рано утром (6-8) или поздно днем (16-18) для прохладной погоды и меньшей толпы.',
        videoDescription: 'Виртуальный тур по храму Канде Вихара включая гигантскую статую Будды и дерево Бодхи.',
      },
      ja: {
        ...emptyTranslation(),
        name: 'カンデ・ヴィハラ寺院',
        shortDescription: '世界最大級の座禅仏像と、樹齢300年を超える神聖な菩提樹がある寺院。',
        description: '1734年創建のカンデ・ヴィハラ寺院は、政府指定の考古学史跡です。歴史的な八角形の仏堂とキャンディ時代の天井画が特徴です。寺院敷地内には高さ48.8mの座禅仏像（世界最大級）と、樹齢300年以上の神聖な菩提樹があります。',
        historicalBackground: '1734年にカラパガラ・デワミッタ長老によって建立された政府指定の考古学史跡。歴史的な八角形の仏堂とキャンディ時代の天井画が特徴です。',
        facts: createFacts([
          { label: { en: 'Statue Height', de: 'Statuenhöhe', ru: 'Высота статуи', ja: '仏像の高さ' }, value: { en: '160 ft (48.8 m)', de: '160 Fuß (48,8 m)', ru: '160 футов (48,8 м)', ja: '160フィート (48.8m)' } },
          { label: { en: 'Bodhi Tree Lineage', de: 'Bodhi-Baum Geschichte', ru: 'История дерева Бодхи', ja: '菩提樹の歴史' }, value: { en: '300+ Years', de: 'Über 300 Jahre', ru: 'Более 300 лет', ja: '300年以上' } },
          { label: { en: 'Establishment', de: 'Gründungsjahr', ru: 'Основание', ja: '創立' }, value: { en: '1734 AD', de: '1734 n. Chr.', ru: '1734 г. н.э.', ja: '1734年' } },
          { label: { en: 'Dress Code', de: 'Kleidungsvorschrift', ru: 'Дресс-код', ja: 'ドレスコード' }, value: { en: 'Cover shoulders & knees, remove shoes/hats', de: 'Schultern & Knie bedecken, Schuhe/Hüte ausziehen', ru: 'Плечи и колени закрыты, снять обувь и головные уборы', ja: '肩と膝を隠すこと。靴・帽子は脱ぐ' } },
        ]),
        highlights: [
          '世界最大級の座禅仏像（高さ48.8m）',
          '樹齢300年超の神聖な菩提樹',
          '歴史的な八角形の仏堂',
          'キャンディ時代の天井画',
          '政府指定の考古学史跡',
        ],
        dressCode: '肩と膝を隠すこと。靴と帽子は脱いでから入ること。',
        etiquette: '静かにすること。仏像に背を向けない。仏堂内では撮影禁止。',
        photography: '屋外エリアのみ撮影可。仏像の近くではフラッシュ禁止。',
        accessibility: '本堂までスロープあり。仏堂には階段あり。',
        bestTime: '早朝（6-8時）または夕方（16-18時）が涼しく空いている。',
        videoDescription: 'カンデ・ヴィハラ寺院のバーチャルツアー。巨大座禅仏像と菩提樹を紹介。',
      },
    },
    galleryMediaIds: [],
    videoMediaIds: [],
    audioMediaIds: [],
    nearbyDestinationIds: [],
    keywords: ['buddha', 'temple', 'bodhi', 'archaeological', 'kandy'],
    alternateNames: [],
    visitDuration: '1-2 hours',
    published: true,
    featured: true,
    sortOrder: 1,
    sources: 'Sri Lanka Department of Archaeology, Temple records',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'galle_fort',
    slug: 'galle-fort',
    areaId: 'south_coast',
    categoryIds: ['history'],
    translations: {
      en: {
        ...emptyTranslation(),
        name: 'Galle Dutch Fort',
        shortDescription: 'A UNESCO World Heritage fortified city built by the Portuguese and expanded by the Dutch in the 17th century.',
        description: 'Galle Fort is a UNESCO World Heritage Site stretching along the ocean promenade. Originally built by the Portuguese in 1588 and extensively fortified by the Dutch from 1663 onwards, it represents the interaction between European architectural styles and South Asian traditions over three centuries. The fort contains historic churches, museums, boutique hotels, and charming streets within its 130-acre (52 hectare) walls.',
        historicalBackground: 'Stretching along the ocean promenade, Galle Fort represents the interaction between European architectural styles and South Asian traditions over three centuries. Built by the Portuguese in 1588 and expanded by the Dutch in 1663.',
        facts: createFacts([
          { label: { en: 'Built Year', de: 'Baujahr', ru: 'Год постройки', ja: '建設年' }, value: { en: '1588 (Portuguese) / 1663 (Dutch)', de: '1588 (Portugiesen) / 1663 (Holländer)', ru: '1588 (Португальцы) / 1663 (Голландцы)', ja: '1588年(ポルトガル) / 1663年(オランダ)' } },
          { label: { en: 'Status', de: 'Status', ru: 'Статус', ja: '指定' }, value: { en: 'UNESCO World Heritage Site', de: 'UNESCO-Weltkulturerbe', ru: 'Объект Всемирного наследия ЮНЕСКО', ja: 'ユネスコ世界文化遺産' } },
          { label: { en: 'Area Size', de: 'Fläche', ru: 'Площадь', ja: '敷地面積' }, value: { en: '130 Acres (52 Hectares)', de: '130 Acres (52 Hektar)', ru: '130 акров (52 гектара)', ja: '130エーカー (52ヘクタール)' } },
        ]),
        highlights: [
          'UNESCO World Heritage Site',
          'Well-preserved Dutch colonial architecture',
          'Historic lighthouse and clock tower',
          'Maritime Archaeology Museum',
          'Boutique shops, cafes, and hotels within fort walls',
        ],
        dressCode: 'Casual respectful attire. Comfortable walking shoes recommended.',
        etiquette: 'Respect private residences within the fort. No littering. Stay on designated paths.',
        photography: 'Photography allowed throughout. Drone photography requires special permission.',
        accessibility: 'Main streets are wheelchair accessible. Some historic buildings have steps.',
        bestTime: 'Late afternoon (4-6 PM) for golden hour light and cooler temperatures. Sunset from ramparts is spectacular.',
        videoDescription: 'Walking tour of Galle Fort including ramparts, lighthouse, and historic streets.',
      },
      de: {
        ...emptyTranslation(),
        name: 'Holländisches Fort Galle',
        shortDescription: 'Eine UNESCO-Weltkulturerbe-Festungsstadt, erbaut von den Portugiesen und im 17. Jahrhundert von den Holländern erweitert.',
        description: 'Das Fort Galle ist ein UNESCO-Weltkulturerbe, das sich entlang der Ozeanpromenade erstreckt. Ursprünglich 1588 von den Portugiesen erbaut und ab 1663 von den Holländern umfassend befestigt, zeigt es die Verschmelzung europäischer Architekturstile mit südasiatischen Traditionen über drei Jahrhunderte. Das Fort enthält historische Kirchen, Museen, Boutique-Hotels und charmante Straßen innerhalb seiner 52 Hektar großen Mauern.',
        historicalBackground: 'Das Fort Galle erstreckt sich entlang der Ozeanpromenade und zeigt die Verschmelzung europäischer Architekturstile mit südasiatischen Traditionen über drei Jahrhunderte. Erbaut von den Portugiesen 1588 und erweitert von den Holländern 1663.',
        facts: createFacts([
          { label: { en: 'Built Year', de: 'Baujahr', ru: 'Год постройки', ja: '建設年' }, value: { en: '1588 (Portuguese) / 1663 (Dutch)', de: '1588 (Portugiesen) / 1663 (Holländer)', ru: '1588 (Португальцы) / 1663 (Голландцы)', ja: '1588年(ポルトガル) / 1663年(オランダ)' } },
          { label: { en: 'Status', de: 'Status', ru: 'Статус', ja: '指定' }, value: { en: 'UNESCO World Heritage Site', de: 'UNESCO-Weltkulturerbe', ru: 'Объект Всемирного наследия ЮНЕСКО', ja: 'ユネスコ世界文化遺産' } },
          { label: { en: 'Area Size', de: 'Fläche', ru: 'Площадь', ja: '敷地面積' }, value: { en: '130 Acres (52 Hectares)', de: '130 Acres (52 Hektar)', ru: '130 акров (52 гектара)', ja: '130エーカー (52ヘクタール)' } },
        ]),
        highlights: [
          'UNESCO-Weltkulturerbe',
          'Gut erhaltene holländische Kolonialarchitektur',
          'Historischer Leuchtturm und Uhrturm',
          'Maritimes Archäologiemuseum',
          'Boutiquen, Cafés und Hotels innerhalb der Festungsmauern',
        ],
        dressCode: 'Lockerer, respektvoller Kleidungsstil. Bequeme Wanderschuhe empfohlen.',
        etiquette: 'Private Wohnungen innerhalb des Forts respektieren. Kein Müll. Auf markierten Wegen bleiben.',
        photography: 'Fotografie überall erlaubt. Drohnenaufnahmen benötigen Sondergenehmigung.',
        accessibility: 'Hauptstraßen sind rollstuhlgerecht. Einige historische Gebäude haben Stufen.',
        bestTime: 'Spätnachmittags (16-18 Uhr) für goldenes Licht und kühlere Temperaturen. Sonnenuntergang von den Wallanlagen ist spektakulär.',
        videoDescription: 'Rundgang durch das Fort Galle einschließlich Wallanlagen, Leuchtturm und historischer Straßen.',
      },
      ru: {
        ...emptyTranslation(),
        name: 'Голландский форт Галле',
        shortDescription: 'Укрепленный город из списка Всемирного наследия ЮНЕСКО, построенный португальцами и расширенный голландцами в XVII веке.',
        description: 'Форт Галле — объект Всемирного наследия ЮНЕСКО, простирающийся вдоль океанской променады. Построен португальцами в 1588 году и значительно расширен голландцами с 1663 года, он иллюстрирует слияние европейской архитектуры и южноазиатских традиций на протяжении трех столетий. Форт включает исторические церкви, музеи, бутик-отели и очаровательные улицы внутри своих 52-га пространства.',
        historicalBackground: 'Форт Галле простирается вдоль океанской променады и иллюстрирует слияние европейской архитектуры и южноазиатских традиций на протяжении трех столетий. Построен португальцами в 1588 и расширен голландцами в 1663.',
        facts: createFacts([
          { label: { en: 'Built Year', de: 'Baujahr', ru: 'Год постройки', ja: '建設年' }, value: { en: '1588 (Portuguese) / 1663 (Dutch)', de: '1588 (Portugiesen) / 1663 (Holländer)', ru: '1588 (Португальцы) / 1663 (Голландцы)', ja: '1588年(ポルトガル) / 1663年(オランダ)' } },
          { label: { en: 'Status', de: 'Status', ru: 'Статус', ja: '指定' }, value: { en: 'UNESCO World Heritage Site', de: 'UNESCO-Weltkulturerbe', ru: 'Объект Всемирного наследия ЮНЕСКО', ja: 'ユネスコ世界文化遺産' } },
          { label: { en: 'Area Size', de: 'Fläche', ru: 'Площадь', ja: '敷地面積' }, value: { en: '130 Acres (52 Hectares)', de: '130 Acres (52 Hektar)', ru: '130 акров (52 гектара)', ja: '130エーカー (52ヘクタール)' } },
        ]),
        highlights: [
          'Объект Всемирного наследия ЮНЕСКО',
          'Хорошо сохраненная голландская колониальная архитектура',
          'Исторический маяк и часовая башня',
          'Музей морской археологии',
          'Бутики, кафе и отели внутри стен форта',
        ],
        dressCode: 'Повседневная уважающая одежда. Рекомендуется удобная обувь для ходьбы.',
        etiquette: 'Уважайте частные резиденции внутри форта. Не мусорьте. Держитесь обозначенных путей.',
        photography: 'Фотография разрешена повсюду. Съемка дроном требует специального разрешения.',
        accessibility: 'Главные улицы доступны для инвалидных колясок. Некоторые исторические здания имеют ступени.',
        bestTime: 'Поздний день (16-18) для золотого часа и прохладной погоды. Закат с бастионов великолепен.',
        videoDescription: 'Пешеходный тур по форту Галле включая бастионы, маяк и исторические улицы.',
      },
      ja: {
        ...emptyTranslation(),
        name: 'ゴール・ダッチ・フォート',
        shortDescription: 'ポルトガル人によって建設され、17世紀にオランダ人によって拡張されたユネスコ世界遺産の要塞都市。',
        description: 'ゴール要塞は海岸線に沿って広がるユネスコ世界文化遺産です。1588年にポルトガル人によって建設され、1663年以降オランダ人によって大幅に拡張されたこの要塞は、3世紀以上にわたるヨーロッパの建築様式と南アジアの伝統の融合を今に伝えています。約52ヘクタールの城壁内には、歴史的な教会、博物館、ブティックホテル、魅力的な街並みが広がっています。',
        historicalBackground: '海岸線に沿って広がるゴール要塞は、3世紀以上にわたるヨーロッパの建築様式と南アジアの伝統の融合を今に伝えています。1588年ポルトガル人建設、1663年オランダ人拡張。',
        facts: createFacts([
          { label: { en: 'Built Year', de: 'Baujahr', ru: 'Год постройки', ja: '建設年' }, value: { en: '1588 (Portuguese) / 1663 (Dutch)', de: '1588 (Portugiesen) / 1663 (Holländer)', ru: '1588 (Португальцы) / 1663 (Голландцы)', ja: '1588年(ポルトガル) / 1663年(オランダ)' } },
          { label: { en: 'Status', de: 'Status', ru: 'Статус', ja: '指定' }, value: { en: 'UNESCO World Heritage Site', de: 'UNESCO-Weltkulturerbe', ru: 'Объект Всемирного наследия ЮНЕСКО', ja: 'ユネスコ世界文化遺産' } },
          { label: { en: 'Area Size', de: 'Fläche', ru: 'Площадь', ja: '敷地面積' }, value: { en: '130 Acres (52 Hectares)', de: '130 Acres (52 Hektar)', ru: '130 акров (52 гектара)', ja: '130エーカー (52ヘクタール)' } },
        ]),
        highlights: [
          'ユネスコ世界文化遺産',
          '保存状態の良いオランダ植民地建築',
          '歴史的な灯台と時計台',
          '海洋考古学博物館',
          '城壁内のブティック、カフェ、ホテル',
        ],
        dressCode: 'カジュアルで敬意を払った服装。歩きやすい靴を推奨。',
        etiquette: '城壁内の私有地を尊重すること。ゴミ捨て禁止。指定された道を歩くこと。',
        photography: '全域で撮影可。ドローン撮影は特別許可が必要。',
        accessibility: 'メインストリートは車椅子対応。一部の歴史的建物に階段あり。',
        bestTime: '夕方（16-18時）がマジックアワーで涼しい。城壁からの夕日は絶景。',
        videoDescription: 'ゴール要塞のウォーキングツアー。城壁、灯台、歴史的街並みを紹介。',
      },
    },
    galleryMediaIds: [],
    videoMediaIds: [],
    audioMediaIds: [],
    nearbyDestinationIds: ['weligama_surf'],
    keywords: ['unesco', 'fort', 'dutch', 'colonial', 'heritage', 'ramparts'],
    alternateNames: [],
    visitDuration: '2-4 hours',
    published: true,
    featured: true,
    sortOrder: 2,
    sources: 'UNESCO World Heritage Centre, Sri Lanka Tourism',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'weligama_surf',
    slug: 'weligama-surf',
    areaId: 'south_coast',
    categoryIds: ['surfing'],
    translations: {
      en: {
        ...emptyTranslation(),
        name: 'Weligama Beach & Surf Bay',
        shortDescription: 'Sri Lanka\'s premier sandy beach break, ideal for beginner and intermediate surfers.',
        description: 'Weligama Bay is famous for its gentle, rolling waves that break over a sandy bottom, making it one of the safest and most popular places to learn surfing in Sri Lanka. The crescent-shaped bay is protected from heavy ocean currents, providing consistent conditions from November to April. The town is also known for its iconic stilt fishermen who practice a traditional fishing method unique to this coast.',
        historicalBackground: 'Weligama (\"Sandy Village\") is famous for its iconic stilt fishermen and protected crescent bay, which shields the area from heavy ocean currents. The bay has been a fishing village for centuries and emerged as a surf destination in recent decades.',
        facts: createFacts([
          { label: { en: 'Wave Type', de: 'Wellentyp', ru: 'Тип волны', ja: '波のタイプ' }, value: { en: 'Sandy Beach Break (Gentle & Safe)', de: 'Sandstrand-Break (Sanft & Sicher)', ru: 'Песчаный бич-брейк (мягкий и безопасный)', ja: 'サンドビーチブレイク (穏やかで安全)' } },
          { label: { en: 'Best Season', de: 'Beste Reisezeit', ru: 'Лучший сезон', ja: 'ベストシーズン' }, value: { en: 'November to April', de: 'November bis April', ru: 'С ноября по апрель', ja: '11月〜4月' } },
          { label: { en: 'Water Temp', de: 'Wassertemperatur', ru: 'Температура воды', ja: '水温' }, value: { en: '27°C - 29°C', de: '27°C - 29°C', ru: '27°C - 29°C', ja: '27°C - 29°C' } },
        ]),
        highlights: [
          'Gentle sandy bottom beach break - perfect for beginners',
          'Protected crescent bay with consistent waves',
          'Iconic stilt fishermen (traditional fishing method)',
          'Numerous surf schools and board rentals',
          'Beachfront cafes and restaurants',
        ],
        dressCode: 'Swimwear for surfing. Rash guard recommended for sun protection.',
        etiquette: 'Respect local surfers and stilt fishermen. No littering on beach. Follow surf school instructions.',
        photography: 'Photography of stilt fishermen is welcome (tip appreciated). Surf action shots from shore.',
        accessibility: 'Sandy beach access. Some surf schools offer adaptive surfing programs.',
        bestTime: 'November to April for best waves. Morning (7-10 AM) for lighter winds and smaller crowds.',
        videoDescription: 'Surf session at Weligama Bay showing gentle waves, surf schools, and stilt fishermen.',
      },
      de: {
        ...emptyTranslation(),
        name: 'Weligama Strand & Surf-Bucht',
        shortDescription: 'Sri Lankas bester Sandstrand-Break, ideal für Anfänger und fortgeschrittene Surfer.',
        description: 'Die Weligama-Bucht ist berühmt für ihre sanften, rollenden Wellen, die über einen sandigen Grund brechen, was sie zu einem der sichersten und beliebtesten Orte zum Surfenlernen in Sri Lanka macht. Die sichelförmige Bucht ist vor starken Meeresströmungen geschützt und bietet von November bis April konstante Bedingungen. Der Ort ist auch für seine ikonischen Stelzenfischer bekannt, die eine dieser Küste einzigartige traditionelle Fischereimethode praktizieren.',
        historicalBackground: 'Weligama (\"Sanddorf\") ist berühmt für seine Stelzenfischer und die geschützte Sichelbucht, die das Gebiet vor starken Meeresströmungen schützt. Die Bucht ist seit Jahrhunderten ein Fischerdorf und entwickelte sich in den letzten Jahrzehnten zum Surf-Ziel.',
        facts: createFacts([
          { label: { en: 'Wave Type', de: 'Wellentyp', ru: 'Тип волны', ja: '波のタイプ' }, value: { en: 'Sandy Beach Break (Gentle & Safe)', de: 'Sandstrand-Break (Sanft & Sicher)', ru: 'Песчаный бич-брейк (мягкий и безопасный)', ja: 'サンドビーチブレイク (穏やかで安全)' } },
          { label: { en: 'Best Season', de: 'Beste Reisezeit', ru: 'Лучший сезон', ja: 'ベストシーズン' }, value: { en: 'November to April', de: 'November bis April', ru: 'С ноября по апрель', ja: '11月〜4月' } },
          { label: { en: 'Water Temp', de: 'Wassertemperatur', ru: 'Температура воды', ja: '水温' }, value: { en: '27°C - 29°C', de: '27°C - 29°C', ru: '27°C - 29°C', ja: '27°C - 29°C' } },
        ]),
        highlights: [
          'Sanfter Sandstrand-Break - perfekt für Anfänger',
          'Geschützte Sichelbucht mit konstanten Wellen',
          'Ikonische Stelzenfischer (traditionelle Fischerei)',
          'Zahlreiche Surfschulen und Board-Verleih',
          'Strandcafés und Restaurants',
        ],
        dressCode: 'Badekleidung zum Surfen. Lycra-Shirt zum Sonnenschutz empfohlen.',
        etiquette: 'Einheimische Surfer und Stelzenfischer respektieren. Kein Müll am Strand. Anweisungen der Surfschule befolgen.',
        photography: 'Fotos von Stelzenfischern willkommen (Trinkgeld geschätzt). Surf-Action vom Strand.',
        accessibility: 'Sandstrand-Zugang. Einige Surfschulen bieten adaptives Surfen an.',
        bestTime: 'November bis April für beste Wellen. Morgens (7-10 Uhr) für leichteren Wind und weniger Leute.',
        videoDescription: 'Surf-Session in der Weligama-Bucht mit sanften Wellen, Surfschulen und Stelzenfischern.',
      },
      ru: {
        ...emptyTranslation(),
        name: 'Пляж Велигама и залив для серфинга',
        shortDescription: 'Главный песчаный пляж Шри-Ланки для серфинга, идеальный для новичков и любителей.',
        description: 'Залив Велигама известен своими мягкими, катящимися волнами, ломающимися на песчаном дне, что делает его одним из самых безопасных и популярных мест для обучения серфингу на Шри-Ланке. Полулунный залив защищен от сильных океанических течений, обеспечивая стабильные условия с ноября по апрель. Город также известен своими культовыми рыбаками на сваях, практикующими традиционный метод рыбалки, уникальный для этого побережья.',
        historicalBackground: 'Велигама («Песчаная деревня») знаменита традиционной рыбалкой на сваях и защищенной полукруглой бухтой, которая оберегает район от сильных океанических течений. Залив веками был рыбной деревней и стал серф-дестинацией в последние десятилетия.',
        facts: createFacts([
          { label: { en: 'Wave Type', de: 'Wellentyp', ru: 'Тип волны', ja: '波のタイプ' }, value: { en: 'Sandy Beach Break (Gentle & Safe)', de: 'Sandstrand-Break (Sanft & Sicher)', ru: 'Песчаный бич-брейк (мягкий и безопасный)', ja: 'サンドビーチブレイク (穏やかで安全)' } },
          { label: { en: 'Best Season', de: 'Beste Reisezeit', ru: 'Лучший сезон', ja: 'ベストシーズン' }, value: { en: 'November to April', de: 'November bis April', ru: 'С ноября по апрель', ja: '11月〜4月' } },
          { label: { en: 'Water Temp', de: 'Wassertemperatur', ru: 'Температура воды', ja: '水温' }, value: { en: '27°C - 29°C', de: '27°C - 29°C', ru: '27°C - 29°C', ja: '27°C - 29°C' } },
        ]),
        highlights: [
          'Мягкий песчаный бич-брейк — идеально для новичков',
          'Защищенный полукруглый залив с постоянными волнами',
          'Культовые рыбаки на сваях (традиционный метод)',
          'Множество серф-школ и проката досок',
          'Пляжные кафе и рестораны',
        ],
        dressCode: 'Пляжная одежда для серфинга. Рекомендуется rash guard для защиты от солнца.',
        etiquette: 'Уважайте местных серферов и рыбаков на сваях. Не мусорьте на пляже. Следуйте инструкциям серф-школ.',
        photography: 'Фото рыбаков на сваях приветствуется (чаевые приветствуются). Съемка серфига с берега.',
        accessibility: 'Песчаный доступ к пляжу. Некоторые серф-школы предлагают адаптивный серфинг.',
        bestTime: 'Ноябрь-апрель для лучших волн. Утро (7-10) для слабого ветра и меньшей толпы.',
        videoDescription: 'Серф-сессия в заливе Велигама с мягкими волнами, серф-школами и рыбаками на сваях.',
      },
      ja: {
        ...emptyTranslation(),
        name: 'ウェリガマ・ビーチ＆サーフベイ',
        shortDescription: 'スリランカを代表するサンドビーチブレイク。初心者から中級サーファーに最適。',
        description: 'ウェリガマ湾は、砂地の上で崩れる穏やかなローリング波で有名で、スリランカでサーフィンを学ぶのに最も安全で人気のある場所の一つです。三日月型の湾は強い海流から守られ、11月から4月にかけて安定したコンディションを提供します。この町は、この海岸特有の伝統的な漁法「スティルトフィッシング（高足竹の釣り）」を行う象徴的な釣り人たちでも知られています。',
        historicalBackground: 'ウェリガマ（「砂の村」）は、伝統的な高足竹の釣り人（スティルトフィッシング）と、強い波から守られた三日月型の湾で有名です。何世紀にもわたる漁村が、近年になってサーフデスティネーションとして発展しました。',
        facts: createFacts([
          { label: { en: 'Wave Type', de: 'Wellentyp', ru: 'Тип волны', ja: '波のタイプ' }, value: { en: 'Sandy Beach Break (Gentle & Safe)', de: 'Sandstrand-Break (Sanft & Sicher)', ru: 'Песчаный бич-брейк (мягкий и безопасный)', ja: 'サンドビーチブレイク (穏やかで安全)' } },
          { label: { en: 'Best Season', de: 'Beste Reisezeit', ru: 'Лучший сезон', ja: 'ベストシーズン' }, value: { en: 'November to April', de: 'November bis April', ru: 'С ноября по апрель', ja: '11月〜4月' } },
          { label: { en: 'Water Temp', de: 'Wassertemperatur', ru: 'Температура воды', ja: '水温' }, value: { en: '27°C - 29°C', de: '27°C - 29°C', ru: '27°C - 29°C', ja: '27°C - 29°C' } },
        ]),
        highlights: [
          '穏やかなサンドビーチブレイク - 初心者に最適',
          '強い海流から守られた三日月型の湾、安定した波',
          '象徴的なスティルトフィッシング（高足竹の釣り）',
          '多数のサーフスクールとボードレンタル',
          'ビーチフロントのカフェとレストラン',
        ],
        dressCode: 'サーフィン用水着。日焼け防止にラッシュガード推奨。',
        etiquette: '地元サーファーとスティルトフィッシャーを尊重。ビーチにゴミ捨て禁止。サーフスクールの指示に従う。',
        photography: 'スティルトフィッシャーの撮影歓迎（チップ感謝）。岸からのサーフアクション撮影。',
        accessibility: '砂浜からアクセス可能。一部サーフスクールで適応サーフィン提供。',
        bestTime: '11月〜4月がベストコンディション。朝（7-10時）は風が弱く空いている。',
        videoDescription: 'ウェリガマ湾でのサーフセッション。穏やかな波、サーフスクール、スティルトフィッシャーを紹介。',
      },
    },
    galleryMediaIds: [],
    videoMediaIds: [],
    audioMediaIds: [],
    nearbyDestinationIds: ['galle_fort'],
    keywords: ['surfing', 'beach', 'beginner', 'stilt fishermen', 'weligama'],
    alternateNames: [],
    visitDuration: 'Half day to full day',
    published: true,
    featured: true,
    sortOrder: 3,
    sources: 'Sri Lanka Tourism, Local surf schools',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ambalangoda_masks',
    slug: 'ambalangoda-masks',
    areaId: 'west_coast',
    categoryIds: ['traditional'],
    translations: {
      en: {
        ...emptyTranslation(),
        name: 'Ambalangoda Mask Museum & Heritage',
        shortDescription: 'Center for traditional wooden Raksha mask carving and ritual folk dance heritage.',
        description: 'Ambalangoda is the historic center of Sri Lanka\'s traditional mask carving and ritual dance heritage. The Ariyapala Mask Museum showcases the art of hand-carving wooden Raksha (demon) masks from lightweight Kaduru wood, painted with traditional natural pigments. These masks were historically used in \"Sanni Yakuma\" healing rituals to ward off 18 types of illnesses and spirit afflictions. The tradition spans over 200 years with master carvers passing skills through generations.',
        historicalBackground: 'Hand-carved masks are painted using traditional natural pigments. Historically used in \"Sanni Yakuma\" healing rituals to ward off illnesses and spirit afflictions. The tradition spans 200+ years.',
        facts: createFacts([
          { label: { en: 'Wood Type', de: 'Holzart', ru: 'Материал', ja: '使用木材' }, value: { en: 'Kaduru Wood (Strychnos nux-vomica)', de: 'Kaduru-Holz', ru: 'Древесина Кадуру', ja: 'カドゥル材 (軽量な天然木)' } },
          { label: { en: 'Tradition Age', de: 'Traditionsalter', ru: 'Возраст традиции', ja: '伝統の歴史' }, value: { en: '200+ Years', de: 'Über 200 Jahre', ru: 'Более 200 лет', ja: '200年以上' } },
        ]),
        highlights: [
          'Traditional Raksha (demon) mask carving demonstrations',
          'Ariyapala Mask Museum with 100+ masks on display',
          'Sanni Yakuma ritual dance performances',
          'Master carver workshops available',
          'Purchase authentic hand-carved masks',
        ],
        dressCode: 'Casual respectful attire for museum visit.',
        etiquette: 'Do not touch masks without permission. Ask before photographing master carvers at work.',
        photography: 'Photography allowed in museum. Flash may be restricted near delicate masks.',
        accessibility: 'Museum has ramp access. Workshop areas may have uneven flooring.',
        bestTime: 'Morning (9-11 AM) for carving demonstrations. Weekdays are quieter.',
        videoDescription: 'Mask carving demonstration at Ariyapala Museum showing traditional techniques.',
      },
      de: {
        ...emptyTranslation(),
        name: 'Ambalangoda Masken-Museum & Erbe',
        shortDescription: 'Zentrum für traditionelle hölzerne Raksha-Maskenschnitzerei und rituellen Volkstanz.',
        description: 'Ambalangoda ist das historische Zentrum von Sri Lankas traditioneller Maskenschnitzerei und rituellem Tanzerbe. Das Ariyapala Masken-Museum zeigt die Kunst des handgeschnitzten Raksha (Dämonen)-Masken aus leichtem Kaduru-Holz, bemalt mit traditionellen natürlichen Pigmenten. Diese Masken wurden historisch in \"Sanni Yakuma\" Heilungsritualen verwendet, um 18 Arten von Krankheiten und Geisterbeschwörungen abzuwehren. Die Tradition reicht über 200 Jahre zurück, wobei Meisterschnitzer ihre Fähigkeiten über Generationen weitergaben.',
        historicalBackground: 'Handgeschnitzte Masken werden mit natürlichen Pigmenten bemalt und dienten historisch den \"Sanni Yakuma\" Heilungsritualen. Die Tradition reicht 200+ Jahre zurück.',
        facts: createFacts([
          { label: { en: 'Wood Type', de: 'Holzart', ru: 'Материал', ja: '使用木材' }, value: { en: 'Kaduru Wood (Strychnos nux-vomica)', de: 'Kaduru-Holz', ru: 'Древесина Кадуру', ja: 'カドゥル材 (軽量な天然木)' } },
          { label: { en: 'Tradition Age', de: 'Traditionsalter', ru: 'Возраст традиции', ja: '伝統の歴史' }, value: { en: '200+ Years', de: 'Über 200 Jahre', ru: 'Более 200 лет', ja: '200年以上' } },
        ]),
        highlights: [
          'Traditionelle Raksha (Dämonen)-Maskenschnitzvorführungen',
          'Ariyapala Masken-Museum mit 100+ Masken',
          'Sanni Yakuma Ritualtanz-Aufführungen',
          'Workshops mit Meisterschnitzern verfügbar',
          'Kauf authentischer handgeschnitzter Masken',
        ],
        dressCode: 'Lockerer, respektvoller Kleidungsstil für Museumsbesuch.',
        etiquette: 'Masken nicht ohne Erlaubnis anfassen. Vor Fotografieren von Meisterschnitzern fragen.',
        photography: 'Fotografie im Museum erlaubt. Blitz bei empfindlichen Masken eventuell eingeschränkt.',
        accessibility: 'Museum hat Rampenzugang. Werkstattbereiche können unebenen Boden haben.',
        bestTime: 'Morgens (9-11 Uhr) für Schnitzvorführungen. Wochentags ruhiger.',
        videoDescription: 'Maskenschnitzvorführung im Ariyapala Museum mit traditionellen Techniken.',
      },
      ru: {
        ...emptyTranslation(),
        name: 'Музей традиционных масок Амбалангода и наследие',
        shortDescription: 'Центр традиционной резьбы по дереву масок Ракша и ритуальных народных танцев.',
        description: 'Амбалангода — исторический центр традиционной резьбы по дереву масок и ритуальных танцев Шри-Ланки. Музей масок Арияпала демонстрирует искусство ручной резьбы по дереву масок Ракша (демоны) из легкого дерева Кадуру, окрашенных традиционными натуральными пигментами. Исторически эти маски использовались в ритуалах врачевания «Санни Якума» для избавления от 18 типов болезней и духовных недугов. Традиция насчитывает более 200 лет, мастера-передают мастерство из поколения в поколение.',
        historicalBackground: 'Маски вырезаются вручную и окрашиваются природными пигментами. Использовались в ритуалах врачевания «Санни Якума» для избавления от болезней и духовных недугов. Традиция 200+ лет.',
        facts: createFacts([
          { label: { en: 'Wood Type', de: 'Holzart', ru: 'Материал', ja: '使用木材' }, value: { en: 'Kaduru Wood (Strychnos nux-vomica)', de: 'Kaduru-Holz', ru: 'Древесина Кадуру', ja: 'カドゥル材 (軽量な天然木)' } },
          { label: { en: 'Tradition Age', de: 'Traditionsalter', ru: 'Возраст традиции', ja: '伝統の歴史' }, value: { en: '200+ Years', de: 'Über 200 Jahre', ru: 'Более 200 лет', ja: '200年以上' } },
        ]),
        highlights: [
          'Демонстрации традиционной резьбы масок Ракша (демоны)',
          'Музей масок Арияпала с 100+ масками на выставке',
          'Исполнения ритуального танца Санни Якума',
          'Мастер-классы у мастеров-резьчиков',
          'Покупка аутентичных ручной резьбы масок',
        ],
        dressCode: 'Повседневная уважающая одежда для посещения музея.',
        etiquette: 'Не трогать маски без разрешения. Спросить перед съемкой мастеров за работой.',
        photography: 'Фотография в музее разрешена. Вспышка может быть ограничена у хрупких масок.',
        accessibility: 'Мuseum имеет пандус. Мастерские могут иметь неровный пол.',
        bestTime: 'Утро (9-11) для демонстраций резьбы. Будни спокойнее.',
        videoDescription: 'Демонстрация резьбы масок в музее Арияпала с традиционными техниками.',
      },
      ja: {
        ...emptyTranslation(),
        name: 'アンバランゴダ・仮面博物館と伝統',
        shortDescription: '伝統的な木製ラクシャ（悪魔）仮面彫刻と儀式用民族舞踊の歴史的拠点。',
        description: 'アンバランゴダは、スリランカの伝統的な仮面彫刻と儀式舞踊の歴史的中心地です。アリヤパラ仮面博物館では、軽量なカドゥル材から手彫りで作られるラクシャ（悪魔）仮面の技術を展示し、天然の顔料で着色されています。これらの仮面は古くは「サンニ・ヤクマ」と呼ばれる悪魔祓い儀式で、18種類の病気や悪霊を払い退けるために使用されていました。200年以上の伝統が、職人たちによって代々受け継がれています。',
        historicalBackground: '手彫りの仮面は天然の顔料で着色されています。古くは病気や悪霊を払い退ける「サンニ・ヤクマ」と呼ばれる悪魔祓い儀式に使用されていました。200年以上の伝統。',
        facts: createFacts([
          { label: { en: 'Wood Type', de: 'Holzart', ru: 'Материал', ja: '使用木材' }, value: { en: 'Kaduru Wood (Strychnos nux-vomica)', de: 'Kaduru-Holz', ru: 'Древесина Кадуру', ja: 'カドゥル材 (軽量な天然木)' } },
          { label: { en: 'Tradition Age', de: 'Traditionsalter', ru: 'Возраст традиции', ja: '伝統の歴史' }, value: { en: '200+ Years', de: 'Über 200 Jahre', ru: 'Более 200 лет', ja: '200年以上' } },
        ]),
        highlights: [
          '伝統的なラクシャ（悪魔）仮面彫刻の実演',
          'アリヤパラ仮面博物館 - 100点以上の仮面展示',
          'サンニ・ヤクマ儀式舞踊の公演',
          '職人によるワークショップ開催',
          '本物の手彫り仮面の購入可能',
        ],
        dressCode: '博物館見学用にカジュアルで敬意を払った服装。',
        etiquette: '許可なく仮面に触れない。職人の作業風景を撮影する前は一声かける。',
        photography: '博物館内撮影可。繊細な仮面の近くではフラッシュ制限あり。',
        accessibility: '博物館にスロープあり。工房エリアは床が不揃いの場合あり。',
        bestTime: '午前中（9-11時）に彫刻実演。平日は空いている。',
        videoDescription: 'アリヤパラ博物館での仮面彫刻実演。伝統技術を紹介。',
      },
    },
    galleryMediaIds: [],
    videoMediaIds: [],
    audioMediaIds: [],
    nearbyDestinationIds: ['kande_vihara'],
    keywords: ['masks', 'traditional', 'carving', 'ritual', 'culture', 'amabalangoda'],
    alternateNames: [],
    visitDuration: '1-2 hours',
    published: true,
    featured: true,
    sortOrder: 4,
    sources: 'Ariyapala Mask Museum, Sri Lanka Department of Cultural Affairs',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialSettings: AppSettings = {
  id: 'app',
  appName: 'Explore Sri Lanka',
  defaultLanguage: 'en',
  guideWhatsAppNumber: '',
  theme: 'light',
  invitationDelayMinutes: 5,
  maxVideoSizeMb: 150,
  adminSalt: null,
  adminVerifier: null,
  failedLoginCount: 0,
  lockedUntil: null,
  lastContactsCsv: null,
  lastContactsCsvDate: null,
}

function createPlaceholderSvg(title: string, accentColor: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}"/>
      <stop offset="100%" stop-color="${accentColor}dd"/>
    </linearGradient>
    <linearGradient id="fgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff"/>
      <stop offset="100%" stop-color="#eee"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bgGrad)"/>
  <text x="400" y="280" text-anchor="middle" font-family="system-ui, sans-serif" font-size="48" font-weight="600" fill="url(#fgGrad)" opacity="0.9">${title}</text>
  <text x="400" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="url(#fgGrad)" opacity="0.7">Explore Sri Lanka</text>
  <circle cx="400" cy="440" r="60" fill="none" stroke="url(#fgGrad)" stroke-width="3" opacity="0.5"/>
  <path d="M370 440 L395 465 L430 425" fill="none" stroke="url(#fgGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
</svg>`
}

function svgToBlob(svg: string): Blob {
  return new Blob([svg], { type: 'image/svg+xml' })
}

export async function seedDatabase(): Promise<void> {
  const database = getDatabase()
  await database.transaction(
    'rw',
    [database.areas, database.categories, database.destinations, database.journeys, database.settings, database.media],
    async () => {
      // Clear existing data to ensure fresh seed
      await Promise.all([
        database.areas.clear(),
        database.categories.clear(),
        database.destinations.clear(),
        database.journeys.clear(),
        database.media.clear(),
      ])

      await database.areas.bulkAdd(areas)
      await database.categories.bulkAdd(categories)

      // Create placeholder images for each destination
      const mediaItems: LocalMedia[] = [
        {
          id: 'media-kande-vihara-1',
          fileName: 'kande-vihara-temple.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Kande Vihara Temple', '#174A35')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Kande Vihara Temple', '#174A35')),
          mediaType: 'image',
          language: null,
          destinationId: 'kande_vihara',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-kande-vihara-2',
          fileName: 'kande-vihara-bodhi.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Sacred Bodhi Tree', '#174A35')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Sacred Bodhi Tree', '#174A35')),
          mediaType: 'image',
          language: null,
          destinationId: 'kande_vihara',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-galle-fort-1',
          fileName: 'galle-fort-ramparts.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Galle Fort Ramparts', '#8B4513')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Galle Fort Ramparts', '#8B4513')),
          mediaType: 'image',
          language: null,
          destinationId: 'galle_fort',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-galle-fort-2',
          fileName: 'galle-fort-lighthouse.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Galle Lighthouse', '#8B4513')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Galle Lighthouse', '#8B4513')),
          mediaType: 'image',
          language: null,
          destinationId: 'galle_fort',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-weligama-1',
          fileName: 'weligama-beach.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Weligama Beach', '#0077B6')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Weligama Beach', '#0077B6')),
          mediaType: 'image',
          language: null,
          destinationId: 'weligama_surf',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-weligama-2',
          fileName: 'weligama-surf.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Surfing Weligama', '#0077B6')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Surfing Weligama', '#0077B6')),
          mediaType: 'image',
          language: null,
          destinationId: 'weligama_surf',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-ambalangoda-1',
          fileName: 'ambalangoda-masks.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Traditional Masks', '#C5A15D')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Traditional Masks', '#C5A15D')),
          mediaType: 'image',
          language: null,
          destinationId: 'ambalangoda_masks',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'media-ambalangoda-2',
          fileName: 'ambalangoda-carving.svg',
          mimeType: 'image/svg+xml',
          fileSize: 0,
          blob: svgToBlob(createPlaceholderSvg('Mask Carving', '#C5A15D')),
          thumbnailBlob: svgToBlob(createPlaceholderSvg('Mask Carving', '#C5A15D')),
          mediaType: 'image',
          language: null,
          destinationId: 'ambalangoda_masks',
          createdAt: new Date().toISOString(),
        },
      ]

      await database.media.bulkAdd(mediaItems)

      // Update destinations with media IDs
      const destinationsWithMedia = destinations.map((d) => {
        const mediaIds = mediaItems.filter((m) => m.destinationId === d.id).map((m) => m.id)
        return { ...d, galleryMediaIds: mediaIds }
      })

      await database.destinations.bulkAdd(destinationsWithMedia)

      if ((await database.journeys.count()) === 0) {
        await database.journeys.add({
          id: 'coastal-highlights',
          name: { en: 'Coastal Highlights', de: 'Küsten-Highlights', ru: 'Прибрежные достопримечательности', ja: '海岸ハイライト' },
          description: { en: 'Best of South & West Coast', de: 'Bestes der Süd- & Westküste', ru: 'Лучшее Южного и Западного побережья', ja: '南海岸と西海岸のベスト' },
          destinationIds: ['galle_fort', 'weligama_surf', 'kande_vihara', 'ambalangoda_masks'],
          sortOrder: 1,
          active: true,
          featured: true,
        })
      }
      if (!(await database.settings.get('app'))) await database.settings.add(initialSettings)
    },
  )
}

export function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'de' || value === 'ru' || value === 'ja'
}
export interface TravelGuide {
  slug: string;
  city: string;
  country: string;
  region: string;
  tagline: string;
  description: string;
  image: string;
  heroImage: string;
  bestTime: string;
  currency: string;
  language: string;
  timezone: string;
  overview: string;
  topAttractions: Array<{
    name: string;
    description: string;
    tip: string;
  }>;
  foodAndDrink: Array<{
    name: string;
    description: string;
  }>;
  neighborhoods: Array<{
    name: string;
    description: string;
    bestFor: string;
  }>;
  practicalTips: string[];
  budgetPerDay: {
    budget: string;
    midRange: string;
    luxury: string;
  };
}

export const travelGuides: TravelGuide[] = [
  {
    slug: 'paris-france',
    city: 'Paris',
    country: 'France',
    region: 'Europe',
    tagline: 'The City of Light',
    description: 'Romance, art, cuisine, and timeless elegance await in the French capital.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1600&q=80',
    bestTime: 'April to June, September to October',
    currency: 'Euro (EUR)',
    language: 'French',
    timezone: 'CET (UTC+1)',
    overview: `Paris, the capital of France, is one of the world's most iconic cities. Known for its stunning architecture, world-class museums, exquisite cuisine, and romantic ambiance, Paris offers an unparalleled travel experience.

From the iconic Eiffel Tower to the artistic treasures of the Louvre, from charming Montmartre streets to elegant Champs-Élysées boulevards, every corner of Paris tells a story. The city seamlessly blends its rich history with modern sophistication, making it a destination that captivates first-time visitors and seasoned travelers alike.

Whether you're savoring croissants at a sidewalk café, strolling along the Seine at sunset, or exploring hidden passages and boutiques, Paris promises moments of magic that stay with you forever.`,
    topAttractions: [
      {
        name: 'Eiffel Tower',
        description: 'The iconic iron lattice tower offering panoramic views of Paris from its observation decks. Best visited at sunset or after dark when illuminated.',
        tip: 'Book tickets online in advance to skip long queues. Consider the stairs to the second floor for a unique experience.',
      },
      {
        name: 'Louvre Museum',
        description: 'The world\'s largest art museum, home to the Mona Lisa, Venus de Milo, and over 35,000 works spanning 9,000 years of history.',
        tip: 'Visit on Wednesday or Friday evenings when the museum stays open late with fewer crowds.',
      },
      {
        name: 'Montmartre & Sacré-Cœur',
        description: 'A charming hilltop neighborhood with cobblestone streets, artists, and the stunning white-domed Basilica of the Sacred Heart.',
        tip: 'Explore early morning to avoid crowds and catch artists setting up in Place du Tertre.',
      },
      {
        name: 'Notre-Dame Cathedral',
        description: 'The masterpiece of French Gothic architecture, currently under restoration after the 2019 fire but still impressive from outside.',
        tip: 'Walk around the exterior and explore the nearby Île de la Cité for medieval Paris charm.',
      },
      {
        name: 'Musée d\'Orsay',
        description: 'Housed in a former railway station, featuring the world\'s finest collection of Impressionist and Post-Impressionist masterpieces.',
        tip: 'Visit after 4:30 PM on Thursdays for reduced admission and a quieter experience.',
      },
    ],
    foodAndDrink: [
      {
        name: 'Croissants & Pastries',
        description: 'Start your morning at a local boulangerie with butter-rich croissants, pain au chocolat, or delicate madeleines.',
      },
      {
        name: 'French Onion Soup',
        description: 'A warming bowl of caramelized onion broth topped with crusty bread and melted Gruyère cheese.',
      },
      {
        name: 'Steak Frites',
        description: 'The quintessential Parisian bistro dish: perfectly cooked steak with crispy golden fries.',
      },
      {
        name: 'Macarons',
        description: 'Delicate almond meringue cookies from famous patisseries like Ladurée or Pierre Hermé.',
      },
      {
        name: 'Wine & Cheese',
        description: 'Experience an authentic French aperitif with local wines and artisanal cheeses at wine bars throughout the city.',
      },
    ],
    neighborhoods: [
      {
        name: 'Le Marais',
        description: 'Historic Jewish quarter with trendy boutiques, art galleries, falafel shops, and beautiful Place des Vosges.',
        bestFor: 'Shopping, nightlife, LGBTQ+ scene',
      },
      {
        name: 'Saint-Germain-des-Prés',
        description: 'The literary heart of Paris with famous cafés, antique shops, and upscale boutiques.',
        bestFor: 'Café culture, intellectual atmosphere',
      },
      {
        name: 'Latin Quarter',
        description: 'Student-filled neighborhood around the Sorbonne with bookshops, affordable eateries, and the Panthéon.',
        bestFor: 'Budget dining, bookstores, history',
      },
      {
        name: 'Montmartre',
        description: 'Artistic hilltop village with windmills, cabarets, and stunning city views.',
        bestFor: 'Romance, art, panoramic views',
      },
    ],
    practicalTips: [
      'Learn basic French phrases—locals appreciate the effort even if they speak English',
      'Metro is the fastest way to get around; buy a carnet (book of 10 tickets) for savings',
      'Most shops close on Sundays; plan museum visits for these days',
      'Tipping is not obligatory as service is included, but rounding up is appreciated',
      'Carry cash for smaller cafés and bakeries that may not accept cards',
      'Dress smart casual—Parisians are stylish but not overly formal',
      'Book popular restaurants and attractions well in advance, especially in peak season',
    ],
    budgetPerDay: {
      budget: '$80-120 (hostels, picnics, free attractions)',
      midRange: '$200-350 (boutique hotels, bistro dining)',
      luxury: '$500+ (palace hotels, Michelin restaurants)',
    },
  },
  {
    slug: 'tokyo-japan',
    city: 'Tokyo',
    country: 'Japan',
    region: 'Asia',
    tagline: 'Where Tradition Meets Tomorrow',
    description: 'A dazzling metropolis blending ancient temples with cutting-edge technology and pop culture.',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600&q=80',
    bestTime: 'March to May (cherry blossoms), October to November (autumn colors)',
    currency: 'Japanese Yen (JPY)',
    language: 'Japanese',
    timezone: 'JST (UTC+9)',
    overview: `Tokyo is a city of extraordinary contrasts—a place where ancient Shinto shrines stand in the shadow of neon-lit skyscrapers, where centuries-old tea ceremonies exist alongside robot restaurants, and where impeccable tradition meets relentless innovation.

As the world's most populous metropolitan area, Tokyo can seem overwhelming at first. But beneath the surface chaos lies an incredibly organized, safe, and welcoming city. Each neighborhood has its own distinct personality, from the youth fashion of Harajuku to the electronics paradise of Akihabara, from the historic temples of Asakusa to the upscale elegance of Ginza.

Tokyo's culinary scene is unmatched, with more Michelin stars than any other city on earth. Yet some of the best meals can be found in tiny ramen shops, conveyor-belt sushi restaurants, or standing-only noodle bars. Every experience in Tokyo, no matter how small, is executed with care and precision.`,
    topAttractions: [
      {
        name: 'Senso-ji Temple',
        description: 'Tokyo\'s oldest and most significant Buddhist temple, featuring the iconic Thunder Gate, a bustling shopping street, and beautiful pagoda.',
        tip: 'Visit early morning (before 7 AM) to experience the temple without crowds and watch monks perform morning rituals.',
      },
      {
        name: 'Shibuya Crossing',
        description: 'The world\'s busiest pedestrian intersection, where up to 3,000 people cross simultaneously—an iconic symbol of Tokyo\'s energy.',
        tip: 'Watch from the Starbucks above or Shibuya Sky observation deck for the best view.',
      },
      {
        name: 'Meiji Shrine',
        description: 'A peaceful Shinto shrine dedicated to Emperor Meiji, set within a tranquil forest in the heart of the city.',
        tip: 'Time your visit to witness a traditional wedding procession—they occur throughout the day.',
      },
      {
        name: 'teamLab Borderless/Planets',
        description: 'Immersive digital art museums where you walk through flowing, interactive light installations.',
        tip: 'Book tickets weeks in advance as they sell out quickly. Wear comfortable, light-colored clothing.',
      },
      {
        name: 'Tsukiji Outer Market',
        description: 'While the inner market moved, the outer market remains a foodie paradise with fresh seafood, Japanese knives, and street food.',
        tip: 'Arrive early (8-10 AM) for the freshest sushi breakfast experience.',
      },
    ],
    foodAndDrink: [
      {
        name: 'Ramen',
        description: 'Rich, flavorful noodle soup in countless regional styles—try tonkotsu (pork bone) in Shinjuku or shoyu (soy sauce) in traditional shops.',
      },
      {
        name: 'Sushi & Sashimi',
        description: 'From Michelin-starred omakase to conveyor-belt chains, Tokyo offers sushi at every price point and quality level.',
      },
      {
        name: 'Izakaya Experience',
        description: 'Japanese gastropubs serving small plates meant for sharing alongside beer, sake, and highballs.',
      },
      {
        name: 'Wagyu Beef',
        description: 'Melt-in-your-mouth Japanese beef, best enjoyed as yakiniku (grilled) or teppanyaki.',
      },
      {
        name: 'Depachika',
        description: 'Department store basement food halls offering incredible prepared foods, sweets, and bento boxes.',
      },
    ],
    neighborhoods: [
      {
        name: 'Shinjuku',
        description: 'The bustling hub with the world\'s busiest train station, towering skyscrapers, and vibrant Golden Gai bar alley.',
        bestFor: 'Nightlife, observation decks, entertainment',
      },
      {
        name: 'Shibuya',
        description: 'Youth culture central with fashion boutiques, the famous crossing, and trendy cafés.',
        bestFor: 'Shopping, people-watching, nightlife',
      },
      {
        name: 'Harajuku',
        description: 'The epicenter of Japanese youth fashion and subcultures, with quirky shops and Takeshita Street.',
        bestFor: 'Street fashion, unique shops, crepes',
      },
      {
        name: 'Asakusa',
        description: 'Old Tokyo atmosphere with Senso-ji Temple, traditional shops, and riverside views of Tokyo Skytree.',
        bestFor: 'History, traditional crafts, temples',
      },
    ],
    practicalTips: [
      'Get a Suica or Pasmo IC card for seamless train, bus, and convenience store payments',
      'Download Japan\'s train apps (Google Maps works well) for navigation',
      'Cash is still king in many places—ATMs in 7-Eleven accept foreign cards',
      'Tipping is not customary and can even be considered rude',
      'Remove shoes when entering homes, some restaurants, and traditional accommodations',
      'Train etiquette: keep phones on silent mode and avoid talking on phones',
      'Consider a JR Pass only if you\'re taking multiple shinkansen (bullet train) trips',
    ],
    budgetPerDay: {
      budget: '$70-100 (capsule hotels, convenience store meals, free shrines)',
      midRange: '$150-250 (business hotels, mix of restaurants)',
      luxury: '$400+ (ryokan stays, high-end sushi omakase)',
    },
  },
  {
    slug: 'new-york-usa',
    city: 'New York City',
    country: 'United States',
    region: 'North America',
    tagline: 'The City That Never Sleeps',
    description: 'An electrifying metropolis of iconic landmarks, world-class culture, and endless energy.',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80',
    bestTime: 'April to June, September to November',
    currency: 'US Dollar (USD)',
    language: 'English',
    timezone: 'EST (UTC-5)',
    overview: `New York City needs no introduction. It's the city of Broadway shows and Wall Street deals, of Central Park strolls and Times Square spectacles, of world-renowned museums and legendary pizza joints. NYC is a place where dreams are chased, cultures collide, and every block tells a different story.

Spread across five distinct boroughs—Manhattan, Brooklyn, Queens, The Bronx, and Staten Island—New York offers an inexhaustible array of experiences. You could spend a lifetime here and never discover it all. The energy is palpable: the honking taxis, the steam rising from subway grates, the diverse crowds rushing to their next destination.

From the observation decks of skyscrapers to the green oasis of Central Park, from Michelin-starred restaurants to $1 pizza slices, NYC caters to every budget and interest. It's a city that challenges, inspires, and transforms everyone who visits.`,
    topAttractions: [
      {
        name: 'Statue of Liberty & Ellis Island',
        description: 'The iconic symbol of freedom and the historic gateway for millions of immigrants to America.',
        tip: 'Book crown access months in advance. Take the first ferry to avoid crowds.',
      },
      {
        name: 'Central Park',
        description: 'An 843-acre urban oasis with gardens, lakes, walking paths, and countless recreational activities.',
        tip: 'Rent a bike for efficient exploration. Don\'t miss Bethesda Fountain and the Bow Bridge.',
      },
      {
        name: 'Empire State Building',
        description: 'The Art Deco masterpiece offering 360-degree views of Manhattan from its 86th-floor observatory.',
        tip: 'Visit at sunset for day and night views, or late night (after 11 PM) for no lines.',
      },
      {
        name: 'Metropolitan Museum of Art',
        description: 'One of the world\'s greatest art museums with over 2 million works spanning 5,000 years.',
        tip: 'The museum is pay-what-you-wish for NY residents. Focus on specific sections rather than trying to see everything.',
      },
      {
        name: 'Brooklyn Bridge',
        description: 'Walk across this 1883 engineering marvel for stunning views of the Manhattan skyline.',
        tip: 'Walk from Brooklyn to Manhattan for the best skyline views. Early morning or sunset is magical.',
      },
    ],
    foodAndDrink: [
      {
        name: 'New York Pizza',
        description: 'Thin-crust, foldable slices from iconic spots like Joe\'s Pizza, Di Fara, or Prince Street Pizza.',
      },
      {
        name: 'Bagels',
        description: 'Chewy, authentic bagels with cream cheese and lox from Russ & Daughters or Ess-a-Bagel.',
      },
      {
        name: 'Pastrami Sandwich',
        description: 'Towering deli sandwiches from legendary spots like Katz\'s Delicatessen.',
      },
      {
        name: 'Global Cuisine',
        description: 'NYC offers authentic food from every corner of the world—Chinatown dim sum, Little Italy pasta, Queens\' international flavors.',
      },
      {
        name: 'Craft Cocktails',
        description: 'Speakeasy bars and innovative cocktail lounges define NYC\'s nightlife scene.',
      },
    ],
    neighborhoods: [
      {
        name: 'Manhattan - Midtown',
        description: 'The tourist heart with Times Square, Broadway theaters, Rockefeller Center, and major shopping.',
        bestFor: 'First-time visitors, shows, landmarks',
      },
      {
        name: 'Manhattan - SoHo/West Village',
        description: 'Cobblestone streets, boutique shopping, excellent restaurants, and charming brownstones.',
        bestFor: 'Shopping, dining, strolling',
      },
      {
        name: 'Brooklyn - Williamsburg',
        description: 'Hipster haven with craft breweries, vintage shops, art galleries, and waterfront views.',
        bestFor: 'Nightlife, street art, local vibes',
      },
      {
        name: 'Brooklyn - DUMBO',
        description: 'Stunning Manhattan views, converted warehouses, and the iconic Brooklyn Bridge photo spot.',
        bestFor: 'Photography, coffee shops, views',
      },
    ],
    practicalTips: [
      'Get an unlimited MetroCard for 7 days if you plan to use the subway frequently',
      'Walk whenever possible—many attractions are closer than they appear on the map',
      'Tipping is expected: 18-20% at restaurants, $1-2 per drink at bars',
      'Broadway shows: try TKTS booth in Times Square for same-day discounted tickets',
      'Many museums have free or pay-what-you-wish hours—research in advance',
      'Book restaurants in advance, especially trendy spots and high-end establishments',
      'Stay alert and keep belongings secure, especially in crowded areas',
    ],
    budgetPerDay: {
      budget: '$100-150 (hostels, $1 pizza, free parks and walking)',
      midRange: '$250-400 (boutique hotels, nice restaurants)',
      luxury: '$600+ (luxury hotels, Broadway, fine dining)',
    },
  },
  {
    slug: 'barcelona-spain',
    city: 'Barcelona',
    country: 'Spain',
    region: 'Europe',
    tagline: 'Mediterranean Magic',
    description: 'A vibrant coastal city where Gothic architecture meets Gaudí masterpieces, beaches, and endless tapas.',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1600&q=80',
    bestTime: 'May to June, September to October',
    currency: 'Euro (EUR)',
    language: 'Spanish, Catalan',
    timezone: 'CET (UTC+1)',
    overview: `Barcelona is a city that captivates all senses. Located on Spain's northeastern Mediterranean coast, it combines the best of beach life, urban culture, and architectural wonder in one irresistible package.

The city is defined by the visionary works of Antoni Gaudí, whose fantastical creations—from the still-unfinished Sagrada Familia to the whimsical Park Güell—dot the cityscape like fever dreams made real. But Barcelona's appeal extends far beyond its architecture: the Gothic Quarter's medieval maze, La Rambla's endless energy, the beach culture of Barceloneta, and the foodie paradise of El Born all contribute to its magic.

Barcelona runs on its own schedule. Lunch starts at 2 PM, dinner rarely before 9 PM, and the nightlife continues until dawn. This is a city that celebrates life, art, and good food with passionate intensity.`,
    topAttractions: [
      {
        name: 'La Sagrada Familia',
        description: 'Gaudí\'s unfinished masterpiece, a basilica under construction since 1882, with mind-bending facades and light-filled interiors.',
        tip: 'Book tickets 2-3 weeks in advance. The 9 AM slot offers the best interior light. Consider the tower tour.',
      },
      {
        name: 'Park Güell',
        description: 'A colorful hilltop park featuring Gaudí\'s mosaic works, the famous serpent bench, and panoramic city views.',
        tip: 'Book timed entry for the Monumental Zone. Visit at opening (8:30 AM) or sunset for best photos.',
      },
      {
        name: 'Gothic Quarter (Barri Gòtic)',
        description: 'The medieval heart of Barcelona with narrow winding streets, hidden plazas, the Cathedral, and Roman ruins.',
        tip: 'Get deliberately lost—the best discoveries happen when you wander without a plan.',
      },
      {
        name: 'La Boqueria Market',
        description: 'A vibrant food market on La Rambla with fresh produce, seafood, jamón, and counter-service eateries.',
        tip: 'Visit mid-morning on weekdays to avoid cruise ship crowds. Head to the back stalls for better prices.',
      },
      {
        name: 'Casa Batlló',
        description: 'Another Gaudí masterpiece—a building with a skeletal facade, colorful tiles, and fantastical interior.',
        tip: 'The night experience with live music is magical. Book the first or last slot of the day.',
      },
    ],
    foodAndDrink: [
      {
        name: 'Tapas',
        description: 'Small plates meant for sharing—patatas bravas, pan con tomate, jamón ibérico, and countless others.',
      },
      {
        name: 'Paella',
        description: 'The iconic Spanish rice dish, best enjoyed at seaside restaurants in Barceloneta (traditional is with rabbit and snails).',
      },
      {
        name: 'Pintxos',
        description: 'Basque-style small bites on toothpicks, often found in bars throughout El Born and Gràcia.',
      },
      {
        name: 'Vermouth',
        description: 'The pre-lunch aperitif tradition—sweet vermouth served with olives and chips at old-school bars.',
      },
      {
        name: 'Crema Catalana',
        description: 'The Catalan cousin of crème brûlée, flavored with cinnamon and citrus.',
      },
    ],
    neighborhoods: [
      {
        name: 'Gothic Quarter',
        description: 'Medieval streets, the Cathedral, hidden plazas, and the heart of old Barcelona.',
        bestFor: 'History, atmosphere, evening drinks',
      },
      {
        name: 'El Born',
        description: 'Trendy area with boutiques, cocktail bars, the Picasso Museum, and Santa Maria del Mar church.',
        bestFor: 'Nightlife, shopping, dining',
      },
      {
        name: 'Gràcia',
        description: 'Bohemian neighborhood with local plazas, independent shops, and a village-within-a-city feel.',
        bestFor: 'Local life, cafés, authentic vibe',
      },
      {
        name: 'Barceloneta',
        description: 'The beach neighborhood with seafood restaurants, promenades, and Mediterranean swimming.',
        bestFor: 'Beach, seafood, casual atmosphere',
      },
    ],
    practicalTips: [
      'Book major Gaudí attractions well in advance—they sell out',
      'Siesta is real: many shops close 2-5 PM. Plan museums or beach time during these hours',
      'Learn a few Catalan phrases—locals appreciate it more than Spanish in some contexts',
      'Watch for pickpockets on La Rambla and in crowded metro stations',
      'Eat on Spanish time: lunch 2-4 PM, dinner after 9 PM for the best experience',
      'The T-Casual card offers 10 metro/bus trips at a discount',
      'Many attractions are free on the first Sunday of each month',
    ],
    budgetPerDay: {
      budget: '$70-100 (hostels, tapas bars, free walking)',
      midRange: '$150-250 (boutique hotels, good restaurants)',
      luxury: '$350+ (luxury hotels, Michelin dining)',
    },
  },
  {
    slug: 'bali-indonesia',
    city: 'Bali',
    country: 'Indonesia',
    region: 'Asia',
    tagline: 'Island of the Gods',
    description: 'A tropical paradise of rice terraces, ancient temples, surf breaks, and spiritual retreats.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1600&q=80',
    bestTime: 'April to October (dry season)',
    currency: 'Indonesian Rupiah (IDR)',
    language: 'Indonesian, Balinese',
    timezone: 'WITA (UTC+8)',
    overview: `Bali is more than just a destination—it's a feeling. This Indonesian island has long captivated travelers with its unique blend of natural beauty, rich spirituality, warm hospitality, and vibrant culture. From the moment you arrive, the scent of incense and frangipani flowers signals that you've entered somewhere special.

The island offers remarkable diversity in a compact space. In the south, you'll find world-class surf breaks, beach clubs, and nightlife. Head inland to Ubud for rice terraces, yoga retreats, and traditional arts. The north and east coasts offer quieter beaches, volcanic landscapes, and authentic village life.

Balinese Hinduism permeates daily life here. Elaborate temples dot the landscape, daily offerings line the streets, and ceremonies and festivals occur constantly. This spiritual dimension gives Bali a depth that keeps visitors returning year after year.`,
    topAttractions: [
      {
        name: 'Tegallalang Rice Terraces',
        description: 'Iconic cascading rice paddies near Ubud, showcasing the ancient Balinese irrigation system called subak.',
        tip: 'Arrive at 7-8 AM to avoid crowds and heat. Many cafés along the terraces offer breakfast with views.',
      },
      {
        name: 'Uluwatu Temple',
        description: 'A dramatic clifftop temple on the southern peninsula with stunning sunset views and nightly Kecak fire dance.',
        tip: 'Attend the Kecak performance at sunset—book early as it sells out. Watch for mischievous monkeys.',
      },
      {
        name: 'Ubud Monkey Forest',
        description: 'A sacred sanctuary of over 700 long-tailed macaques in a lush jungle setting with ancient temples.',
        tip: 'Don\'t bring food or dangling items. Visit late afternoon when monkeys are more active.',
      },
      {
        name: 'Tirta Empul Temple',
        description: 'A water temple where Balinese and visitors participate in purification rituals at sacred spring pools.',
        tip: 'Bring a sarong (or rent one). Participate respectfully in the purification ceremony—it\'s a moving experience.',
      },
      {
        name: 'Mount Batur Sunrise Trek',
        description: 'An active volcano hike rewarded with spectacular sunrise views over the caldera and Lake Batur.',
        tip: 'Book a guide the day before. It\'s a 2 AM start but absolutely worth it. Bring warm layers.',
      },
    ],
    foodAndDrink: [
      {
        name: 'Nasi Goreng',
        description: 'Indonesian fried rice served with egg, prawns or chicken, pickled vegetables, and krupuk crackers.',
      },
      {
        name: 'Babi Guling',
        description: 'Balinese suckling pig roasted with turmeric and spices—a ceremonial dish now available at warungs.',
      },
      {
        name: 'Satay',
        description: 'Skewered and grilled meat served with peanut sauce, rice cakes, and pickles.',
      },
      {
        name: 'Smoothie Bowls',
        description: 'Bali\'s health food scene offers Instagram-worthy acai and tropical fruit bowls at every café.',
      },
      {
        name: 'Kopi Luwak',
        description: 'The world\'s most expensive coffee, made from beans eaten and excreted by civet cats (seek ethical sources).',
      },
    ],
    neighborhoods: [
      {
        name: 'Ubud',
        description: 'The cultural heart of Bali with rice terraces, yoga studios, art galleries, and the famous Monkey Forest.',
        bestFor: 'Wellness, culture, nature',
      },
      {
        name: 'Seminyak',
        description: 'Upscale beach area with designer boutiques, beach clubs, fine dining, and vibrant nightlife.',
        bestFor: 'Shopping, dining, beach clubs',
      },
      {
        name: 'Canggu',
        description: 'Laid-back surf town with digital nomads, hip cafés, and a more local vibe than Seminyak.',
        bestFor: 'Surfing, cafés, young travelers',
      },
      {
        name: 'Uluwatu',
        description: 'Southern peninsula with dramatic cliffs, world-class surf breaks, and luxury cliff-top resorts.',
        bestFor: 'Surfing, sunset views, luxury',
      },
    ],
    practicalTips: [
      'Rent a scooter for flexibility, but only if you\'re experienced—traffic can be chaotic',
      'Always negotiate prices at markets; start at 30-40% of the asking price',
      'Dress modestly at temples: cover shoulders and knees, wear a sarong (often provided)',
      'Bring cash in Rupiah; many places don\'t accept cards, and ATM fees add up',
      'Respect ceremony days (Nyepi, full moon) when some activities may be limited',
      'Book a private driver for day trips—it\'s affordable and safer than self-driving',
      'Stay hydrated and use reef-safe sunscreen for ocean activities',
    ],
    budgetPerDay: {
      budget: '$30-50 (guesthouses, local warungs, scooter)',
      midRange: '$80-150 (boutique hotels, mix of dining)',
      luxury: '$250+ (private villas, beach clubs, fine dining)',
    },
  },
];

export function getTravelGuide(slug: string): TravelGuide | undefined {
  return travelGuides.find((guide) => guide.slug === slug);
}

export function getGuidesByRegion(region: string): TravelGuide[] {
  return travelGuides.filter((guide) => guide.region === region);
}

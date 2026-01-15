/**
 * Seed script to create sample itinerary data for testing
 *
 * Usage:
 *   npx tsx scripts/seed-itinerary.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedItinerary() {
  console.log('🌱 Starting itinerary seed...\n');

  // Get or create a user (you'll need to replace this with your actual user ID)
  console.log('📋 Checking for user...');
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.error('❌ No users found. Please sign up first at http://localhost:3000');
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`✅ Using user: ${users[0].email}\n`);

  // Create sample trip
  console.log('🗾 Creating sample Tokyo trip...');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30); // 30 days from now
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 4); // 5 days trip

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      title: 'Tokyo Adventure 2025',
      destination: {
        name: 'Tokyo, Japan',
        place_id: 'ChIJ51cu8IcbXWARiRtXIothAS4',
        coordinates: { lat: 35.6762, lng: 139.6503 }
      },
      dates: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      party_json: { adults: 2 },
      status: 'planning',
      budget_range: [2000, 4000],
      privacy: 'shared' // Changed from 'private' to allow unauthenticated access
    })
    .select()
    .single();

  if (tripError) {
    console.error('❌ Error creating trip:', tripError);
    process.exit(1);
  }

  console.log(`✅ Created trip: ${trip.title} (ID: ${trip.id})\n`);

  // Sample cards for the itinerary
  // Note: day, time_slot, order are not in the database schema yet
  // They are stored in payload_json for now
  const cards = [
    // Day 1 - Hotel
    {
      trip_id: trip.id,
      type: 'hotel',
      labels: ['confirmed'],
      favorite: true,
      payload_json: {
        day: 1,
        order: 0,
        time_slot: '15:00',
        name: 'Park Hyatt Tokyo',
        address: '3-7-1-2 Nishi Shinjuku, Shinjuku City, Tokyo 163-1055, Japan',
        coordinates: { lat: 35.6856, lng: 139.6917 },
        price_range: [400, 800],
        rating: 4.6,
        amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym'],
        photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
        url: 'https://www.hyatt.com/en-US/hotel/japan/park-hyatt-tokyo',
        pros: ['Stunning city views', 'Luxurious rooms', 'Central location'],
        cost: 600,
        currency: 'USD'
      }
    },

    // Day 1 - Evening Activity
    {
      trip_id: trip.id,
      type: 'activity',
      labels: ['shortlist'],
      favorite: false,
      payload_json: {
        day: 1,
        order: 1,
        time_slot: '18:00',
        name: 'Shibuya Crossing Evening Walk',
        address: 'Shibuya City, Tokyo, Japan',
        coordinates: { lat: 35.6595, lng: 139.7004 },
        type: 'Sightseeing',
        duration: '2 hours',
        rating: 4.8,
        photos: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'],
        description: 'Experience the iconic Shibuya Crossing and explore the vibrant neighborhood',
        cost: 0,
        currency: 'USD'
      }
    },

    // Day 1 - Dinner
    {
      trip_id: trip.id,
      type: 'food',
      day: 1,
      order: 2,
      time_slot: '20:00',
      labels: ['considering'],
      favorite: false,
      payload_json: {
        name: 'Ichiran Ramen Shibuya',
        address: '1 Chome-22-7 Jinnan, Shibuya City, Tokyo 150-0041, Japan',
        coordinates: { lat: 35.6627, lng: 139.6987 },
        cuisine_type: 'Ramen',
        price_level: 2,
        rating: 4.3,
        photos: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800'],
        dietary_tags: ['Vegetarian options available'],
        cost: 30,
        currency: 'USD'
      }
    },

    // Day 2 - Morning Activity
    {
      trip_id: trip.id,
      type: 'spot',
      day: 2,
      order: 0,
      time_slot: '09:00',
      labels: ['shortlist'],
      favorite: true,
      payload_json: {
        name: 'Senso-ji Temple',
        address: '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
        coordinates: { lat: 35.7148, lng: 139.7967 },
        type: 'Temple',
        rating: 4.7,
        photos: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'],
        description: "Tokyo's oldest temple with stunning architecture and traditional atmosphere",
        opening_hours: '6:00 AM - 5:00 PM',
        cost: 0,
        currency: 'USD'
      }
    },

    // Day 2 - Lunch
    {
      trip_id: trip.id,
      type: 'food',
      day: 2,
      order: 1,
      time_slot: '12:30',
      labels: ['shortlist'],
      favorite: false,
      payload_json: {
        name: 'Sushi Dai',
        address: '5 Chome-2-1 Tsukiji, Chuo City, Tokyo 104-0045, Japan',
        coordinates: { lat: 35.6654, lng: 139.7707 },
        cuisine_type: 'Sushi',
        price_level: 3,
        rating: 4.6,
        photos: ['https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800'],
        opening_hours: '5:30 AM - 1:30 PM',
        cost: 50,
        currency: 'USD'
      }
    },

    // Day 2 - Afternoon Activity
    {
      trip_id: trip.id,
      type: 'spot',
      day: 2,
      order: 2,
      time_slot: '14:30',
      labels: ['considering'],
      favorite: false,
      payload_json: {
        name: 'teamLab Borderless',
        address: 'Azabudai Hills Garden Plaza B B1, 5-chōme-8 Toranomon, Minato City, Tokyo 105-0001, Japan',
        coordinates: { lat: 35.6605, lng: 139.7453 },
        type: 'Museum',
        rating: 4.8,
        photos: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
        description: 'Digital art museum with immersive interactive installations',
        opening_hours: '10:00 AM - 7:00 PM',
        cost: 38,
        currency: 'USD'
      }
    },

    // Day 3 - Morning Activity
    {
      trip_id: trip.id,
      type: 'spot',
      day: 3,
      order: 0,
      time_slot: '08:00',
      labels: ['confirmed'],
      favorite: true,
      payload_json: {
        name: 'Tsukiji Outer Market',
        address: '4 Chome Tsukiji, Chuo City, Tokyo 104-0045, Japan',
        coordinates: { lat: 35.6654, lng: 139.7707 },
        type: 'Market',
        rating: 4.5,
        photos: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'],
        description: 'Famous fish market with fresh seafood and street food',
        opening_hours: '5:00 AM - 2:00 PM',
        cost: 0,
        currency: 'USD'
      }
    },

    // Day 3 - Afternoon Activity
    {
      trip_id: trip.id,
      type: 'spot',
      day: 3,
      order: 1,
      time_slot: '13:00',
      labels: ['shortlist'],
      favorite: false,
      payload_json: {
        name: 'Meiji Shrine',
        address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan',
        coordinates: { lat: 35.6764, lng: 139.6993 },
        type: 'Shrine',
        rating: 4.6,
        photos: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800'],
        description: 'Peaceful Shinto shrine surrounded by forest in the heart of Tokyo',
        opening_hours: 'Dawn to Dusk',
        cost: 0,
        currency: 'USD'
      }
    },

    // Day 3 - Evening Activity
    {
      trip_id: trip.id,
      type: 'activity',
      day: 3,
      order: 2,
      time_slot: '18:00',
      labels: ['considering'],
      favorite: true,
      payload_json: {
        name: 'Tokyo Tower Night View',
        address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan',
        coordinates: { lat: 35.6586, lng: 139.7454 },
        type: 'Observation Deck',
        duration: '1.5 hours',
        price: 25,
        rating: 4.4,
        photos: ['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],
        description: 'Iconic tower with panoramic city views, especially stunning at night',
        cost: 25,
        currency: 'USD'
      }
    },

    // Day 4 - Day Trip
    {
      trip_id: trip.id,
      type: 'activity',
      day: 4,
      order: 0,
      time_slot: '08:00',
      labels: ['shortlist'],
      favorite: true,
      payload_json: {
        name: 'Mount Fuji & Hakone Day Trip',
        address: 'Hakone, Kanagawa Prefecture, Japan',
        coordinates: { lat: 35.3606, lng: 138.7274 },
        type: 'Tour',
        duration: 'Full day (10 hours)',
        price: 150,
        rating: 4.7,
        photos: ['https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800'],
        description: 'Guided tour to Mount Fuji, Lake Ashi cruise, and hot springs',
        cost: 150,
        currency: 'USD'
      }
    },

    // Day 5 - Morning Shopping
    {
      trip_id: trip.id,
      type: 'activity',
      day: 5,
      order: 0,
      time_slot: '10:00',
      labels: ['considering'],
      favorite: false,
      payload_json: {
        name: 'Harajuku & Takeshita Street',
        address: 'Jingumae, Shibuya City, Tokyo, Japan',
        coordinates: { lat: 35.6702, lng: 139.7026 },
        type: 'Shopping',
        duration: '3 hours',
        rating: 4.5,
        photos: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'],
        description: 'Trendy shopping street with unique fashion and street food',
        cost: 100,
        currency: 'USD'
      }
    },

    // Day 5 - Farewell Lunch
    {
      trip_id: trip.id,
      type: 'food',
      day: 5,
      order: 1,
      time_slot: '13:00',
      labels: ['shortlist'],
      favorite: false,
      payload_json: {
        name: 'Narisawa',
        address: '2 Chome-6-15 Minami-Aoyama, Minato City, Tokyo 107-0062, Japan',
        coordinates: { lat: 35.6644, lng: 139.7189 },
        cuisine_type: 'Contemporary Japanese',
        price_level: 4,
        rating: 4.8,
        photos: ['https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800'],
        opening_hours: '12:00 PM - 2:00 PM, 6:00 PM - 9:00 PM',
        cost: 250,
        currency: 'USD'
      }
    },

    // Unscheduled activities
    {
      trip_id: trip.id,
      type: 'activity',
      labels: ['considering'],
      favorite: false,
      payload_json: {
        name: 'Akihabara Electric Town',
        address: 'Akihabara, Chiyoda City, Tokyo, Japan',
        coordinates: { lat: 35.6984, lng: 139.7731 },
        type: 'Shopping',
        duration: '2-3 hours',
        rating: 4.4,
        photos: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'],
        description: 'Electronics and anime/manga shopping district',
        cost: 50,
        currency: 'USD'
      }
    },

    {
      trip_id: trip.id,
      type: 'food',
      labels: ['considering'],
      favorite: false,
      payload_json: {
        name: 'Robot Restaurant',
        address: '1 Chome-7-1 Kabukicho, Shinjuku City, Tokyo 160-0021, Japan',
        coordinates: { lat: 35.6948, lng: 139.7021 },
        cuisine_type: 'Entertainment Dining',
        price_level: 3,
        rating: 3.9,
        photos: ['https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800'],
        description: 'Unique dinner show with robots and neon lights',
        cost: 85,
        currency: 'USD'
      }
    }
  ];

  console.log('🎯 Creating sample activities...');

  for (const card of cards) {
    const { error: cardError } = await supabase
      .from('cards')
      .insert(card);

    if (cardError) {
      console.error(`❌ Error creating card: ${card.payload_json.name}`, cardError);
    } else {
      console.log(`  ✅ ${card.payload_json.name}`);
    }
  }

  console.log('\n✨ Sample itinerary created successfully!');
  console.log(`\n🔗 View your itinerary at:`);
  console.log(`   http://localhost:3000/itinerary?trip_id=${trip.id}`);
  console.log(`\n📋 Trip Details:`);
  console.log(`   Destination: ${trip.destination.name}`);
  console.log(`   Dates: ${trip.dates.start} to ${trip.dates.end}`);
  console.log(`   Activities: ${cards.length} cards created`);
  console.log(`   - Day 1: ${cards.filter(c => c.day === 1).length} activities`);
  console.log(`   - Day 2: ${cards.filter(c => c.day === 2).length} activities`);
  console.log(`   - Day 3: ${cards.filter(c => c.day === 3).length} activities`);
  console.log(`   - Day 4: ${cards.filter(c => c.day === 4).length} activities`);
  console.log(`   - Day 5: ${cards.filter(c => c.day === 5).length} activities`);
  console.log(`   - Unscheduled: ${cards.filter(c => !c.day).length} activities`);
}

seedItinerary()
  .then(() => {
    console.log('\n✅ Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });

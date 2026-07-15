// Test seed script — creates test accounts, listings, and bookings via API
// Run: API_URL=https://roomiee.onrender.com/api node scripts/seed-test.js

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`  ❌ ${method} ${path} failed:`, res.status, data.message || JSON.stringify(data));
    return null;
  }
  return data;
}

async function registerOrLogin(name, email, phone, role) {
  let res = await api('POST', '/auth/register', { name, email, phone, password: 'test1234', role });
  if (res) {
    console.log(`  ✅ ${name} registered`);
  } else {
    res = await api('POST', '/auth/login', { email, password: 'test1234' });
    if (res) console.log(`  ✅ ${name} logged in (existing)`);
  }
  return res;
}

async function seed() {
  console.log('🌱 Seeding test data...\n');

  // ── Owner 1 ──
  console.log('1. Owner 1 (Rahul)...');
  const owner1 = await registerOrLogin('Rahul Sharma', 'rahul.owner3@test.com', '9300000001', 'OWNER');
  if (!owner1) return;
  const owner1Token = owner1.data.accessToken;

  // ── House Listing ──
  console.log('2. Creating 2BHK Delhi listing...');
  const listing1 = await api('POST', '/listings', {
    title: 'Spacious 2BHK near Delhi University',
    description: 'Well-ventilated 2BHK flat with modular kitchen, ideal for students. Close to metro and markets.',
    type: 'HOUSE_RENTAL',
    rent: 18000, deposit: 36000, maintenance: 2000,
    address: '15, Model Town II', city: 'Delhi', state: 'Delhi', pincode: '110009',
    latitude: 28.7134, longitude: 77.1985,
    bedrooms: 2, bathrooms: 2, balcony: true, parking: true,
    areaSqFt: 950, furnished: true, availableFrom: '2026-08-01',
    amenities: { wifi: true, ac: true, washingMachine: true, fridge: true, kitchen: true, lift: true, security: true, powerBackup: true, waterSupply: true, cctv: true },
  }, owner1Token);
  if (!listing1) return;
  console.log(`  ✅ "${listing1.data.title}" created`);

  // ── Tenant 1 ──
  console.log('3. Tenant 1 (Priya)...');
  const tenant1 = await registerOrLogin('Priya Patel', 'priya.tenant2@test.com', '9300000002', 'TENANT');
  if (!tenant1) return;
  const tenant1Token = tenant1.data.accessToken;

  // ── Booking Request ──
  console.log('4. Priya requesting to book...');
  const request1 = await api('POST', '/requests', {
    listingId: listing1.data.id,
    message: 'Hi! I am a second-year student at DU. Looking for a place near campus.',
  }, tenant1Token);
  if (!request1) return;
  console.log('  ✅ Request sent');

  // ── Owner Accepts ──
  console.log('5. Rahul accepting...');
  const accept1 = await api('PATCH', `/requests/${request1.data.id}`, { status: 'ACCEPTED' }, owner1Token);
  if (!accept1) return;
  console.log('  ✅ Request accepted');

  // ── Owner 2 ──
  console.log('6. Owner 2 (Vikram)...');
  const owner2 = await registerOrLogin('Vikram Singh', 'vikram.owner2@test.com', '9300000003', 'OWNER');
  if (!owner2) return;
  const owner2Token = owner2.data.accessToken;

  // ── Hostel Listing ──
  console.log('7. Creating hostel listing...');
  const listing2 = await api('POST', '/listings', {
    title: 'Student Nest Hostel — Near Bangalore University',
    description: 'Premium student hostel with 24/7 security, Wi-Fi, mess, and study rooms.',
    type: 'HOSTEL',
    rent: 8000, deposit: 10000, maintenance: 0,
    address: '42, Jnanabharathi Main Road', city: 'Bangalore', state: 'Karnataka', pincode: '560056',
    latitude: 12.9279, longitude: 77.5075,
    bedrooms: 1, bathrooms: 1, areaSqFt: 120, furnished: true, availableFrom: '2026-07-20',
    amenities: { wifi: true, kitchen: true, security: true, powerBackup: true, waterSupply: true, cctv: true },
    hostelSharing: {
      genderRequired: 'ANY', minAge: 18, maxAge: 25,
      smoking: false, drinking: false, vegOnly: false, petsAllowed: false,
      tiers: [
        { sharingSize: 4, price: 8000 },
        { sharingSize: 3, price: 10000 },
        { sharingSize: 2, price: 13000 },
        { sharingSize: 1, price: 18000 },
      ],
    },
  }, owner2Token);
  if (!listing2) return;
  console.log(`  ✅ "${listing2.data.title}" created`);

  // ── Tenant 2 ──
  console.log('8. Tenant 2 (Amit)...');
  const tenant2 = await registerOrLogin('Amit Kumar', 'amit.tenant2@test.com', '9300000004', 'TENANT');
  if (!tenant2) return;
  const tenant2Token = tenant2.data.accessToken;

  // ── Hostel Booking ──
  console.log('9. Amit requesting hostel...');
  const request2 = await api('POST', '/requests', {
    listingId: listing2.data.id,
    message: 'Hey! I need a 2-sharing room. CS student at Bangalore University.',
  }, tenant2Token);
  if (!request2) return;
  console.log('  ✅ Hostel request sent');

  console.log('10. Vikram accepting...');
  const accept2 = await api('PATCH', `/requests/${request2.data.id}`, { status: 'ACCEPTED' }, owner2Token);
  if (!accept2) return;
  console.log('  ✅ Hostel request accepted');

  // ── Tenant 3 ──
  console.log('11. Tenant 3 (Sneha)...');
  const tenant3 = await registerOrLogin('Sneha Reddy', 'sneha.tenant2@test.com', '9300000005', 'TENANT');
  if (!tenant3) return;
  const tenant3Token = tenant3.data.accessToken;

  // ── Roommate Listing (by Tenant 1) ──
  console.log('12. Priya creating roommate listing...');
  const roommateListing = await api('POST', '/listings', {
    title: 'Looking for flatmate in 3BHK — Lajpat Nagar',
    description: 'I have a 3BHK and need 2 flatmates. Split rent equally. Vegetarian preferred.',
    type: 'ROOM_SHARING',
    rent: 12000, deposit: 12000, maintenance: 1500,
    address: '78, Lajpat Nagar II', city: 'Delhi', state: 'Delhi', pincode: '110024',
    latitude: 28.5714, longitude: 77.2385,
    bedrooms: 3, bathrooms: 2, balcony: true, areaSqFt: 1200, furnished: true, availableFrom: '2026-08-01',
    amenities: { wifi: true, ac: true, washingMachine: true, fridge: true, kitchen: true, waterSupply: true },
    roomSharing: {
      genderRequired: 'FEMALE', minAge: 20, maxAge: 28, occupationPref: 'STUDENT',
      smoking: false, drinking: false, vegOnly: true, petsAllowed: false,
      currentOccupants: 1, totalRooms: 3,
    },
  }, tenant1Token);
  if (!roommateListing) return;
  console.log(`  ✅ "${roommateListing.data.title}" created`);

  // ── Roommate Request ──
  console.log('13. Sneha requesting to join...');
  const request3 = await api('POST', '/requests', {
    listingId: roommateListing.data.id,
    message: 'Hi Priya! I am a working professional (25F), non-smoker, vegetarian. Would love to join!',
  }, tenant3Token);
  if (!request3) return;
  console.log('  ✅ Roommate request sent');

  // ── Tenant 1 Accepts (as listing creator) ──
  console.log('14. Priya accepting roommate request...');
  const accept3 = await api('PATCH', `/requests/${request3.data.id}`, { status: 'ACCEPTED' }, tenant1Token);
  if (!accept3) return;
  console.log('  ✅ Roommate request accepted');

  console.log('\n🎉 Seed complete!');
  console.log('\n📧 Test accounts (password: test1234):');
  console.log('   Owner 1:  rahul.owner3@test.com   (Delhi house)');
  console.log('   Owner 2:  vikram.owner2@test.com  (Bangalore hostel)');
  console.log('   Tenant 1: priya.tenant2@test.com  (booked Delhi + roommate listing)');
  console.log('   Tenant 2: amit.tenant2@test.com   (booked Bangalore hostel)');
  console.log('   Tenant 3: sneha.tenant2@test.com  (joined Delhi roommate)');
}

seed().catch(console.error);

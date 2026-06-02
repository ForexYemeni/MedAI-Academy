// Honest analysis of Vercel Blob limits vs current usage

const currentImages = 218;
const avgImageSizeKB = 93;
const totalCurrentSizeMB = 19.89;

// Vercel Blob Free Tier
const blobStorageLimitMB = 250;
const vercelBandwidthLimitGB = 100; // Vercel free tier total bandwidth

// Projection for 50 courses
const coursesNow = 23;
const coursesTarget = 50;
const avgImagesPerCourse = currentImages / coursesNow;
const projectedImages = avgImagesPerCourse * coursesTarget;
const projectedSizeMB = (projectedImages * avgImageSizeKB) / 1024;

console.log('=== Vercel Blob Free Tier Analysis ===\n');

console.log('📦 Storage:');
console.log(`  Free limit: ${blobStorageLimitMB} MB`);
console.log(`  Current images: ${currentImages} (${totalCurrentSizeMB.toFixed(1)} MB)`);
console.log(`  Projected 50 courses: ${projectedImages.toFixed(0)} images (${projectedSizeMB.toFixed(1)} MB)`);
console.log(`  Usage: ${((projectedSizeMB / blobStorageLimitMB) * 100).toFixed(1)}% of limit`);
console.log(`  Remaining: ${(blobStorageLimitMB - projectedSizeMB).toFixed(1)} MB`);

console.log('\n📡 Bandwidth (per month):');
console.log(`  Free limit: ${vercelBandwidthLimitGB} GB`);
// If 100 users view 5 courses each with avg 10 images
const scenarios = [
  { users: 50, coursesPerUser: 3, label: '50 مستخدم يتصفحون 3 دورات' },
  { users: 200, coursesPerUser: 5, label: '200 مستخدم يتصفحون 5 دورات' },
  { users: 500, coursesPerUser: 5, label: '500 مستخدم يتصفحون 5 دورات' },
  { users: 1000, coursesPerUser: 5, label: '1000 مستخدم يتصفحون 5 دورات' },
];
for (const s of scenarios) {
  const bandwidthGB = (s.users * s.coursesPerUser * avgImagesPerCourse * avgImageSizeKB) / 1024 / 1024;
  console.log(`  ${s.label}: ${bandwidthGB.toFixed(1)} GB (${((bandwidthGB / vercelBandwidthLimitGB) * 100).toFixed(1)}%)`);
}

console.log('\n=== What Happens If Limits Are Hit? ===');
console.log('📦 Storage full:');
console.log('  → New image uploads FAIL (error)');
console.log('  → Existing images STILL work ✅');
console.log('  → App does NOT crash ✅');
console.log('  → But: new courses can\'t have images ❌');

console.log('\n📡 Bandwidth exceeded:');
console.log('  → Vercel shows warning email');
console.log('  → May throttle or charge overage');
console.log('  → Images may load slowly or fail ❌');

console.log('\n=== Current base64 Approach Risks ===');
console.log('📡 API Response Size:');
const coursesWithImages = [
  { name: 'ACLS', size: 1337 },
  { name: 'ATLS', size: 1778 },
  { name: 'Pediatric Emergencies', size: 1997 },
];
for (const c of coursesWithImages) {
  console.log(`  ${c.name}: ${c.size} KB per API response`);
  if (c.size > 4500) console.log('    ⚠️ EXCEEDS Vercel Serverless 4.5MB limit!');
}
console.log('  → Max course size: ~2 MB (still under 4.5 MB limit)');
console.log('  → But: EVERY course fetch loads ALL images');

console.log('\n=== Honest Comparison ===');
console.log('');
console.log('              | base64 in MongoDB    | Vercel Blob');
console.log('──────────────┼──────────────────────┼──────────────────');
console.log('Storage       | 512 MB (MongoDB)     | 250 MB (Blob)');
console.log('App stability | ✅ No external dep   | ⚠️ Depends on Blob');
console.log('If full       | ✅ Still works       | ❌ New uploads fail');
console.log('API speed     | ❌ Slow (big data)   | ✅ Fast (small data)');
console.log('Image speed   | ⚠️ From MongoDB      | ✅ CDN cache');
console.log('Risk level    | LOW                  | MEDIUM');

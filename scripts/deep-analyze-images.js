const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function analyze() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    const courses = await db.collection('courses').find({}).toArray();
    
    let totalImages = 0;
    let totalBase64Size = 0;
    let coursesWithImages = 0;
    let coursesWithoutImages = 0;
    
    for (const course of courses) {
      let hasImg = false;
      if (course.thumbnail && course.thumbnail.length > 200) {
        totalImages++;
        totalBase64Size += course.thumbnail.length;
        hasImg = true;
      }
      if (course.lessonsData) {
        for (const lesson of course.lessonsData) {
          if (lesson.images) {
            for (const img of lesson.images) {
              if (img && img.length > 200) {
                totalImages++;
                totalBase64Size += img.length;
                hasImg = true;
              }
            }
          }
        }
      }
      if (hasImg) coursesWithImages++;
      else coursesWithoutImages++;
    }
    
    console.log('=== Image Analysis ===');
    console.log(`Total images (base64): ${totalImages}`);
    console.log(`Total base64 size: ${(totalBase64Size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Avg image size: ${(totalBase64Size / totalImages / 1024).toFixed(0)} KB`);
    console.log(`Courses with images: ${coursesWithImages}`);
    console.log(`Courses without images: ${coursesWithoutImages}`);
    
    // If external URLs
    const avgUrlSize = 150; // bytes for a Cloudinary URL
    const urlTotalSize = totalImages * avgUrlSize;
    console.log(`\n=== If External URLs ===`);
    console.log(`Total URL size: ${(urlTotalSize / 1024).toFixed(0)} KB (vs ${(totalBase64Size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Savings: ${((totalBase64Size - urlTotalSize) / 1024 / 1024).toFixed(2)} MB (${(((totalBase64Size - urlTotalSize) / totalBase64Size) * 100).toFixed(1)}% reduction)`);
    
    // Check how images are used in frontend
    console.log('\n=== Image Format in DB ===');
    let sampleImage = null;
    for (const course of courses) {
      if (course.lessonsData) {
        for (const lesson of course.lessonsData) {
          if (lesson.images && lesson.images[0] && lesson.images[0].length > 200) {
            sampleImage = lesson.images[0].substring(0, 80);
            break;
          }
        }
      }
      if (sampleImage) break;
    }
    console.log(`Sample image prefix: ${sampleImage}...`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

analyze();

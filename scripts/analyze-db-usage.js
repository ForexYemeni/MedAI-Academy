const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function analyze() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    
    // Analyze what's taking space in courses
    console.log('=== Course Size Breakdown ===\n');
    const courses = await db.collection('courses').find({}).toArray();
    
    let totalImagesSize = 0;
    let totalContentSize = 0;
    let totalCoursesJsonSize = 0;
    
    for (const course of courses) {
      let courseImagesSize = 0;
      let courseContentSize = 0;
      
      // Thumbnail
      if (course.thumbnail && course.thumbnail.length > 100) {
        courseImagesSize += course.thumbnail.length;
      }
      
      // Lessons images and content
      if (course.lessonsData) {
        for (const lesson of course.lessonsData) {
          if (lesson.images) {
            for (const img of lesson.images) {
              courseImagesSize += (img || '').length;
            }
          }
          courseContentSize += (lesson.content || '').length;
        }
      }
      
      totalImagesSize += courseImagesSize;
      totalContentSize += courseContentSize;
      
      const courseTotal = JSON.stringify(course).length;
      totalCoursesJsonSize += courseTotal;
      console.log(`${course.titleAr || course.title}: ${(courseTotal/1024).toFixed(0)} KB (images: ${(courseImagesSize/1024).toFixed(0)} KB, content: ${(courseContentSize/1024).toFixed(0)} KB)`);
    }
    
    // Count other collections
    const usersCount = await db.collection('users').countDocuments();
    const enrollmentsCount = await db.collection('enrollments').countDocuments();
    const paymentsCount = await db.collection('payments').countDocuments();
    const lessonsCount = await db.collection('lessons').countDocuments();
    
    console.log('\n=== Other Collections ===');
    console.log(`Users: ${usersCount}`);
    console.log(`Enrollments: ${enrollmentsCount}`);
    console.log(`Payments: ${paymentsCount}`);
    console.log(`Separate lessons: ${lessonsCount}`);
    
    console.log('\n=== Overall Breakdown (Courses only) ===');
    console.log(`Images total: ${(totalImagesSize / 1024 / 1024).toFixed(2)} MB (${((totalImagesSize / totalCoursesJsonSize) * 100).toFixed(1)}% of courses data)`);
    console.log(`Content total: ${(totalContentSize / 1024 / 1024).toFixed(2)} MB (${((totalContentSize / totalCoursesJsonSize) * 100).toFixed(1)}% of courses data)`);
    console.log(`Courses JSON total: ${(totalCoursesJsonSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Projection
    console.log('\n=== Storage Projection for 50 Courses ===');
    const avgCourseSize = totalCoursesJsonSize / courses.length;
    const remainingCourses = 50 - courses.length;
    const projectedTotal = totalCoursesJsonSize + (remainingCourses * avgCourseSize);
    console.log(`Current courses: ${courses.length}`);
    console.log(`Average course size: ${(avgCourseSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Remaining courses: ${remainingCourses}`);
    console.log(`Projected 50 courses total: ${(projectedTotal / 1024 / 1024).toFixed(0)} MB`);
    console.log(`MongoDB Atlas free tier: 512 MB`);
    console.log(`Will it fit? ${projectedTotal / 1024 / 1024 < 512 ? '✅ YES' : '❌ NO - EXCEEDS by ' + ((projectedTotal / 1024 / 1024) - 512).toFixed(0) + ' MB'}`);
    
    // If images were moved to external URLs
    console.log('\n=== Solution: External Image URLs (Cloudinary/imgbb) ===');
    const avgImagesPerCourse = totalImagesSize / courses.length;
    const avgNonImagePerCourse = avgCourseSize - avgImagesPerCourse;
    const projectedWithoutImages = totalCoursesJsonSize - totalImagesSize + (remainingCourses * avgNonImagePerCourse);
    console.log(`Images are ${((totalImagesSize / totalCoursesJsonSize) * 100).toFixed(0)}% of data!`);
    console.log(`Projected total WITHOUT images: ${(projectedWithoutImages / 1024 / 1024).toFixed(0)} MB`);
    console.log(`Savings: ${((totalImagesSize + remainingCourses * avgImagesPerCourse) / 1024 / 1024).toFixed(0)} MB`);
    console.log(`Will it fit 512 MB? ${projectedWithoutImages / 1024 / 1024 < 512 ? '✅ YES - plenty of room!' : '❌ NO'}`);
    
    // Alternative: compress images more
    console.log('\n=== Alternative: Reduce image quality from 70% to 40% ===');
    const compressedSaving = totalImagesSize * 0.4; // ~40% reduction
    const projectedCompressed = totalCoursesJsonSize - compressedSaving + (remainingCourses * (avgCourseSize - (avgImagesPerCourse * 0.4)));
    console.log(`Projected with compressed images: ${(projectedCompressed / 1024 / 1024).toFixed(0)} MB`);
    console.log(`Will it fit? ${projectedCompressed / 1024 / 1024 < 512 ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

analyze();

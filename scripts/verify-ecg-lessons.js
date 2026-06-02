const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function verify() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    
    const course = await db.collection('courses').findOne({ id: 'ecg-reading-beginners' });
    if (!course) {
      console.log('❌ Course not found!');
      return;
    }
    
    console.log('=== Course Info ===');
    console.log('Title:', course.titleAr);
    console.log('lessons field:', course.lessons);
    console.log('lessonsData length:', course.lessonsData?.length);
    
    if (course.lessonsData && course.lessonsData.length > 0) {
      console.log('\n=== Lessons Summary ===');
      course.lessonsData.forEach((lesson, i) => {
        console.log(`${i+1}. ${lesson.id} - ${lesson.title || lesson.titleAr} (type: ${lesson.type}, duration: ${lesson.duration}, free: ${lesson.isFree}, hasContent: ${!!lesson.content})`);
      });
    }
    
    // Verify no orphan lessons in separate collection
    const orphanLessons = await db.collection('lessons').countDocuments({ courseId: 'ecg-reading-beginners' });
    console.log('\n=== Orphan lessons in separate collection ===');
    console.log('Count:', orphanLessons);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verify();

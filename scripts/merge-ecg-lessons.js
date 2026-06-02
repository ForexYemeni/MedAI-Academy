const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function mergeLessons() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db('medai_academy');
    
    // 1. Find the ECG course
    const course = await db.collection('courses').findOne({ id: 'ecg-reading-beginners' });
    if (!course) {
      console.log('❌ ECG course not found!');
      return;
    }
    console.log('Found course:', course.titleAr);
    console.log('Current lessonsData:', course.lessonsData?.length || 0);
    
    // 2. Get lessons from separate collection
    const lessons = await db.collection('lessons').find({ 
      courseId: 'ecg-reading-beginners' 
    }).sort({ order: 1 }).toArray();
    console.log('Found', lessons.length, 'lessons in separate collection');
    
    if (lessons.length === 0) {
      console.log('❌ No lessons to merge!');
      return;
    }
    
    // 3. Clean lessons for embedding (remove MongoDB-specific fields)
    const cleanLessons = lessons.map(lesson => {
      const { _id, courseId, createdAt, updatedAt, ...lessonData } = lesson;
      return lessonData;
    });
    
    // 4. Update the course with embedded lessonsData
    const result = await db.collection('courses').updateOne(
      { _id: course._id },
      {
        $set: {
          lessonsData: cleanLessons,
          lessons: cleanLessons.length,
          updatedAt: new Date(),
        }
      }
    );
    
    console.log('Update result:', result.modifiedCount, 'document(s) modified');
    
    // 5. Verify
    const updatedCourse = await db.collection('courses').findOne({ _id: course._id });
    console.log('✅ After merge - lessonsData length:', updatedCourse.lessonsData?.length);
    console.log('✅ After merge - lessons field:', updatedCourse.lessons);
    
    // 6. Also delete the separate lessons (they're now embedded)
    const deleteResult = await db.collection('lessons').deleteMany({ 
      courseId: 'ecg-reading-beginners' 
    });
    console.log('🗑️ Deleted', deleteResult.deletedCount, 'separate lessons (now embedded in course)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

mergeLessons();

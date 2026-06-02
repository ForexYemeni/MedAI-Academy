const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function debug() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    
    // 1. Find the ECG course
    console.log('=== ECG Course Document ===');
    const course = await db.collection('courses').findOne({ id: 'ecg-reading-beginners' });
    if (!course) {
      console.log('❌ Course NOT found by id field. Trying title...');
      const courseByTitle = await db.collection('courses').findOne({ titleAr: { $regex: 'تخطيط القلب' } });
      if (courseByTitle) {
        console.log('Found by title:', JSON.stringify({
          _id: courseByTitle._id.toString(),
          id: courseByTitle.id,
          title: courseByTitle.title,
          titleAr: courseByTitle.titleAr,
          lessonsData_length: courseByTitle.lessonsData?.length,
          lessons: courseByTitle.lessons,
          lessonsCount: courseByTitle.lessonsCount,
        }, null, 2));
      } else {
        console.log('❌ No course found with ECG in title either');
      }
    } else {
      console.log('Found course:', JSON.stringify({
        _id: course._id.toString(),
        id: course.id,
        title: course.title,
        titleAr: course.titleAr,
        lessonsData_length: course.lessonsData?.length,
        lessons: course.lessons,
        lessonsCount: course.lessonsCount,
        hasLessonsData: !!course.lessonsData,
        lessonsDataType: typeof course.lessonsData,
        isLessonsDataArray: Array.isArray(course.lessonsData),
      }, null, 2));
      
      // 2. Check lessons in separate collection
      console.log('\n=== Lessons in separate collection ===');
      const lessonsById = await db.collection('lessons').find({ courseId: 'ecg-reading-beginners' }).sort({ order: 1 }).toArray();
      console.log(`Lessons found by courseId='ecg-reading-beginners': ${lessonsById.length}`);
      if (lessonsById.length > 0) {
        console.log('Lesson IDs:', lessonsById.map(l => l.id));
      }
      
      const lessonsByObjectId = await db.collection('lessons').find({ courseId: course._id.toString() }).sort({ order: 1 }).toArray();
      console.log(`Lessons found by courseId='${course._id.toString()}': ${lessonsByObjectId.length}`);
      
      // 3. Check ALL lessons to see what courseIds exist
      console.log('\n=== All distinct courseIds in lessons collection ===');
      const distinctCourseIds = await db.collection('lessons').distinct('courseId');
      console.log('Distinct courseIds:', distinctCourseIds);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debug();

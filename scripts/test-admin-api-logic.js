const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function test() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    
    // Simulate the admin API logic
    const courses = await db.collection('courses').find({}).sort({ createdAt: -1 }).toArray();
    
    // Apply the same merge logic as the admin API
    const coursesWithLessons = await Promise.all(courses.map(async (course) => {
      if (!course.lessonsData || course.lessonsData.length === 0) {
        const courseIdStr = course._id.toString();
        const courseIdQueries = [courseIdStr];
        if (course.id) {
          courseIdQueries.push(course.id);
        }
        
        console.log(`\nCourse: ${course.titleAr || course.title}`);
        console.log(`  _id: ${courseIdStr}`);
        console.log(`  id: ${course.id || 'N/A'}`);
        console.log(`  lessonsData length: ${course.lessonsData?.length || 0}`);
        console.log(`  Searching lessons with courseId in: [${courseIdQueries.join(', ')}]`);
        
        const separateLessons = await db.collection('lessons').find({
          courseId: { $in: courseIdQueries }
        }).sort({ order: 1 }).toArray();
        
        console.log(`  Found ${separateLessons.length} lessons in separate collection`);
        
        if (separateLessons.length > 0) {
          return {
            ...course,
            lessonsData: separateLessons,
            lessons: separateLessons.length,
          };
        }
      }
      return course;
    }));
    
    // Find ECG course specifically
    const ecgCourse = coursesWithLessons.find(c => c.id === 'ecg-reading-beginners' || c.titleAr?.includes('تخطيط القلب'));
    if (ecgCourse) {
      console.log('\n\n=== ECG Course After Merge ===');
      console.log('Title:', ecgCourse.titleAr);
      console.log('lessonsData length:', ecgCourse.lessonsData?.length);
      console.log('lessons field:', ecgCourse.lessons);
    } else {
      console.log('\n\n❌ ECG Course not found after merge!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

test();

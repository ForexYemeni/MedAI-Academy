const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    
    const lesson = await db.collection('lessons').findOne({ courseId: 'ecg-reading-beginners', order: 1 });
    if (lesson) {
      console.log('Lesson keys:', Object.keys(lesson));
      console.log('\nLesson structure:');
      console.log(JSON.stringify({
        _id: lesson._id?.toString(),
        id: lesson.id,
        title: lesson.title,
        titleAr: lesson.titleAr,
        order: lesson.order,
        duration: lesson.duration,
        type: lesson.type,
        isFree: lesson.isFree,
        courseId: lesson.courseId,
        hasContent: !!lesson.content,
        contentLength: lesson.content?.length,
        hasImages: !!(lesson.images && lesson.images.length > 0),
        imagesLength: lesson.images?.length,
        createdAt: lesson.createdAt,
      }, null, 2));
    }
    
    // Also check if there are any courses where lessonsData is defined but empty array
    console.log('\n=== Courses with empty lessonsData ===');
    const coursesWithEmpty = await db.collection('courses').find({
      $or: [
        { lessonsData: { $exists: true, $size: 0 } },
        { lessonsData: null },
      ]
    }).toArray();
    console.log(`Found ${coursesWithEmpty.length} courses with empty/null lessonsData`);
    for (const c of coursesWithEmpty) {
      const lessonsInSep = await db.collection('lessons').countDocuments({
        courseId: { $in: [c._id.toString(), ...(c.id ? [c.id] : [])] }
      });
      console.log(`  ${c.titleAr || c.title}: lessonsData=${JSON.stringify(c.lessonsData)}, separate lessons=${lessonsInSep}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

check();

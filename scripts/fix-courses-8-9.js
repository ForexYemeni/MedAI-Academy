const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ForexYemeni:741852963@cluster0.0vxmfgh.mongodb.net/med-ai-academy?retryWrites=true&w=majority&appName=Cluster0';

async function fixCourse(courseName) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log(`Connected to MongoDB for fixing ${courseName}`);
    
    const db = client.db('med-ai-academy');
    const coursesCollection = db.collection('courses');
    
    // Find the course
    const course = await coursesCollection.findOne({ title: courseName });
    if (!course) {
      // Try by titleAr
      const courseByAr = await coursesCollection.findOne({ titleAr: { $regex: courseName } });
      if (!courseByAr) {
        console.log(`Course "${courseName}" not found!`);
        return;
      }
      await fixCourseData(coursesCollection, courseByAr);
      return;
    }
    await fixCourseData(coursesCollection, course);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

async function fixCourseData(coursesCollection, course) {
  console.log(`Found course: ${course.titleAr} (id: ${course._id})`);
  console.log(`Current lessons count: ${course.lessonsData?.length || 0}`);
  
  if (!course.lessonsData || course.lessonsData.length === 0) {
    console.log('No lessonsData found!');
    return;
  }
  
  let fixed = 0;
  const updatedLessonsData = course.lessonsData.map((lesson, index) => {
    const updated = { ...lesson };
    
    // Fix type: 'text' -> 'article'
    if (lesson.type === 'text') {
      updated.type = 'article';
      fixed++;
      console.log(`  Lesson ${index + 1} "${lesson.title || lesson.titleAr}": type 'text' -> 'article'`);
    }
    
    // Fix duration: string -> number
    if (typeof lesson.duration === 'string') {
      const numMatch = lesson.duration.match(/(\d+)/);
      if (numMatch) {
        updated.duration = parseInt(numMatch[1]);
        console.log(`  Lesson ${index + 1} "${lesson.title || lesson.titleAr}": duration '${lesson.duration}' -> ${updated.duration}`);
      } else {
        updated.duration = 15; // default
      }
      fixed++;
    }
    
    return updated;
  });
  
  if (fixed > 0) {
    const result = await coursesCollection.updateOne(
      { _id: course._id },
      { $set: { lessonsData: updatedLessonsData } }
    );
    console.log(`\nFixed ${fixed} issues. DB update result: ${result.modifiedCount} document(s) modified`);
  } else {
    console.log('No issues found to fix.');
  }
}

async function main() {
  // Fix Course #8 - الإسعافات الأولية الميدانية
  await fixCourse('first-aid');
  console.log('\n---\n');
  // Fix Course #9 - احتشاء عضلة القلب الحاد STEMI
  await fixCourse('stemi');
}

main();

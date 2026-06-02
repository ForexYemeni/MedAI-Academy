const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function list() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    const courses = await db.collection('courses').find({})
      .sort({ createdAt: 1 })
      .project({ titleAr: 1, title: 1, titleEn: 1, category: 1, level: 1, lessons: 1, id: 1 })
      .toArray();
    
    console.log(`=== ${courses.length} Courses in DB ===\n`);
    courses.forEach((c, i) => {
      console.log(`${i+1}. ${c.titleAr || c.title} (${c.lessons || 0} lessons) [category: ${c.category}]`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

list();

const { MongoClient } = require('mongodb');
const MONGODB_URI = 'mongodb+srv://mohammedshayaa71:m773057153M%40%23%24778288150omy@cluster0.2jqznai.mongodb.net/medai_academy?retryWrites=true&w=majority';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('medai_academy');
    
    // Check course 10
    const course10 = await db.collection('courses').findOne({ 
      $or: [
        { titleAr: { $regex: 'اضطرابات النظم' } },
        { titleEn: { $regex: 'Cardiac Arrhythmia' } },
        { id: 'cardiac-arrhythmias' },
      ]
    });
    
    if (course10) {
      console.log('=== Course 10 ===');
      console.log('Title:', course10.titleAr || course10.title);
      console.log('id:', course10.id);
      console.log('lessonsData length:', course10.lessonsData?.length || 0);
      console.log('lessons field:', course10.lessons);
      
      const separateLessons = await db.collection('lessons').countDocuments({
        courseId: { $in: [course10._id.toString(), ...(course10.id ? [course10.id] : [])] }
      });
      console.log('Separate lessons:', separateLessons);
    } else {
      console.log('❌ Course 10 (Cardiac Arrhythmias) not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

check();

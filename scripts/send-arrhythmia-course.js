const fs = require('fs');
const path = require('path');

async function main() {
  const images = JSON.parse(fs.readFileSync(path.join(__dirname, 'compressed-images.json'), 'utf8'));
  
  const courseData = {
    id: '6a1f0001arrhythmia0000000001',
    title: 'Cardiac Arrhythmias - Diagnosis and Management',
    titleAr: 'اضطرابات النظم القلبي - التشخيص والإدارة',
    description: 'Comprehensive premium course covering cardiac arrhythmia pathophysiology, ECG interpretation, and evidence-based management strategies',
    descriptionAr: 'دورة احترافية شاملة لتعلّم اضطرابات النظم القلبي، تشمل الفيزيولوجيا المرضية وتفسير تخطيط القلب واستراتيجيات الإدارة المبنية على الأدلة',
    instructor: 'أكاديمية نبض',
    category: 'cardiology',
    level: 'advanced',
    duration: '24 ساعة',
    price: 1500,
    isPremium: true,
    featured: true,
    rating: 4.9,
    students: 0,
    lessons: 18,
    image: images['01-conduction-system'] || '',
    tags: ['طب القلب', 'اضطرابات النظم', 'ECG', 'تخطيط القلب', 'الرجفان الأذيني', 'حصار القلب'],
    published: true,
    lessonsData: [
      {
        id: 'arr-1', title: 'Introduction to Cardiac Arrhythmias', titleAr: 'مقدمة في اضطرابات النظم القلبي',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-01.md'), 'utf8'),
        images: images['01-conduction-system'] ? [images['01-conduction-system']] : [],
        duration: 55, order: 1, isFree: true, type: 'article',
      },
      {
        id: 'arr-2', title: 'Cardiac Electrophysiology', titleAr: 'الفيزيولوجيا الكهربائية للقلب',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-02.md'), 'utf8'),
        images: images['02-electrophysiology'] ? [images['02-electrophysiology']] : [],
        duration: 65, order: 2, isFree: false, type: 'article',
      },
      {
        id: 'arr-3', title: 'Cardiac Conduction System', titleAr: 'نظام التوصيل القلبي',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-03.md'), 'utf8'),
        images: images['03-ecg-basics'] ? [images['03-ecg-basics']] : [],
        duration: 60, order: 3, isFree: false, type: 'article',
      },
      {
        id: 'arr-4', title: 'ECG Fundamentals for Arrhythmia Diagnosis', titleAr: 'أساسيات تخطيط القلب لتشخيص اضطرابات النظم',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-04.md'), 'utf8'),
        images: images['03-ecg-basics'] ? [images['03-ecg-basics']] : [],
        duration: 70, order: 4, isFree: true, type: 'article',
      },
      {
        id: 'arr-5', title: 'Sinus Tachycardia and Sinus Bradycardia', titleAr: 'تسرع القلب الجيبي وبطء القلب الجيبي',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-05.md'), 'utf8'),
        images: images['04-sinus-rhythms'] ? [images['04-sinus-rhythms']] : [],
        duration: 60, order: 5, isFree: false, type: 'article',
      },
      {
        id: 'arr-6', title: 'Atrial Fibrillation', titleAr: 'الرجفان الأذيني',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-06.md'), 'utf8'),
        images: images['05-atrial-fibrillation'] ? [images['05-atrial-fibrillation']] : [],
        duration: 75, order: 6, isFree: false, type: 'article',
      },
      {
        id: 'arr-7', title: 'Atrial Flutter', titleAr: 'الرفرفة الأذينية',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-07.md'), 'utf8'),
        images: images['06-atrial-flutter'] ? [images['06-atrial-flutter']] : [],
        duration: 60, order: 7, isFree: false, type: 'article',
      },
      {
        id: 'arr-8', title: 'Supraventricular Tachycardia (SVT)', titleAr: 'تسرع القلب فوق البطيني',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-08.md'), 'utf8'),
        images: images['07-svt'] ? [images['07-svt']] : [],
        duration: 70, order: 8, isFree: false, type: 'article',
      },
      {
        id: 'arr-9', title: 'Wolff-Parkinson-White Syndrome', titleAr: 'متلازمة وولف باركنسون وايت',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-09.md'), 'utf8'),
        images: images['08-wpw'] ? [images['08-wpw']] : [],
        duration: 65, order: 9, isFree: false, type: 'article',
      },
      {
        id: 'arr-10', title: 'First and Second Degree Heart Block', titleAr: 'حصار القلب من الدرجة الأولى والثانية',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-10.md'), 'utf8'),
        images: images['09-heart-block-1-2'] ? [images['09-heart-block-1-2']] : [],
        duration: 70, order: 10, isFree: false, type: 'article',
      },
      {
        id: 'arr-11', title: 'Third Degree (Complete) Heart Block', titleAr: 'حصار القلب من الدرجة الثالثة (الكامل)',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-11.md'), 'utf8'),
        images: images['10-heart-block-3'] ? [images['10-heart-block-3']] : [],
        duration: 65, order: 11, isFree: false, type: 'article',
      },
      {
        id: 'arr-12', title: 'Ventricular Tachycardia', titleAr: 'تسرع القلب البطيني',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-12.md'), 'utf8'),
        images: images['11-vtach'] ? [images['11-vtach']] : [],
        duration: 75, order: 12, isFree: false, type: 'article',
      },
      {
        id: 'arr-13', title: 'Ventricular Fibrillation', titleAr: 'الرجفان البطيني',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-13.md'), 'utf8'),
        images: images['12-vfib'] ? [images['12-vfib']] : [],
        duration: 70, order: 13, isFree: false, type: 'article',
      },
      {
        id: 'arr-14', title: 'Antiarrhythmic Drugs', titleAr: 'الأدوية المضادة لاضطراب النظم القلبي',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-14.md'), 'utf8'),
        images: images['13-antiarrhythmic-drugs'] ? [images['13-antiarrhythmic-drugs']] : [],
        duration: 75, order: 14, isFree: false, type: 'article',
      },
      {
        id: 'arr-15', title: 'Electrical Cardioversion', titleAr: 'التقويم الكهربائي',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-15.md'), 'utf8'),
        images: images['14-cardioversion'] ? [images['14-cardioversion']] : [],
        duration: 65, order: 15, isFree: false, type: 'article',
      },
      {
        id: 'arr-16', title: 'Defibrillation and Resuscitation', titleAr: 'إزالة الرجفان والإنعاش',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-16.md'), 'utf8'),
        images: images['15-defibrillation'] ? [images['15-defibrillation']] : [],
        duration: 70, order: 16, isFree: false, type: 'article',
      },
      {
        id: 'arr-17', title: 'Cardiac Pacemakers and ICDs', titleAr: 'منظمات ضربات القلب وأجهزة إزالة الرجفان القابلة للزرع',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-17.md'), 'utf8'),
        images: images['16-pacemakers'] ? [images['16-pacemakers']] : [],
        duration: 65, order: 17, isFree: false, type: 'article',
      },
      {
        id: 'arr-18', title: 'Comprehensive Arrhythmia Management Algorithm', titleAr: 'خوارزمية إدارة اضطرابات النظم القلبي الشاملة',
        content: fs.readFileSync(path.join(__dirname, 'lesson-content', 'lesson-18.md'), 'utf8'),
        images: images['18-management-algorithm'] ? [images['18-management-algorithm']] : [],
        duration: 70, order: 18, isFree: false, type: 'article',
      },
    ],
  };

  console.log('Sending course data to API...');
  console.log(`Total lessons: ${courseData.lessonsData.length}`);
  
  let totalContent = 0;
  courseData.lessonsData.forEach((l, i) => {
    totalContent += l.content.length;
    console.log(`  Lesson ${i+1}: ${l.titleAr} (${l.content.length} chars, ${l.images.length} images)`);
  });
  console.log(`Total content: ${totalContent} chars`);
  
  // Save course data as JSON for curl
  const jsonPath = path.join(__dirname, 'course-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ course: courseData }));
  console.log(`\nCourse data saved to ${jsonPath}`);
  console.log(`File size: ${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(1)} MB`);
  
  // Now send via HTTP
  console.log('\nSending to API...');
  const response = await fetch('https://nabd-academy.vercel.app/api/courses/bulk-add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: courseData }),
  });
  
  const result = await response.json();
  console.log(`Response status: ${response.status}`);
  console.log(`Result:`, JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ Course created successfully!');
  } else {
    console.log('\n❌ Failed to create course');
  }
}

main().catch(err => console.error('Error:', err));

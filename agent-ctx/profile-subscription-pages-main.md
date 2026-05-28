# Task: Profile & Subscription Pages for MedAI Academy

## Summary
Built two comprehensive page components for the MedAI Academy medical education platform:

### 1. Profile Page (`/src/components/med/pages/profile-page.tsx`)
- **Profile Header**: Large gradient banner with animated ECG line, user avatar with neon ring, name "د. أحمد الخالدي", rank icon "🩺 طبيب مقيم", level badge, XP progress bar with shimmer animation, edit profile button
- **Stats Grid**: 2x3 grid of glass cards showing XP (3,750), Coins (1,250), Streak (14 يوم), Courses (12), Study Hours (156), Rank (#5) - each with unique color and icon
- **Medical Ranks Progress**: Vertical timeline showing all 7 ranks (طالب طب → قائد العناية المركزة) with completed/current/locked states and pulse animation on current rank
- **Badges Collection**: Grid of 10 badges (6 from store + 4 additional), earned badges with full color glow, locked badges with grayscale and lock overlay, rarity indicators (common=gray, rare=blue, epic=purple, legendary=gold), click-to-view detail dialog
- **Study Activity Heatmap**: 7 days × 4 weeks grid with color intensity based on study time, current streak highlighted with ring, day/week labels
- **Learning Path**: List of enrolled courses with progress bars
- **Settings**: Quick links to Language, Notifications, Privacy, About

### 2. Subscription Page (`/src/components/med/pages/subscription-page.tsx`)
- **Header**: "اختر خطتك المثالية" with gradient text and billing toggle (monthly/yearly)
- **Plan Cards**: Three glassmorphism cards:
  - مجاني (Free): $0, blue accent, limited features
  - مميز (Premium): $9.99/شهر, cyan/purple gradient border, "الأكثر شعبية" badge, 8 features
  - مدرب (Instructor): $29.99/شهر, gold accent, instructor features
- **Comparison Table**: 12-row feature comparison with highlighted Premium column
- **FAQ Section**: 6 Arabic accordion questions about cancellation, security, plans
- **Trust Badges**: دفع آمن, إلغاء أي وقت, ضمان 7 أيام
- **CTA Section**: Final call-to-action with ECG decoration

### Integration
- Updated `page.tsx` with proper navigation including Profile and Subscription tabs
- Added avatar click → profile navigation
- Added Crown badge click → subscription navigation
- Bottom nav includes 6 tabs: الرئيسية, الدورات, قصير, المساعد, حسابي, الاشتراك

## Design
- Dark medical neon theme (cyan/blue/purple)
- Glassmorphism with backdrop blur
- Framer Motion animations throughout
- Full Arabic RTL support
- Responsive design (mobile-first)

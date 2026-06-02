#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# سكريبت نشر أكاديمية نبض على Vercel (مشروع nabd-academy)
# Deploy Nabd Academy to Vercel (nabd-academy project)
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 نشر أكاديمية نبض على Vercel..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 تثبيت Vercel CLI..."
    npm install -g vercel@latest
fi

# Check if user is logged in
echo "🔐 التحقق من تسجيل الدخول..."
if ! vercel whoami &> /dev/null; then
    echo "❌ يجب تسجيل الدخول إلى Vercel أولاً"
    echo "   شغّل: vercel login"
    echo "   أو: vercel login github"
    exit 1
fi

echo "✅ تم تسجيل الدخول كـ: $(vercel whoami)"
echo ""

# Link to nabd-academy project if not already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 ربط المشروع بـ nabd-academy..."
    vercel link --yes
else
    CURRENT_PROJECT=$(cat .vercel/project.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('projectName','unknown'))" 2>/dev/null || echo "unknown")
    echo "📋 المشروع الحالي: $CURRENT_PROJECT"
    
    if [ "$CURRENT_PROJECT" != "nabd-academy" ]; then
        echo "⚠️  المشروع الحالي ($CURRENT_PROJECT) ليس nabd-academy"
        echo "   سيتم إعادة الربط..."
        rm -rf .vercel
        vercel link --yes
    fi
fi

echo ""
echo "🏗️  بناء المشروع..."
npm run build

echo ""
echo "🚀 النشر على الإنتاج..."
vercel deploy --prod

echo ""
echo "✅ تم النشر بنجاح!"
echo "   الرابط: https://nabd-academy.vercel.app"

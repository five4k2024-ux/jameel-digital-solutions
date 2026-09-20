# Jameel Ali Project Showcase

معرض مشاريع عربي احترافي مع واجهة عامة ولوحة إدارة منفصلة.

## الصفحات
- `index.html`: الصفحة العامة للزوار فقط.
- `admin.html`: لوحة الإدارة، وتسجيل الدخول محصور ببريد `alk_1379@hotmail.com` عبر Supabase Auth.

## الإدارة
لوحة الإدارة تسمح بإضافة وتعديل وإخفاء/إظهار وحذف المشاريع، ورفع صورة أو فيديو للمشروع، ومشاهدة طلبات العملاء.

## الأمان
الصلاحيات الفعلية مطبقة في Supabase Row Level Security، وليست مجرد إخفاء أزرار في JavaScript. مفتاح الواجهة Publishable فقط ولا يحتوي المشروع على Service Role Key أو كلمة مرور مدير.

## النشر على GitHub Pages
المشروع يحتوي على `.github/workflows/pages.yml`. ارفع الملفات إلى مستودع GitHub ثم فعّل Pages باستخدام GitHub Actions.

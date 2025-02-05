// إعداد Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// إعداد Express
const express = require('express');
const app = express();
app.use(express.json());

// النقطة الأساسية لتسجيل المستخدمين
app.post('/subscribe', async (req, res) => {
    console.log("📩 استلام طلب تسجيل:", req.body);

    const { name, email, password } = req.body;

    // التحقق من المدخلات
    if (!name || !email || !password) {
        console.log("⚠️ جميع الحقول مطلوبة!");
        return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        console.log("⚠️ البريد الإلكتروني غير صالح!");
        return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
    }

    try {
        // تسجيل المستخدم في Supabase
        const { user, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            console.log("⚠️ حدث خطأ أثناء التسجيل في Supabase:", error.message);
            return res.status(400).json({ message: error.message });
        }

        console.log("✅ تم التسجيل بنجاح!");
        res.status(200).json({ message: '✅ تم التسجيل بنجاح!' });

    } catch (error) {
        console.error('خطأ أثناء التسجيل:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء التسجيل' });
    }
});

// نقطة النهاية السابقة أو أي نقاط أخرى موجودة
app.get('/', (req, res) => {
    res.send('مرحبًا بك في خادم Node.js!');
});

// تهيئة السيرفر للاستماع
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل على المنفذ ${PORT}`);
});

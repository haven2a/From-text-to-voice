require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// استخدام CORS
app.use(cors());

// لتحليل البيانات الواردة بتنسيق JSON
app.use(express.json());
// لتحليل البيانات المرسلة عبر نماذج HTML
app.use(express.urlencoded({ extended: true }));

const usersFile = path.join(__dirname, 'users.json');

// التأكد من أن ملف المستخدمين موجود، وإذا لم يكن موجودًا، يتم إنشاؤه
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

// إعداد خدمة البريد الإلكتروني عبر Gmail باستخدام nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // البريد الإلكتروني المستخدم من ملف البيئة
        pass: process.env.EMAIL_PASS    // كلمة المرور من ملف البيئة
    }
});

// مسار تسجيل المستخدمين عبر POST
app.post('/api/subscribe', async (req, res) => {
    console.log('بيانات التسجيل:', req.body); // تسجيل البيانات المستلمة من العميل
    const { name, email, password } = req.body;

    // التأكد من تعبئة جميع الحقول
    if (!name || !email || !password) {
        return res.status(400).json({ message: '⚠️ جميع الحقول مطلوبة!' });
    }

    // التحقق من صحة البريد الإلكتروني باستخدام تعبير عادي
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '⚠️ البريد الإلكتروني غير صحيح.' });
    }

    try {
        // قراءة البيانات الحالية للمستخدمين من الملف
        let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

        // التحقق من أن البريد الإلكتروني غير مسجل مسبقًا
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ message: '⚠️ البريد الإلكتروني مسجل مسبقًا.' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إضافة المستخدم الجديد
        const newUser = { name, email, password: hashedPassword, registeredAt: new Date().toISOString() };
        users.push(newUser);

        // حفظ البيانات المعدلة في الملف
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

        // إعداد بريد التأكيد للمستخدم
        const mailOptions = {
            from: process.env.EMAIL_USER,  // البريد الإلكتروني من ملف البيئة
            to: email,
            subject: 'تم التسجيل بنجاح',
            text: `مرحبًا ${name}،\n\nلقد تم تسجيلك بنجاح في النظام. شكرًا لاستخدامك خدمتنا!`
        };

        // إرسال البريد الإلكتروني
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ خطأ في إرسال البريد:', error);
            } else {
                console.log('✅ تم إرسال البريد:', info.response);
            }
        });

        // الرد على العميل بتأكيد التسجيل
        res.status(201).json({ message: '✅ تم التسجيل بنجاح وتم إرسال بريد التأكيد!' });

    } catch (error) {
        console.error('❌ خطأ في تسجيل المستخدم:', error);
        res.status(500).json({ message: '❌ حدث خطأ أثناء التسجيل.' });
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});

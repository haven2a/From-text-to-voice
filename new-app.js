require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// إعداد الاتصال بـ Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));

// تقديم الملفات الثابتة من المجلد 'public'
app.use(express.static(path.join(__dirname, 'public')));

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار عرض نموذج التسجيل
app.get('/subscribe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'subscribe.html'));
});

// مسار معالجة نموذج التسجيل
app.post('/subscribe', async (req, res) => {
  const { name, email, password } = req.body;

  // التحقق من وجود جميع الحقول المطلوبة
  if (!name || !email || !password) {
    return res.send(`
      <script>
        alert('⚠️ جميع الحقول مطلوبة!');
        window.location.href = '/subscribe';
      </script>
    `);
  }

  // التحقق من صحة البريد الإلكتروني باستخدام تعبير منتظم
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return res.send(`
      <script>
        alert('⚠️ البريد الإلكتروني غير صحيح.');
        window.location.href = '/subscribe';
      </script>
    `);
  }

  try {
    // التحقق من عدم وجود البريد الإلكتروني في قاعدة البيانات
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (existingUser) {
      return res.send(`
        <script>
          alert('⚠️ البريد الإلكتروني مسجل مسبقًا.');
          window.location.href = '/subscribe';
        </script>
      `);
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إضافة المستخدم إلى قاعدة البيانات
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }]);

    if (insertError) throw insertError;

    // إعادة توجيه المستخدم بعد التسجيل الناجح
    return res.send(`
      <script>
        alert('✅ تم التسجيل بنجاح!');
        window.location.href = '/';
      </script>
    `);
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
    return res.send(`
      <script>
        alert('❌ حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقًا.');
        window.location.href = '/subscribe';
      </script>
    `);
  }
});

// بدء تشغيل الخادم
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على البورت ${PORT}`);
});

<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تسجيل جديد</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700&display=swap');

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(to right, #4facfe, #00f2fe);
      margin: 0;
      font-family: 'Cairo', sans-serif;
    }

    .SUBSCRIBE-box {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
      text-align: center;
      width: 400px;
      border: 5px solid #007bff;
    }

    .SUBSCRIBE-box h2 {
      font-size: 32px;
      margin-bottom: 20px;
      color: #333;
    }

    .SUBSCRIBE-box input {
      width: calc(100% - 22px);
      padding: 10px;
      margin: 10px 0;
      border: 2px solid #007bff;
      border-radius: 5px;
      font-size: 18px;
      text-align: center;
      display: block;
      margin-left: auto;
      margin-right: auto;
      outline: none;
    }

    .password-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .password-container input {
      width: 100%;
    }

    .password-container span {
      position: absolute;
      right: 10px;
      cursor: pointer;
      font-size: 18px;
      color: #007bff;
    }

    .terms {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px 0;
    }

    .terms input {
      margin-right: 10px;
      width: 20px;
      height: 20px;
    }

    .SUBSCRIBE-box button {
      background: #007bff;
      color: white;
      padding: 12px;
      border: none;
      width: 100%;
      font-size: 20px;
      cursor: pointer;
      border-radius: 5px;
    }

    .SUBSCRIBE-box button:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }

    .SUBSCRIBE-box button:hover:not(:disabled) {
      background: #0056b3;
    }

    .loader {
      display: none;
      margin: 20px 0;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #007bff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-left: auto;
      margin-right: auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <header>
    <img src="logo.png" alt="Logo" id="logo">
  </header>

  <div class="SUBSCRIBE-box">
    <h2>تسجيل جديد</h2>
    <!-- تأكد من إضافة خاصية name لكل حقل لإرسال البيانات بشكل صحيح -->
    <form id="SUBSCRIBEForm" action="/api/subscribe" method="POST">
      <input type="text" placeholder="الاسم الكامل" id="name" name="name" required autocomplete="off">
      <input type="email" placeholder="البريد الإلكتروني" id="email" name="email" required autocomplete="off">
      
      <div class="password-container">
        <input type="password" placeholder="كلمة المرور" id="password" name="password" required autocomplete="off">
        <span onclick="togglePassword()">👁️</span>
      </div>

      <div class="terms">
        <input type="checkbox" id="termsCheckbox" onchange="toggleSUBSCRIBEButton()">
        <label for="termsCheckbox">أوافق على <a href="privacy.html" target="_blank">سياسة الخصوصية</a> و <a href="terms.html" target="_blank">شروط الاستخدام</a></label>
      </div>

      <button id="SUBSCRIBEButton" type="submit" disabled>تسجيل</button>
      <div class="loader" id="loader"></div>
    </form>
  </div>

  <script>
    // المتغيرات الأساسية
    const form = document.getElementById("SUBSCRIBEForm");
    const subscribeButton = document.getElementById("SUBSCRIBEButton");
    const emailInput = document.getElementById("email");

    function togglePassword() {
      const passwordField = document.getElementById("password");
      passwordField.type = passwordField.type === "password" ? "text" : "password";
    }

    function toggleSUBSCRIBEButton() {
      const checkbox = document.getElementById("termsCheckbox");
      subscribeButton.disabled = !checkbox.checked;
    }

    // دالة التحقق من صحة البريد الإلكتروني
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    // مستمع الحدث عند تقديم النموذج
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // منع الإرسال الافتراضي للنموذج

      // تعطيل الزر أثناء الإرسال
      subscribeButton.disabled = true;
      subscribeButton.textContent = 'جارٍ الاشتراك...';

      // الحصول على البيانات من الحقول
      const name = document.getElementById("name").value;
      const email = emailInput.value;
      const password = document.getElementById("password").value;

      // التحقق من صحة البيانات الأساسية
      if (!name || !email || !password) {
        alert('الرجاء ملء جميع الحقول!');
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'تسجيل';
        return;
      }

      if (!validateEmail(email)) {
        alert('البريد الإلكتروني غير صالح.');
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'تسجيل';
        return;
      }

      console.log('البيانات المرسلة:', { name, email, password });

      // عرض المؤشر أثناء الإرسال
      document.getElementById("loader").style.display = 'block';

      // استخدام URLSearchParams لإرسال البيانات بتنسيق URL-encoded
      const formData = new URLSearchParams();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);

      // إرسال البيانات إلى الخادم
      fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })
      .then(response => response.text())  // نتوقع استجابة نصية
      .then(data => {
        document.getElementById("loader").style.display = 'none';
        alert('تم الاشتراك بنجاح!');
        // إعادة تفعيل الزر وإعادة النص
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'تسجيل';
        // يمكنك إضافة منطق إضافي هنا بعد الاشتراك الناجح، مثلاً إعادة التوجيه
        window.location.href = '/activate-info.html';
      })
      .catch(error => {
        console.error('حدث خطأ:', error);
        alert('حدث خطأ أثناء الاشتراك.');
        subscribeButton.disabled = false;
        subscribeButton.textContent = 'تسجيل';
        document.getElementById("loader").style.display = 'none';
      });
    });
  </script>
</body>
</html>

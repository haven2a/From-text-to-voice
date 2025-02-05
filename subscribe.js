document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("SUBSCRIBEForm");
  const subscribeButton = document.getElementById("SUBSCRIBEButton");
  const emailInput = document.getElementById("email");

  // دالة لتبديل إظهار/إخفاء كلمة المرور
  function togglePassword() {
    const passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
  }

  // دالة لتمكين أو تعطيل زر التسجيل بناءً على حالة مربع الشروط
  function toggleSUBSCRIBEButton() {
    const checkbox = document.getElementById("termsCheckbox");
    subscribeButton.disabled = !checkbox.checked;
  }

  // دالة للتحقق من صحة البريد الإلكتروني
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // مستمع الحدث عند تقديم النموذج
  form.addEventListener("submit", function(event) {
    event.preventDefault(); // منع الإرسال الافتراضي للنموذج

    // تعطيل الزر أثناء الإرسال وتغيير النص
    subscribeButton.disabled = true;
    subscribeButton.textContent = "جارٍ الاشتراك...";

    // الحصول على البيانات من الحقول
    const name = document.getElementById("name").value;
    const email = emailInput.value;
    const password = document.getElementById("password").value;

    // التحقق من ملء جميع الحقول
    if (!name || !email || !password) {
      alert("الرجاء ملء جميع الحقول!");
      subscribeButton.disabled = false;
      subscribeButton.textContent = "تسجيل";
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
      alert("البريد الإلكتروني غير صالح.");
      subscribeButton.disabled = false;
      subscribeButton.textContent = "تسجيل";
      return;
    }

    console.log("البيانات المرسلة:", { name, email, password });

    // عرض المؤشر أثناء عملية الإرسال
    document.getElementById("loader").style.display = "block";

    // إعداد البيانات بتنسيق URL-encoded
    const formData = new URLSearchParams();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);

    // إرسال البيانات إلى الخادم عبر المسار /subscribe
    fetch("/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    })
      .then(response => response.text())  // نتوقع استجابة نصية من الخادم
      .then(data => {
        document.getElementById("loader").style.display = "none";
        alert("تم الاشتراك بنجاح!");
        subscribeButton.disabled = false;
        subscribeButton.textContent = "تسجيل";
        // إعادة التوجيه إلى صفحة التفعيل بعد النجاح
        window.location.href = "/activate-info.html";
      })
      .catch(error => {
        console.error("حدث خطأ:", error);
        alert("حدث خطأ أثناء الاشتراك.");
        subscribeButton.disabled = false;
        subscribeButton.textContent = "تسجيل";
        document.getElementById("loader").style.display = "none";
      });
  });

  // تعيين الدوال للكائن window إذا احتجت استخدامها من عناصر HTML مباشرة
  window.togglePassword = togglePassword;
  window.toggleSUBSCRIBEButton = toggleSUBSCRIBEButton;
});

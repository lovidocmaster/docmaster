(function () {
  var loginForm = document.getElementById("login-form");
  var signupForm = document.getElementById("signup-form");

  function showMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = "status-msg " + (kind || "info");
    el.style.display = "block";
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim();
      var msg = document.getElementById("login-msg");
      if (!email) {
        showMsg(msg, "Please enter your email.", "err");
        return;
      }
      try {
        sessionStorage.setItem(
          "docmaster_user",
          JSON.stringify({ email: email, at: Date.now() })
        );
        showMsg(msg, "Signed in (demo). Redirecting…", "ok");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 600);
      } catch (err) {
        showMsg(msg, "Could not save session.", "err");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("name").value.trim();
      var email = document.getElementById("email").value.trim();
      var terms = document.getElementById("terms");
      var msg = document.getElementById("signup-msg");
      if (!terms || !terms.checked) {
        showMsg(msg, "Please accept the terms to continue.", "err");
        return;
      }
      if (!name || !email) {
        showMsg(msg, "Please fill in all fields.", "err");
        return;
      }
      try {
        localStorage.setItem(
          "docmaster_profile",
          JSON.stringify({ name: name, email: email, at: Date.now() })
        );
        sessionStorage.setItem(
          "docmaster_user",
          JSON.stringify({ email: email, name: name, at: Date.now() })
        );
        showMsg(msg, "Account created (demo). Redirecting…", "ok");
        setTimeout(function () {
          window.location.href = "index.html";
        }, 600);
      } catch (err) {
        showMsg(msg, "Could not save profile.", "err");
      }
    });
  }
})();

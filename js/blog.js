(function () {
  var form = document.getElementById("newsletter-form");
  var msg = document.getElementById("newsletter-msg");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (msg) {
      msg.textContent =
        "Thanks! You are on the list (demo). We will only use your email for product updates.";
      msg.className = "status-msg ok";
      msg.style.display = "block";
    }
    form.reset();
  });
})();

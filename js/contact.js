(function () {
  var form = document.getElementById("contact-form");
  var msg = document.getElementById("contact-form-msg");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (msg) {
      msg.textContent =
        "Thank you — your message has been recorded for this demo. In production we would email support@ilovedoc.co.";
      msg.className = "status-msg ok";
      msg.style.display = "block";
    }
    form.reset();
  });
})();

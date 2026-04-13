(function () {
  var PDFLib = window.PDFLib;
  var fileInput = document.getElementById("file");
  var textInput = document.getElementById("text");
  var opacityInput = document.getElementById("opacity");
  var opacityLabel = document.getElementById("opacity-label");
  var btn = document.getElementById("go-btn");
  var statusEl = document.getElementById("status");

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  function updateOpacityLabel() {
    opacityLabel.textContent = Math.round(parseFloat(opacityInput.value) * 100) + "%";
  }

  opacityInput.addEventListener("input", updateOpacityLabel);
  updateOpacityLabel();

  fileInput.addEventListener("change", function () {
    btn.disabled = !(fileInput.files && fileInput.files[0]);
    showStatus("", "");
  });

  btn.addEventListener("click", async function () {
    if (!PDFLib || !fileInput.files || !fileInput.files[0]) return;
    var text = (textInput.value || "WATERMARK").trim();
    if (!text) {
      showStatus("Enter watermark text.", "err");
      return;
    }
    var op = parseFloat(opacityInput.value);
    var rgb = PDFLib.rgb;
    var degrees = PDFLib.degrees;
    var StandardFonts = PDFLib.StandardFonts;

    btn.disabled = true;
    showStatus("Applying watermark…", "info");
    try {
      var buf = await fileInput.files[0].arrayBuffer();
      var doc = await PDFLib.PDFDocument.load(buf);
      var font = await doc.embedFont(StandardFonts.HelveticaBold);
      var pages = doc.getPages();

      for (var i = 0; i < pages.length; i++) {
        var page = pages[i];
        var size = page.getSize();
        var w = size.width;
        var h = size.height;
        var fontSize = Math.min(w, h) * 0.12;
        var textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: w / 2 - textWidth / 2,
          y: h / 2 - fontSize * 0.35,
          size: fontSize,
          font: font,
          color: rgb(0.55, 0.55, 0.55),
          opacity: op,
          rotate: degrees(-35),
        });
      }

      var out = await doc.save();
      var blob = new Blob([out], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "docmaster-watermarked.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showStatus("Done.", "ok");
    } catch (e) {
      console.error(e);
      showStatus("Watermark failed. PDF may be encrypted.", "err");
    }
    btn.disabled = false;
  });
})();

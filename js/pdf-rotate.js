(function () {
  var PDFLib = window.PDFLib;
  var fileInput = document.getElementById("file");
  var angleSel = document.getElementById("angle");
  var scopeRadios = document.querySelectorAll('input[name="scope"]');
  var rangeFields = document.getElementById("range-fields");
  var fromInput = document.getElementById("from");
  var toInput = document.getElementById("to");
  var pageInfo = document.getElementById("page-info");
  var btn = document.getElementById("go-btn");
  var statusEl = document.getElementById("status");
  var pageCount = 0;

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  function getScope() {
    for (var i = 0; i < scopeRadios.length; i++) {
      if (scopeRadios[i].checked) return scopeRadios[i].value;
    }
    return "all";
  }

  scopeRadios.forEach(function (r) {
    r.addEventListener("change", function () {
      rangeFields.style.display = getScope() === "range" ? "grid" : "none";
    });
  });

  fileInput.addEventListener("change", async function () {
    showStatus("", "");
    pageCount = 0;
    pageInfo.textContent = "";
    btn.disabled = !fileInput.files || !fileInput.files[0];
    if (!btn.disabled && PDFLib) {
      try {
        var buf = await fileInput.files[0].arrayBuffer();
        var doc = await PDFLib.PDFDocument.load(buf);
        pageCount = doc.getPageCount();
        pageInfo.textContent = pageCount + " page(s).";
        fromInput.max = pageCount;
        toInput.max = pageCount;
        fromInput.value = 1;
        toInput.value = pageCount;
      } catch (e) {
        pageInfo.textContent = "Could not read PDF.";
      }
    }
  });

  btn.addEventListener("click", async function () {
    if (!PDFLib || !fileInput.files || !fileInput.files[0]) return;
    var angle = parseInt(angleSel.value, 10);

    btn.disabled = true;
    showStatus("Rotating…", "info");
    try {
      var buf = await fileInput.files[0].arrayBuffer();
      var bytes = new Uint8Array(buf);
      var doc = await PDFLib.PDFDocument.load(bytes);
      var total = doc.getPageCount();
      var targets = [];
      if (getScope() === "all") {
        for (var i = 0; i < total; i++) targets.push(i);
      } else {
        var from = Math.max(1, parseInt(fromInput.value, 10) || 1);
        var to = Math.max(from, parseInt(toInput.value, 10) || from);
        to = Math.min(to, total);
        from = Math.min(from, to);
        for (var j = from - 1; j <= to - 1; j++) targets.push(j);
      }

      targets.forEach(function (idx) {
        var page = doc.getPage(idx);
        var rot = page.getRotation();
        var current = rot && typeof rot.angle === "number" ? rot.angle : 0;
        var next = (current + angle) % 360;
        page.setRotation(PDFLib.degrees(next));
      });

      var out = await doc.save();
      var blob = new Blob([out], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "docmaster-rotated.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showStatus("Done.", "ok");
    } catch (e) {
      console.error(e);
      showStatus("Rotation failed.", "err");
    }
    btn.disabled = false;
  });
})();

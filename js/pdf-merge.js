(function () {
  var PDFLib = window.PDFLib;
  var input = document.getElementById("files");
  var btn = document.getElementById("merge-btn");
  var statusEl = document.getElementById("status");

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  if (!input || !btn) return;

  input.addEventListener("change", function () {
    btn.disabled = !input.files || input.files.length < 2;
    showStatus("", "");
  });

  btn.addEventListener("click", async function () {
    if (!PDFLib) {
      showStatus("PDF library failed to load. Check your network.", "err");
      return;
    }
    var files = Array.from(input.files || []).filter(function (f) {
      return f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    });
    if (files.length < 2) {
      showStatus("Please choose at least two PDF files.", "err");
      return;
    }
    btn.disabled = true;
    showStatus("Merging…", "info");
    try {
      var merged = await PDFLib.PDFDocument.create();
      for (var i = 0; i < files.length; i++) {
        var buf = await files[i].arrayBuffer();
        var src = await PDFLib.PDFDocument.load(buf);
        var indices = src.getPageIndices();
        var copied = await merged.copyPages(src, indices);
        copied.forEach(function (p) {
          merged.addPage(p);
        });
      }
      var out = await merged.save();
      var blob = new Blob([out], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "docmaster-merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showStatus("Done. Your download should start shortly.", "ok");
    } catch (e) {
      console.error(e);
      showStatus("Could not merge PDFs. They may be encrypted or corrupted.", "err");
    }
    btn.disabled = false;
  });
})();

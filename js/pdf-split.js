(function () {
  var PDFLib = window.PDFLib;
  var JSZip = window.JSZip;
  var fileInput = document.getElementById("file");
  var mode = document.getElementById("mode");
  var rangeFields = document.getElementById("range-fields");
  var fromInput = document.getElementById("from");
  var toInput = document.getElementById("to");
  var pageInfo = document.getElementById("page-info");
  var btn = document.getElementById("split-btn");
  var statusEl = document.getElementById("status");
  var pageCount = 0;

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  function updateUI() {
    var hasFile = fileInput.files && fileInput.files.length;
    btn.disabled = !hasFile;
    if (mode.value === "range") {
      rangeFields.style.display = "grid";
    } else {
      rangeFields.style.display = "none";
    }
  }

  mode.addEventListener("change", updateUI);
  fileInput.addEventListener("change", async function () {
    showStatus("", "");
    pageCount = 0;
    pageInfo.textContent = "";
    if (!fileInput.files || !fileInput.files[0]) {
      updateUI();
      return;
    }
    if (!PDFLib) {
      showStatus("PDF library failed to load.", "err");
      return;
    }
    try {
      var buf = await fileInput.files[0].arrayBuffer();
      var doc = await PDFLib.PDFDocument.load(buf);
      pageCount = doc.getPageCount();
      pageInfo.textContent = "This PDF has " + pageCount + " page(s).";
      fromInput.max = pageCount;
      toInput.max = pageCount;
      fromInput.value = 1;
      toInput.value = pageCount;
    } catch (e) {
      pageInfo.textContent = "Could not read PDF.";
    }
    updateUI();
  });

  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  btn.addEventListener("click", async function () {
    if (!PDFLib || !fileInput.files || !fileInput.files[0]) return;
    btn.disabled = true;
    showStatus("Splitting…", "info");
    try {
      var buf = await fileInput.files[0].arrayBuffer();
      var src = await PDFLib.PDFDocument.load(buf);
      var total = src.getPageCount();

      if (mode.value === "each") {
        if (!JSZip) {
          showStatus("ZIP library failed to load. Cannot bundle multiple PDFs.", "err");
          btn.disabled = false;
          return;
        }
        var zip = new JSZip();
        for (var i = 0; i < total; i++) {
          var out = await PDFLib.PDFDocument.create();
          var copied = await out.copyPages(src, [i]);
          out.addPage(copied[0]);
          var bytes = await out.save();
          zip.file("page-" + String(i + 1).padStart(3, "0") + ".pdf", bytes);
        }
        var zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "docmaster-split-pages.zip");
        showStatus("Downloaded ZIP with " + total + " PDF(s).", "ok");
      } else {
        var from = Math.max(1, parseInt(fromInput.value, 10) || 1);
        var to = Math.max(from, parseInt(toInput.value, 10) || from);
        to = Math.min(to, total);
        from = Math.min(from, to);
        var indices = [];
        for (var j = from - 1; j <= to - 1; j++) indices.push(j);
        var newDoc = await PDFLib.PDFDocument.create();
        var pages = await newDoc.copyPages(src, indices);
        pages.forEach(function (p) {
          newDoc.addPage(p);
        });
        var outBytes = await newDoc.save();
        downloadBlob(
          new Blob([outBytes], { type: "application/pdf" }),
          "docmaster-pages-" + from + "-" + to + ".pdf"
        );
        showStatus("Done. Downloaded selected range.", "ok");
      }
    } catch (e) {
      console.error(e);
      showStatus("Split failed. File may be encrypted.", "err");
    }
    btn.disabled = false;
  });

  updateUI();
})();

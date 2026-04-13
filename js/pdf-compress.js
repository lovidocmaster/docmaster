(function () {
  var pdfjsLib = window.pdfjsLib;
  var PDFLib = window.PDFLib;
  var fileInput = document.getElementById("file");
  var qualityInput = document.getElementById("quality");
  var qualityLabel = document.getElementById("quality-label");
  var btn = document.getElementById("go-btn");
  var statusEl = document.getElementById("status");

  if (typeof pdfjsLib !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  function dataURLToUint8Array(dataURL) {
    var base64 = dataURL.split(",")[1];
    var binary = atob(base64);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  qualityInput.addEventListener("input", function () {
    qualityLabel.textContent = Math.round(parseFloat(qualityInput.value) * 100) + "%";
  });
  qualityLabel.textContent = Math.round(parseFloat(qualityInput.value) * 100) + "%";

  fileInput.addEventListener("change", function () {
    btn.disabled = !(fileInput.files && fileInput.files[0]);
    showStatus("", "");
  });

  btn.addEventListener("click", async function () {
    if (!fileInput.files || !fileInput.files[0] || !pdfjsLib || !PDFLib) {
      showStatus("Missing library or file.", "err");
      return;
    }
    btn.disabled = true;
    var q = parseFloat(qualityInput.value);
    showStatus("Rendering pages…", "info");
    try {
      var arrayBuffer = await fileInput.files[0].arrayBuffer();
      var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      var numPages = pdf.numPages;
      var outDoc = await PDFLib.PDFDocument.create();
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");

      for (var p = 1; p <= numPages; p++) {
        showStatus("Page " + p + " / " + numPages + "…", "info");
        var page = await pdf.getPage(p);
        var base = page.getViewport({ scale: 1 });
        var scale = Math.min(2, 1100 / Math.max(base.width, 1));
        var viewport = page.getViewport({ scale: scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        var dataUrl = canvas.toDataURL("image/jpeg", q);
        var jpgBytes = dataURLToUint8Array(dataUrl);
        var image = await outDoc.embedJpg(jpgBytes);
        var dims = image.scale(1);
        var newPage = outDoc.addPage([dims.width, dims.height]);
        newPage.drawImage(image, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      }

      var bytes = await outDoc.save();
      var blob = new Blob([bytes], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "docmaster-compressed.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showStatus("Done. Compressed PDF downloaded.", "ok");
    } catch (e) {
      console.error(e);
      showStatus("Compression failed. Try another PDF or lower page count.", "err");
    }
    btn.disabled = !(fileInput.files && fileInput.files[0]);
  });
})();

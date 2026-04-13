(function () {
  var PDFLib = window.PDFLib;
  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var camBtn = document.getElementById("cam-btn");
  var snapBtn = document.getElementById("snap-btn");
  var pdfBtn = document.getElementById("pdf-btn");
  var clearBtn = document.getElementById("clear-btn");
  var thumbs = document.getElementById("thumbs");
  var camHint = document.getElementById("cam-hint");
  var statusEl = document.getElementById("status");
  var stream = null;
  /** @type {string[]} */
  var captures = [];

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

  function renderThumbs() {
    thumbs.innerHTML = "";
    captures.forEach(function (url, idx) {
      var img = document.createElement("img");
      img.src = url;
      img.alt = "Captured page " + (idx + 1);
      thumbs.appendChild(img);
    });
    pdfBtn.disabled = captures.length === 0;
    clearBtn.disabled = captures.length === 0;
  }

  camBtn.addEventListener("click", async function () {
    if (stream) {
      stream.getTracks().forEach(function (t) {
        t.stop();
      });
      stream = null;
      video.srcObject = null;
      camBtn.textContent = "Start camera";
      snapBtn.disabled = true;
      camHint.textContent = "Camera stopped.";
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      camHint.textContent = "Camera API not available. Use HTTPS or a modern browser.";
      showStatus("getUserMedia unsupported.", "err");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      video.srcObject = stream;
      camBtn.textContent = "Stop camera";
      snapBtn.disabled = false;
      camHint.textContent = "Position the document and tap “Capture page” for each sheet.";
      showStatus("", "");
    } catch (e) {
      console.error(e);
      camHint.textContent = "Could not access camera. Check permissions.";
      showStatus("Camera error.", "err");
    }
  });

  snapBtn.addEventListener("click", function () {
    if (!stream || !video.videoWidth) {
      showStatus("Wait for the video preview.", "err");
      return;
    }
    var w = video.videoWidth;
    var h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    var dataUrl = canvas.toDataURL("image/png");
    captures.push(dataUrl);
    renderThumbs();
    showStatus("Captured page " + captures.length + ".", "ok");
  });

  clearBtn.addEventListener("click", function () {
    captures = [];
    renderThumbs();
    showStatus("Cleared captures.", "info");
  });

  pdfBtn.addEventListener("click", async function () {
    if (!PDFLib || captures.length === 0) return;
    pdfBtn.disabled = true;
    showStatus("Building PDF…", "info");
    try {
      var doc = await PDFLib.PDFDocument.create();
      for (var i = 0; i < captures.length; i++) {
        var pngBytes = dataURLToUint8Array(captures[i]);
        var image = await doc.embedPng(pngBytes);
        var dims = image.scale(1);
        var page = doc.addPage([dims.width, dims.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      }
      var bytes = await doc.save();
      var blob = new Blob([bytes], { type: "application/pdf" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "docmaster-scan.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showStatus("PDF ready.", "ok");
    } catch (e) {
      console.error(e);
      showStatus("Could not build PDF.", "err");
    }
    pdfBtn.disabled = captures.length === 0;
  });
})();

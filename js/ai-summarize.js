(function () {
  var pdfjsLib = window.pdfjsLib;
  if (typeof pdfjsLib !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  var fileInput = document.getElementById("file");
  var paste = document.getElementById("paste");
  var btn = document.getElementById("summarize-btn");
  var clearBtn = document.getElementById("clear-btn");
  var output = document.getElementById("output");
  var statusEl = document.getElementById("status");

  var STOP = {
    the: 1,
    a: 1,
    an: 1,
    and: 1,
    or: 1,
    but: 1,
    in: 1,
    on: 1,
    at: 1,
    to: 1,
    for: 1,
    of: 1,
    as: 1,
    by: 1,
    with: 1,
    from: 1,
    is: 1,
    are: 1,
    was: 1,
    were: 1,
    be: 1,
    been: 1,
    being: 1,
    have: 1,
    has: 1,
    had: 1,
    do: 1,
    does: 1,
    did: 1,
    will: 1,
    would: 1,
    could: 1,
    should: 1,
    this: 1,
    that: 1,
    these: 1,
    those: 1,
    it: 1,
    its: 1,
    they: 1,
    them: 1,
    their: 1,
    we: 1,
    you: 1,
    he: 1,
    she: 1,
    i: 1,
    not: 1,
    no: 1,
    so: 1,
    if: 1,
    than: 1,
    then: 1,
    into: 1,
    about: 1,
    which: 1,
    who: 1,
    what: 1,
    when: 1,
    where: 1,
    while: 1,
    can: 1,
    may: 1,
    also: 1,
    such: 1,
    our: 1,
    all: 1,
    any: 1,
    each: 1,
    other: 1,
    more: 1,
    most: 1,
    some: 1,
    very: 1,
    just: 1,
  };

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  function tokenizeWords(s) {
    return s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function splitSentences(text) {
    var cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return [];
    var parts = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    return parts
      .map(function (s) {
        return s.trim();
      })
      .filter(function (p) {
        return p.length > 20;
      });
  }

  function summarize(text, maxSentences) {
    maxSentences = maxSentences || 5;
    var sentences = splitSentences(text);
    if (sentences.length === 0) {
      return "Not enough text to summarize. Try a longer document.";
    }
    var words = tokenizeWords(text);
    var freq = {};
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w.length < 3 || STOP[w]) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
    var scored = sentences.map(function (sent, idx) {
      var sw = tokenizeWords(sent);
      var score = 0;
      for (var j = 0; j < sw.length; j++) {
        score += freq[sw[j]] || 0;
      }
      return { sent: sent, score: score, idx: idx };
    });
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.idx - b.idx;
    });
    var picked = scored.slice(0, maxSentences);
    picked.sort(function (a, b) {
      return a.idx - b.idx;
    });
    return picked.map(function (x) {
      return "• " + x.sent;
    }).join("\n\n");
  }

  async function extractPdfText(arrayBuffer) {
    if (!pdfjsLib) throw new Error("PDF.js not loaded");
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var full = "";
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var content = await page.getTextContent();
      var strings = content.items.map(function (it) {
        return it.str || "";
      });
      full += strings.join(" ") + "\n";
    }
    return full.trim();
  }

  btn.addEventListener("click", async function () {
    output.textContent = "Working…";
    showStatus("", "");
    var text = paste.value.trim();
    try {
      if (fileInput.files && fileInput.files[0]) {
        var f = fileInput.files[0];
        if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
          if (!pdfjsLib) {
            showStatus("PDF library missing.", "err");
            return;
          }
          showStatus("Extracting text from PDF…", "info");
          var buf = await f.arrayBuffer();
          text = await extractPdfText(buf);
        } else {
          text = await f.text();
        }
      }
      if (!text || text.length < 80) {
        output.textContent =
          "Please provide more text (at least a few sentences), upload a .txt/.pdf, or paste content.";
        showStatus("", "");
        return;
      }
      var summary = summarize(text, 6);
      output.textContent = summary;
      showStatus("Summary uses extractive scoring in your browser only.", "ok");
    } catch (e) {
      console.error(e);
      output.textContent = "Could not read the document.";
      showStatus("Error reading file.", "err");
    }
  });

  clearBtn.addEventListener("click", function () {
    output.textContent = "Results appear here.";
    showStatus("", "");
  });
})();

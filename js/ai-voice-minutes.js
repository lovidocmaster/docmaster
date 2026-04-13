(function () {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var startBtn = document.getElementById("start-btn");
  var stopBtn = document.getElementById("stop-btn");
  var minutesBtn = document.getElementById("minutes-btn");
  var transcriptEl = document.getElementById("transcript");
  var minutesOut = document.getElementById("minutes-out");
  var langSel = document.getElementById("lang");
  var recHint = document.getElementById("rec-hint");
  var statusEl = document.getElementById("status");
  var recognition = null;
  var listening = false;

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status-msg " + (kind || "info");
    statusEl.style.display = text ? "block" : "none";
  }

  if (!SpeechRecognition) {
    recHint.textContent =
      "Speech recognition is not available in this browser. Paste a transcript and use “Generate minutes.”";
    startBtn.disabled = true;
    stopBtn.disabled = true;
  } else {
    recHint.textContent =
      "Grant microphone access when prompted. Works best in Chrome or Edge over HTTPS or localhost.";
  }

  function appendTranscript(chunk) {
    if (!chunk) return;
    var t = transcriptEl.value;
    transcriptEl.value = (t ? t + " " : "") + chunk;
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  startBtn.addEventListener("click", function () {
    if (!SpeechRecognition) return;
    if (listening) return;
    recognition = new SpeechRecognition();
    recognition.lang = langSel.value;
    recognition.continuous = true;
    recognition.interimResults = true;
    listening = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    showStatus("Listening…", "info");

    recognition.onresult = function (event) {
      var finalText = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }
      if (finalText) appendTranscript(finalText.trim());
    };

    recognition.onerror = function (e) {
      showStatus("Speech error: " + (e.error || "unknown"), "err");
      listening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    };

    recognition.onend = function () {
      if (listening) {
        try {
          recognition.start();
        } catch (err) {
          listening = false;
          startBtn.disabled = false;
          stopBtn.disabled = true;
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      listening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      showStatus("Could not start microphone.", "err");
    }
  });

  stopBtn.addEventListener("click", function () {
    listening = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    showStatus("Stopped.", "ok");
  });

  function buildMinutes(text) {
    var lines = text
      .split(/[.!?]\s+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 8;
      });
    var bullets = lines.slice(0, 12).map(function (l) {
      return "• " + l;
    });
    var dateStr = new Date().toLocaleString();
    return (
      "Meeting minutes (draft)\n" +
      "Date: " +
      dateStr +
      "\n\n" +
      "Attendees: (add names)\n\n" +
      "Summary:\n" +
      (bullets.length ? bullets.join("\n") : "• (No bullet points extracted — try longer sentences.)") +
      "\n\n" +
      "Action items:\n" +
      "• (Review transcript and list owners + deadlines)\n\n" +
      "Next steps:\n" +
      "• Schedule follow-up if needed\n"
    );
  }

  minutesBtn.addEventListener("click", function () {
    var t = transcriptEl.value.trim();
    if (!t) {
      showStatus("Add a transcript first.", "err");
      return;
    }
    minutesOut.textContent = buildMinutes(t);
    showStatus("Minutes are a local template — edit before sharing.", "ok");
  });
})();

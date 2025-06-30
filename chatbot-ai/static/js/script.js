document.addEventListener("DOMContentLoaded", function () {
  const inputText = document.getElementById("inputText");
  const charCount = document.getElementById("charCount");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const error = document.getElementById("error");

  // Character counter
  inputText.addEventListener("input", function () {
    const length = this.value.length;
    charCount.textContent = `${length}/1000 characters`;

    if (length > 1000) {
      charCount.classList.add("text-red-500");
    } else {
      charCount.classList.remove("text-red-500");
    }
  });

  function getCacheKey(text) {
    // Use encodeURIComponent to keep all Unicode characters safe
    return "analysis_" + encodeURIComponent(text).slice(0, 64);
  }

  // Analyze button
  analyzeBtn.addEventListener("click", async function () {
    const text = inputText.value.trim();

    if (!text) {
      console.warn(
        "🚫 Teks kosong. Asli:",
        inputText.value,
        " | Trimmed:",
        text
      );
      showError("Please enter the text you want to analyze");
      return;
    }

    if (text.length > 1000) {
      showError("The text is too long (maximum 1000 characters)");
      return;
    }

    // Check cache before fetch
    const cacheKey = getCacheKey(text);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      showResults(JSON.parse(cached));
      return;
    }

    hideAllSections();
    showLoading();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyze...";

    // --- Mulai timeout fetch ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log("🧾 Sending to backend:", JSON.stringify({ text })); // optional debug log

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ text: text }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        showResults(data.result);
        // Save to cache after getting a response
        localStorage.setItem(cacheKey, JSON.stringify(data.result));
      } else {
        showError(data.error || "Error occurred while analyzing");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      showError(
        err.message.includes("Failed to fetch")
          ? "Internet connection problem or server not responding."
          : `Error occurred: ${err.message}`
      );
    } finally {
      hideLoading();
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Analyze Now";
    }
  });

  function hideAllSections() {
    results.classList.add("hidden");
    error.classList.add("hidden");
    loading.classList.add("hidden");
  }

  function showError(message) {
    hideAllSections();
    document.getElementById("errorMessage").textContent = message;
    error.classList.remove("hidden");
  }

  function showResults(result) {
    hideAllSections();

    // Status badge
    const statusBadge = document.getElementById("statusBadge");
    const kategoriMap = {
      "potensi penipuan": "Potential Scam",
      "promosi judi online": "Online Gambling Promotion",
      hoax: "Hoax",
      aman: "Safe",
    };
    const kategoriValue = (result.kategori || "").toLowerCase();
    const kategoriEn = kategoriMap[kategoriValue] || result.kategori;
    const badgeColor = getBadgeColor(result.kategori);
    statusBadge.innerHTML = `<span class="inline-flex items-center px-3 py-1 rounded-full text-base font-medium ${badgeColor}">${kategoriEn}</span>`;

    // Explanation
    document.getElementById("explanation").textContent =
      result.penjelasan || "No explanation available";

    // Indicators
    const indicatorsList = document.getElementById("indicators");
    const indicatorsSection = document.getElementById("indicatorsSection");

    if (result.indikator_bahaya && result.indikator_bahaya.length > 0) {
      indicatorsList.innerHTML = "";
      result.indikator_bahaya.forEach((indicator) => {
        const li = document.createElement("li");
        li.textContent = indicator;
        indicatorsList.appendChild(li);
      });
      indicatorsSection.classList.remove("hidden");
    } else {
      indicatorsSection.classList.add("hidden");
    }

    // Confidence Level
    const confidenceMap = {
      tinggi: "HIGH",
      sedang: "MEDIUM",
      rendah: "LOW",
      high: "HIGH",
      medium: "MEDIUM",
      low: "LOW",
    };
    const confidenceValue = (result.confidence || "").toLowerCase();
    document.getElementById("confidence").textContent =
      confidenceMap[confidenceValue] || confidenceValue.toUpperCase();

    // Sentiment
    const sentiment = result.sentiment || "neutral";
    document.getElementById("sentiment").textContent =
      getSentimentText(sentiment);

    results.classList.remove("hidden");

    if (result.detected_language) {
      showLanguageInfo(result.detected_language);
    }
  }

  function getBadgeColor(kategori) {
    switch (kategori.toLowerCase()) {
      case "potensi penipuan":
      case "potential scam":
        return "bg-red-100 text-red-800";
      case "promosi judi online":
      case "online gambling promotion":
        return "bg-orange-100 text-orange-800";
      case "hoax":
        return "bg-yellow-100 text-yellow-800";
      case "aman":
      case "safe":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getSentimentText(sentiment) {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "😊 Positive";
      case "negative":
        return "😟 Negative";
      case "neutral":
        return "😐 Neutral";
      default:
        return "❓ Unknown";
    }
  }

  function showLoading() {
    loading.classList.remove("hidden");
    void loading.offsetWidth;
    loading.classList.remove("opacity-0");
  }

  function showLanguageInfo(language) {
    const el = document.getElementById("languageInfo");
    if (!el) return;

    if (
      language.toLowerCase().includes("indonesian") ||
      language.toLowerCase().includes("id")
    ) {
      el.textContent = "Language Detected: Bahasa Indonesia 🇮🇩";
    } else if (
      language.toLowerCase().includes("english") ||
      language.toLowerCase().includes("en")
    ) {
      el.textContent = "Language Detected: English 🇺🇸";
    } else {
      el.textContent = `Language Detected: ${language}`;
    }

    el.classList.remove("opacity-0");
    el.classList.add("opacity-100");
  }

  function hideLanguageInfo() {
    const el = document.getElementById("languageInfo");
    if (el) {
      el.classList.remove("opacity-100");
      el.classList.add("opacity-0");
    }
  }

  function hideLoading() {
    loading.classList.add("opacity-0");
    setTimeout(() => {
      loading.classList.add("hidden");
    }, 500);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Element Selections
  const inputText = document.getElementById("inputText");
  const charCount = document.getElementById("charCount");
  const analyzeBtn = document.getElementById("analyzeBtn");
  // Tambahkan selector untuk teks di dalam tombol
  const btnText = document.getElementById("btnText");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const error = document.getElementById("error");
  const errorMessage = document.getElementById("errorMessage");

  // Result fields
  const statusBadge = document.getElementById("statusBadge");
  const explanation = document.getElementById("explanation");
  const indicatorsSection = document.getElementById("indicatorsSection");
  const indicators = document.getElementById("indicators");
  const confidence = document.getElementById("confidence");
  const sentiment = document.getElementById("sentiment");
  const languageInfo = document.getElementById("languageInfo");

  const MAX_CHARS = 1000;

  /**
   * Character Counter
   */
  inputText.addEventListener("input", () => {
    const count = inputText.value.length;
    charCount.textContent = `${count}/${MAX_CHARS} characters`;
    if (count > MAX_CHARS) {
      charCount.classList.add("text-red-500");
    } else {
      charCount.classList.remove("text-red-500");
    }
  });

  /**
   * UI State Management
   */
  function showLoading(isLoading) {
    if (isLoading) {
      // Tampilkan blok loading utama
      loading.classList.remove("hidden", "opacity-0");
      // Nonaktifkan tombol dan ubah teksnya
      analyzeBtn.disabled = true;
      btnText.textContent = "Analyzing...";
      // Sembunyikan hasil dan error sebelumnya
      results.classList.add("hidden");
      error.classList.add("hidden");
    } else {
      // Sembunyikan blok loading utama
      loading.classList.add("hidden", "opacity-0");
      // Aktifkan kembali tombol dan kembalikan teksnya
      analyzeBtn.disabled = false;
      btnText.textContent = "Analyze Now";
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove("hidden");
    results.classList.add("hidden");
  }

  function showResults(data) {
    // Set Status Badge
    const category = data.category || "Unknown";
    let badgeColor = "bg-gray-500";
    if (category === "Safe") badgeColor = "bg-green-500";
    if (["Scam", "Hoax", "Online Gambling"].includes(category))
      badgeColor = "bg-red-500";
    statusBadge.innerHTML = `<span class="px-3 py-1 text-sm font-semibold text-white rounded-full ${badgeColor}">${category}</span>`;

    // Set other fields
    explanation.textContent = data.explanation || "No explanation provided.";
    confidence.textContent = data.confidence || "N/A";
    sentiment.textContent = data.sentiment || "N/A";

    // Set Risk Indicators
    if (data.risk_indicators && data.risk_indicators.length > 0) {
      indicators.innerHTML = data.risk_indicators
        .map((item) => `<li>${item}</li>`)
        .join("");
      indicatorsSection.classList.remove("hidden");
    } else {
      indicatorsSection.classList.add("hidden");
    }

    // Show language if available
    if (data.language) {
      languageInfo.textContent = `Detected Language: ${data.language}`;
      languageInfo.classList.remove("hidden");
      languageInfo.classList.remove("opacity-0");
    } else {
      languageInfo.textContent = "Detected Language: Unknown";
      languageInfo.classList.remove("hidden");
      languageInfo.classList.remove("opacity-0");
    }

    results.classList.remove("hidden");
    error.classList.add("hidden");
  }

  /**
   * Main Analyze Button Logic
   */
  analyzeBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();

    if (!text) {
      showError("Please enter some text to analyze.");
      return;
    }
    if (text.length > MAX_CHARS) {
      showError(`Text cannot exceed ${MAX_CHARS} characters.`);
      return;
    }

    showLoading(true);

    try {
      const resultData = await analyzeWithGemini(text);
      showResults(resultData);
    } catch (err) {
      console.error("Analysis failed:", err);
      showError(err.message || "An unknown error occurred.");
    } finally {
      showLoading(false);
    }
  });

  /**
   * Gemini API Call via Vercel Proxy
   */
  async function analyzeWithGemini(text) {
    const VERCEL_PROXY_URL =
      "https://chatbot-ai-backend-4cqoeatnn-chatbot-ai-backend.vercel.app/api/analyze";

    // Untuk tes lokal, gunakan URL dari 'vercel dev'
    // const VERCEL_PROXY_URL = "http://localhost:3000/api/analyze";

    const response = await fetch(VERCEL_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }), // Kirim teks mentah
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Response from Vercel proxy:", data);
    return data; // Data sudah dalam format JSON yang benar
  }
});

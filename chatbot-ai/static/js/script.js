/**
 * Chatbot AI Script - Frontend Only (No Backend)
 * Author: Wira DP + ChatGPT
 *
 * Features:
 * - Analyze text for Scam, Hoax, Gambling using Gemini API
 * - Works fully static on GitHub Pages
 * - Caches results locally
 * - Supports multi-language input/output
 */

document.addEventListener("DOMContentLoaded", () => {
  // 🔹 DOM Elements
  const inputText = document.getElementById("inputText");
  const charCount = document.getElementById("charCount");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const error = document.getElementById("error");

  // 🔹 Google Gemini API Key
  const GEMINI_API_KEY = AIzaSyCPcdTGipnO7UH0D7A2m1ME7fOJ3uNdvso;

  /**
   * Character Counter
   */
  inputText.addEventListener("input", () => {
    const length = inputText.value.length;
    charCount.textContent = `${length}/1000 characters`;

    if (length > 1000) {
      charCount.classList.add("text-red-500");
    } else {
      charCount.classList.remove("text-red-500");
    }
  });

  /**
   * Analyze Button Click
   */
  analyzeBtn.addEventListener("click", async () => {
    const text = inputText.value.trim();

    if (!text) {
      showError("Please enter the text you want to analyze.");
      return;
    }

    if (text.length > 1000) {
      showError("The text is too long (maximum 1000 characters).");
      return;
    }

    // Optional: Cache Check
    const cacheKey = "analysis_" + encodeURIComponent(text).slice(0, 64);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log("✅ Loaded from cache");
      showResults(JSON.parse(cached));
      return;
    }

    // Start Analysis
    hideAllSections();
    showLoading();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {
      const result = await analyzeWithGemini(text);
      showResults(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (err) {
      console.error("❌ Analysis error:", err);
      showError("Error: " + err.message);
    } finally {
      hideLoading();
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Analyze Now";
    }
  });

  /**
   * Gemini API Call
   */
  async function analyzeWithGemini(text) {
    const prompt = `
You are an expert AI for detecting scams, hoaxes, online gambling promotions. 
Analyze the text below and classify it into one of:
1. "Scam"
2. "Online Gambling"
3. "Hoax"
4. "Safe"

Return a strict JSON with this structure:
{
  "category": "...",
  "confidence": "...",
  "explanation": "...",
  "risk_indicators": [...]
}

Text to analyze:
${text}`;

    // 🔹 Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    // Validate Response
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      throw new Error("No valid response from Gemini API.");
    }

    const rawText = data.candidates[0].content.parts[0].text.trim();
    console.log("📤 Gemini raw response:", rawText);

    // Try parsing JSON
    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      console.error("⚠️ Failed parsing:", rawText);
      throw new Error("Failed to parse AI response. Check prompt formatting.");
    }
  }

  /**
   * Show Results to UI
   */
  function showResults(result) {
    hideError();
    results.classList.remove("hidden");

    // Category Badge
    const statusBadge = document.getElementById("statusBadge");
    const badgeColor = getBadgeColor(result.category);
    statusBadge.innerHTML = `<span class="inline-flex items-center px-3 py-1 rounded-full text-base font-medium ${badgeColor}">${
      result.category || "Unknown"
    }</span>`;

    // Explanation
    document.getElementById("explanation").textContent =
      result.explanation || "No explanation available";

    // Risk Indicators
    const indicatorsList = document.getElementById("indicators");
    const indicatorsSection = document.getElementById("indicatorsSection");
    indicatorsList.innerHTML = "";

    if (result.risk_indicators && result.risk_indicators.length > 0) {
      result.risk_indicators.forEach((indicator) => {
        const li = document.createElement("li");
        li.textContent = indicator;
        indicatorsList.appendChild(li);
      });
      indicatorsSection.classList.remove("hidden");
    } else {
      indicatorsSection.classList.add("hidden");
    }

    // Confidence Level
    document.getElementById("confidence").textContent = (
      result.confidence || "Unknown"
    ).toUpperCase();

    // (Optional) Sentiment / Language Detection - disable if not in JSON
    try {
      if (result.language) {
        showLanguageInfo(result.language);
      }
    } catch (e) {
      console.log("No language detected in result.");
    }
  }

  /**
   * Error / Loading / Utility UI Functions
   */
  function showError(message) {
    hideAllSections();
    document.getElementById("errorMessage").textContent = message;
    error.classList.remove("hidden");
  }

  function hideError() {
    error.classList.add("hidden");
  }

  function showLoading() {
    loading.classList.remove("hidden");
  }

  function hideLoading() {
    loading.classList.add("hidden");
  }

  function hideAllSections() {
    results.classList.add("hidden");
    error.classList.add("hidden");
    loading.classList.add("hidden");
  }

  function getBadgeColor(category) {
    if (!category) return "bg-gray-100 text-gray-800";
    switch (category.toLowerCase()) {
      case "scam":
        return "bg-red-100 text-red-800";
      case "online gambling":
        return "bg-orange-100 text-orange-800";
      case "hoax":
        return "bg-yellow-100 text-yellow-800";
      case "safe":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function showLanguageInfo(language) {
    const el = document.getElementById("languageInfo");
    if (!el) return;

    el.textContent = `Language Detected: ${language}`;
    el.classList.remove("hidden");
  }
});

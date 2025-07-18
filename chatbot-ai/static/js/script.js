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
    // Tampilkan kategori
    const categoryBadge = document.getElementById("categoryBadge");
    if (data.category) {
      let color = "bg-gray-200 text-gray-800";
      if (data.category === "Hoax") color = "bg-yellow-200 text-yellow-800";
      if (data.category === "Scam") color = "bg-red-200 text-red-800";
      if (data.category === "Online Gambling" || data.category === "Gambling")
        color = "bg-red-200 text-red-800";
      if (data.category === "Safe") color = "bg-green-200 text-green-800";
      categoryBadge.innerHTML = `<span class="inline-block px-3 py-1 rounded-full font-semibold ${color}">${data.category}</span>`;
      console.log("categoryBadge.innerHTML:", categoryBadge.innerHTML);
      categoryBadge.classList.remove("hidden");
    } else {
      categoryBadge.innerHTML = "";
      categoryBadge.classList.add("hidden");
    }

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
      console.error("Analysis failed:", err.message);
      // Provide a more user-friendly message
      let userMessage = "Failed to analyze the text. Please try again later.";
      if (err.message.includes("Failed to fetch")) {
        userMessage =
          "Could not connect to the analysis server. Please check your internet connection and try again.";
      }
      showError(userMessage);
    } finally {
      showLoading(false);
    }
  });

  /**
   * Gemini API Call via Netlify Proxy
   */
  // async function analyzeWithGemini(text) {
  //   const BACKEND_API_URL = location.hostname.includes("localhost")
  //     ? "http://localhost:8888/.netlify/functions/analyze"
  //     : "https://chatbot-ai-cekfakta.netlify.app/.netlify/functions/analyze";

  //   const response = await fetch(BACKEND_API_URL, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "Access-Control-Allow-Origin": "*",
  //       "Access-Control-Allow-Methods": "POST",
  //     },
  //     body: JSON.stringify({ text: text }), // Kirim teks mentah
  //   });

  //   if (!response.ok) {
  //     // Coba baca pesan error dari body JSON respons backend dengan aman.
  //     // Jika gagal (misalnya body bukan JSON), gunakan status HTTP sebagai gantinya.
  //     const errorData = await response.json().catch(() => null);
  //     const errorMessage =
  //       errorData?.error || `Request failed with status ${response.status}`;
  //     throw new Error(errorMessage);
  //   }

  //   const data = await response.json();
  //   // console.log("✅ Response from Netlify proxy:", data);
  //   console.log("Prompt:", prompt);
  //   console.log("event.httpMethod:", event.httpMethod);
  //   return data; // Data sudah dalam format JSON yang benar
  // }

  async function analyzeWithGemini(text) {
    const BACKEND_API_URL = location.hostname.includes("localhost")
      ? "http://localhost:8888/.netlify/functions/analyze"
      : "https://chatbot-ai-cekfakta.netlify.app/.netlify/functions/analyze";

    try {
      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      // Tangani error di sini agar error ditangkap oleh try-catch utama
      throw new Error(
        err.message || "Something went wrong. Please try again later."
      );
    }
  }
});

const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // simpan API key di env variable

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text)
    return res.status(400).json({ success: false, error: "No text provided" });

  try {
    // Kirim ke Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
        }),
      }
    );
    const geminiData = await geminiRes.json();

    // Parsing hasil Gemini sesuai kebutuhan UI-mu
    // Contoh parsing (ubah sesuai format Gemini response dan kebutuhan UI-mu)
    const result = {
      kategori: "aman", // parsing dari geminiData
      penjelasan: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "",
      indikator_bahaya: [], // parsing jika ada
      confidence: "tinggi", // parsing jika ada
      sentiment: "neutral", // parsing jika ada
      detected_language: "id", // parsing jika ada
    };

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

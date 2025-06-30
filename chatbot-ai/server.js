const express = require("express");
const bodyParser = require("body-parser");
const analyzeRoute = require("./api/analyze");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use("/api/analyze", analyzeRoute);

// Tambahkan ini agar file di ../dist bisa diakses
app.use("/dist", express.static(path.join(__dirname, "..", "dist")));
// Untuk file statis chatbot
app.use(express.static("static"));

// Untuk akses index.html di root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

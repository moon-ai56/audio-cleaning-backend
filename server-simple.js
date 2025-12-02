const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// HEALTH CHECK
app.get("/", (req, res) => {
    res.send("Audio cleaning backend is running 🚀");
});

// Upload + Clean Route
app.post("/clean-audio", upload.single("audio"), (req, res) => {
  let badwords = [];
  try {
    const raw = req.body.badwords || "[]"; // form-data field from Vibecode
    badwords = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse badwords JSON:", e);
    badwords = [];
  }

  const inputPath = req.file.path;
  const outputPath = `cleaned_${Date.now()}.wav`;

  // If no words selected, return original audio
  if (!badwords.length) {
    return res.download(inputPath, () => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
    });
  }

  // Build FFmpeg mute conditions
  const conditions = badwords
    .map((seg) => `between(t,${seg.start},${seg.end})`)
    .join("+");

  const filter = `volume='if(${conditions},0,1)'`;

  const cmd = `ffmpeg -y -i "${inputPath}" -af "${filter}" "${outputPath}"`;

  exec(cmd, (err) => {
    if (err) {
      console.error("FFmpeg error:", err);
      return res.status(500).json({ error: "Error cleaning audio" });
    }

    // Send cleaned audio
    return res.download(outputPath, () => {
      try { fs.unlinkSync(inputPath); } catch (e) {}
      try { fs.unlinkSync(outputPath); } catch (e) {}
    });
  });
});




    exec(cmd, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error cleaning audio" });
        }

        res.download(outputPath, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        });
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log("Server running on port " + PORT));

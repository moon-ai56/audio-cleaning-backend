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
app.post("/clean", upload.single("audio"), (req, res) => {
    const badWords = req.body.badWords ? JSON.parse(req.body.badWords) : [];
    const inputPath = req.file.path;
    const outputPath = `cleaned_${Date.now()}.wav`;

    let filters = "";
    badWords.forEach((word, i) => {
        filters += `-af "volume=enable='between(t,${2 * i},${2 * i + 1})':volume=0" `;
    });

    const cmd = `ffmpeg -i ${inputPath} ${filters} ${outputPath}`;

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

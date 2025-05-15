import express from "express";
import axios from "axios";
import ical from "ical.js";

const ICS_URL = process.env.ICS_URL;
if (!ICS_URL) {
  console.error("❌ La variable ICS_URL n’est pas définie.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/agenda-today", async (_req, res) => {
  try {
    // 1) Récupération du flux ICS
    const { data: rawIcs } = await axios.get(ICS_URL);

    // 2) Parsing
    const parsed = ical.parseICS(rawIcs);

    // 3) Définition de "aujourd'hui" en timestamp UNIX (secondes)
    const now = new Date();
    const startOfDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() /
        1000
    );
    const endOfDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() /
        1000
    );

    // 4) Filtrage des VEVENT du jour
    const events = Object.values(parsed)
      .filter((ev) => ev.type === "VEVENT")
      .map((ev) => {
        const start = Math.floor(new Date(ev.start).getTime() / 1000);
        const end = Math.floor(new Date(ev.end).getTime() / 1000);
        return { start, end, title: ev.summary || "" };
      })
      .filter((e) => e.start >= startOfDay && e.start < endOfDay)
      .sort((a, b) => a.start - b.start);

    // 5) Envoi du JSON
    res.json(events);
  } catch (err) {
    console.error("❌ Erreur ICS :", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Agenda service démarré sur http://localhost:${PORT}`)
);

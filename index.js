const express = require("express");
const axios = require("axios");
const ical = require("node-ical");

const ICS_URL = process.env.ICS_URL;
if (!ICS_URL) {
  console.error("❌ La variable ICS_URL n’est pas définie.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/agenda-today", async (req, res) => {
  try {
    // 1) Récupération du flux ICS
    const response = await axios.get(ICS_URL);
    const rawIcs = response.data;

    // 2) Parsing
    const data = ical.parseICS(rawIcs);

    // 3) Bornes unix (en secondes) pour "aujourd’hui"
    const now = new Date();
    const startOfDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() /
        1000
    );
    const endOfDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() /
        1000
    );

    // 4) Filtrage + formatage
    const events = [];
    for (const key in data) {
      const ev = data[key];
      if (ev.type === "VEVENT") {
        const dtStart = Math.floor(new Date(ev.start).getTime() / 1000);
        const dtEnd = Math.floor(new Date(ev.end).getTime() / 1000);
        if (dtStart >= startOfDay && dtStart < endOfDay) {
          events.push({ start: dtStart, end: dtEnd, title: ev.summary });
        }
      }
    }

    // 5) Tri chronologique et envoi
    events.sort((a, b) => a.start - b.start);
    res.json(events);
  } catch (err) {
    console.error("Erreur lors de la récupération ou du parsing ICS :", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Agenda service démarré sur le port ${PORT}`);
});

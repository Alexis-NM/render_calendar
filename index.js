import express from "express";
import axios from "axios";
import ICAL from "ical.js";

const ICS_URL = process.env.ICS_URL;
if (!ICS_URL) {
  console.error("❌ La variable ICS_URL n’est pas définie.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/agenda-today", async (_req, res) => {
  try {
    // 1) Récupère le .ics
    const { data: rawIcs } = await axios.get(ICS_URL);
    // 2) Parse avec ical.js
    const jcal = ICAL.parse(rawIcs);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents("vevent");
    // 3) Bornes UNIX pour "aujourd'hui"
    const now = new Date();
    const startOfDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() /
        1000
    );
    const endOfDay = Math.floor(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() /
        1000
    );
    // 4) Transforme + filtre
    const events = vevents
      .map((ve) => {
        const e = new ICAL.Event(ve);
        return {
          start: Math.floor(e.startDate.toJSDate().getTime() / 1000),
          end: Math.floor(e.endDate.toJSDate().getTime() / 1000),
          title: e.summary,
        };
      })
      .filter((e) => e.start >= startOfDay && e.start < endOfDay)
      .sort((a, b) => a.start - b.start);
    // 5) Envoi
    res.json(events);
  } catch (err) {
    console.error("❌ Erreur ICS :", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Agenda service démarré sur http://localhost:${PORT}`)
);

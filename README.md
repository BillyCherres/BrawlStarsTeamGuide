# ⭐ Brawl Stars Team Builder
https://brawl-stars-team-guide.vercel.app/

A **React + TypeScript** web application that helps players build optimal **3-brawler teams** in *Brawl Stars* by analyzing **synergy, balance, and map suitability**.

Users can select brawlers and maps, then receive structured feedback on team strengths, weaknesses, and strategic gaps.

---
<img width="1033" height="632" alt="Screenshot 2026-01-03 at 1 42 14 PM" src="https://github.com/user-attachments/assets/a80e799c-9e0f-4b7a-a2fb-fd367b469393" />

## 🚀 Features

- 🔎 **Brawler Selection**
  - Browse and select Brawl Stars characters
  - Uses live API data
<img width="1201" height="707" alt="Screenshot 2026-01-03 at 1 42 58 PM" src="https://github.com/user-attachments/assets/2f07abd4-2f4b-45d7-83fe-6dc8438f7aba" />

- 🗺️ **Map Selection**
  - Choose maps with mode-aware tagging
  - Filter out disabled / unavailable maps
<img width="1230" height="763" alt="Screenshot 2026-01-03 at 1 43 18 PM" src="https://github.com/user-attachments/assets/303e8da3-435b-496b-bf0d-925ff3fee1f0" />

- ⚖️ **Team Synergy Scoring**
  - Damage balance
  - Range diversity
  - Crowd control & utility
  - Anti-tank / anti-assassin coverage
  - Healing & sustain presence
<img width="1048" height="765" alt="Screenshot 2026-01-03 at 1 44 48 PM" src="https://github.com/user-attachments/assets/45b41b98-82fc-4281-aafa-a73b13ec9b20" />

- 🧠 **Actionable Feedback**
  - “Strong in Brawl Ball”
  - “Struggles vs Tanks”
  - “Lacks long-range pressure”

- ⚡ **Modern Frontend Stack**
  - React + TypeScript
  - Vite for fast builds
  - Deployed on Vercel

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript  
- **Build Tool:** Vite  
- **Styling:** CSS  
- **APIs:** Brawl Stars / Brawlify (public data)  
- **Deployment:** Vercel  
- **Version Control:** Git & GitHub  

---

## 📦 Project Structure

```text
brawl-team-builder/
├── public/
│   └── logo.png
├── src/
│   ├── api/          # API fetch logic
│   ├── components/   # Reusable UI components
│   ├── pages/        # Page-level components
│   ├── data/         # Tagged brawlers & maps
│   ├── utils/        # Synergy & scoring logic
│   └── main.tsx
├── index.html
└── vite.config.ts

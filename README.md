# Single Transferable Vote (STV) Election Simulator

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

An interactive web application that demonstrates the Single Transferable Vote (STV) system used in Irish elections, including Dail Eireann (Irish Parliament), Seanad Eireann (Irish Senate), and local elections.

![STV Demo Screenshot](https://github.com/user-attachments/assets/9c02fc86-1f63-461c-a836-7d153ad475ce)

## Overview

This project is a fully interactive election simulator that implements the Irish STV proportional representation voting system. It allows users to configure election parameters, generate random candidates with authentic Irish names, and step through each round of vote counting, surplus transfer, and candidate elimination. The simulator includes real-time charts, Sankey diagrams for vote flow visualisation, and detailed round-by-round explanations.

## Features

- Authentic Irish STV implementation using the Droop quota formula
- Fractional surplus transfer values for elected candidates
- Correct elimination and vote redistribution process
- Step-by-step round and action navigation controls
- Real-time bar charts showing vote distribution with quota line (ApexCharts with HTML5 Canvas fallback)
- Sankey diagrams for vote transfer visualisation (Plotly.js with HTML fallback)
- Configurable voters (10-1000), candidates (3-10), and seats (1-5)
- Live quota calculation display
- Animated vote particle transfers (Anime.js)
- Candidate tooltips with vote status (Tippy.js)
- Progress bars for round and action tracking
- Dark theme UI with responsive design

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An internet connection (for loading CDN libraries)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/danielcregg/single-transferable-vote-demo.git
   ```
2. Navigate into the project directory:
   ```bash
   cd single-transferable-vote-demo
   ```

### Usage

Serve the files using any HTTP server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000` in your browser.

1. Click **Generate** to create random Irish candidates.
2. Adjust the number of voters, candidates, and seats as desired.
3. Click **Simulate** to run the full STV election.
4. Use the **Round** and **Action** navigation buttons to step through each count.

## STV Process Explained

1. **First Count** -- All first preference votes are counted for each candidate.
2. **Quota Calculation** -- The Droop quota is calculated: `floor(Total Valid Votes / (Seats + 1)) + 1`.
3. **Election Check** -- Any candidate reaching or exceeding the quota is immediately elected.
4. **Surplus Transfer** -- Surplus votes of elected candidates are transferred to next preferences at reduced value.
5. **Elimination** -- If no candidate reaches quota, the lowest candidate is eliminated and their votes are transferred at full value.
6. **Repeat** -- The process continues until all seats are filled.

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Dark theme styling and responsive layout |
| JavaScript | Core STV logic, DOM manipulation, and UI management |
| ApexCharts | Interactive bar chart visualisation |
| Plotly.js | Sankey diagram for vote transfers |
| Anime.js | Smooth vote transfer animations |
| Tippy.js | Candidate card tooltips |

## Irish Electoral Context

STV is used across Ireland for Dail Eireann elections (160 TDs across 39 constituencies), Seanad Eireann university panels, local council elections, and European Parliament elections. The system provides proportional representation while allowing voters to rank candidates within and across parties.

## References

- [Irish Electoral Law](https://www.irishstatutebook.ie/eli/1992/act/23/enacted/en/html)
- [Citizens Information - How Elections Work](https://www.citizensinformation.ie/en/government-in-ireland/elections-and-referenda/voting/how-elections-work/)
- [STV in Ireland - Electoral Commission](https://www.electoralcommission.ie/how-to-vote/how-stv-works/)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

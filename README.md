# Single Transferable Vote (STV) Election Simulator

An interactive web application that demonstrates the Single Transferable Vote (STV) system used in Irish elections, including Dáil Éireann (Irish Parliament), Seanad Éireann (Irish Senate), and local elections.

![STV Demo Screenshot](https://github.com/user-attachments/assets/9c02fc86-1f63-461c-a836-7d153ad475ce)

## Features

### 🗳️ **Authentic Irish STV Implementation**
- **Droop Quota**: Uses the correct formula: `floor(valid_votes / (seats + 1)) + 1`
- **Surplus Transfer**: Implements fractional transfer values for surplus votes
- **Elimination Process**: Correctly eliminates lowest candidates when no one meets quota
- **Vote Redistribution**: Properly transfers votes to next preferences

### 🎮 **Interactive Simulation**
- **Real-time Visualization**: Watch votes being counted and transferred
- **Step-by-step Navigation**: Navigate through rounds and individual actions
- **Live Charts**: Visual bar charts showing vote distribution with quota line
- **Transfer Tracking**: Detailed view of how votes flow between candidates

### 🇮🇪 **Irish Context**
- **Authentic Names**: Uses common Irish first and last names
- **Realistic Parameters**: Configurable voters (10-1000), candidates (3-10), seats (1-5)
- **Electoral Compliance**: Follows Irish electoral law and procedures

## How to Use

1. **Generate Candidates**: Click "Generate" to create random Irish candidates
2. **Configure Election**: Adjust number of voters, candidates, and seats
3. **Run Simulation**: Click "Simulate" to run the full STV election
4. **Navigate Results**: Use the navigation controls to explore each round

### Navigation Controls

- **Round Navigation**: `◀ ▶` buttons to move between election rounds
- **Action Navigation**: `◀ ▶` buttons to see individual actions within rounds
- **Progress Bars**: Visual indication of simulation progress

## STV Process Explained

### 1. **First Count**
All first preference votes are counted for each candidate.

### 2. **Quota Calculation**
The quota needed for election is calculated using the Droop formula:
```
Quota = floor(Total Valid Votes / (Seats + 1)) + 1
```

### 3. **Election Check**
Any candidate reaching or exceeding the quota is immediately elected.

### 4. **Surplus Transfer**
If an elected candidate has votes above the quota:
- **Surplus** = Total Votes - Quota
- **Transfer Value** = Surplus / Total Votes
- All votes for that candidate are transferred to next preferences with reduced value

### 5. **Elimination**
If no candidate reaches quota:
- The candidate with the lowest vote count is eliminated
- Their votes are transferred to next preferences at full value

### 6. **Repeat**
The process continues until all seats are filled or no more candidates remain.

## Technical Implementation

### Dependencies
- **ApexCharts**: Interactive charting (with HTML5 Canvas fallback)
- **Plotly.js**: Sankey diagrams for vote transfers (with HTML fallback)
- **Anime.js**: Smooth animations
- **Tippy.js**: Tooltips and help text

### Fallback Support
The application includes robust fallback mechanisms:
- HTML5 Canvas charts when external libraries are blocked
- Simple transfer visualization when Sankey diagrams fail
- Graceful degradation for all features

### File Structure
```
├── index.html          # Main application interface
├── app.js             # Core STV logic and UI management
├── styles.css         # Responsive styling and themes
├── manifest.json      # Progressive Web App configuration
└── README.md          # This documentation
```

## Irish Electoral Context

### Where STV is Used in Ireland

1. **Dáil Éireann Elections** (Lower House of Parliament)
   - 39 multi-seat constituencies (3-5 seats each)
   - 160 TDs (Teachta Dála) total

2. **Seanad Éireann Elections** (Upper House)
   - University constituencies use STV
   - 6 senators elected by NUI and Trinity College graduates

3. **Local Elections**
   - County councils, city councils, municipal districts
   - Multi-seat local electoral areas

4. **European Parliament Elections**
   - 3 large constituencies covering all of Ireland
   - 13 MEPs total

### Key Advantages of STV

- **Proportional Representation**: Parties get seats roughly proportional to votes
- **Voter Choice**: Voters can rank candidates within and across parties
- **Geographic Representation**: Local candidates represent specific areas
- **Elimination of Wasted Votes**: Lower preferences can still count

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Responsive**: Works on tablets and smartphones
- **Progressive Enhancement**: Core functionality works without JavaScript

## Development

To run locally:

1. Clone the repository
2. Serve the files using any HTTP server:
   ```bash
   python3 -m http.server 8000
   # or
   npx serve .
   ```
3. Open `http://localhost:8000` in your browser

## Contributing

Contributions are welcome! Please ensure any changes:
- Maintain compliance with Irish STV rules
- Include appropriate tests
- Follow existing code style
- Update documentation as needed

## License

This project is open source and available under the MIT License.

## References

- [Irish Electoral Law](https://www.irishstatutebook.ie/eli/1992/act/23/enacted/en/html)
- [Citizens Information - How Elections Work](https://www.citizensinformation.ie/en/government-in-ireland/elections-and-referenda/voting/how-elections-work/)
- [STV in Ireland - Electoral Commission](https://www.electoralcommission.ie/how-to-vote/how-stv-works/)
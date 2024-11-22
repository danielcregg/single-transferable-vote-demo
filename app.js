const generateBtn = document.getElementById('generateBtn');
const simulateBtn = document.getElementById('simulateBtn');
const candidateList = document.getElementById('candidateList');
const ctx = document.getElementById('voteChart').getContext('2d');
let chart = null; // Add this line

let candidates = [];
let voters = [];
let currentRound = 0;
let quota = 0;
let roundInfo = document.getElementById('roundInfo');
let elected = [];
let eliminated = [];

// Add new variables
let roundStates = [];
let currentRoundIndex = -1;

// Add references to new UI elements
const nextRoundBtn = document.getElementById('nextRoundBtn');
const prevRoundBtn = document.getElementById('prevRoundBtn');

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

function generateRandomName() {
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Voter class to store preferences
class Voter {
    constructor(id, preferences) {
        this.id = id;
        this.preferences = preferences; // Array of candidate IDs in order of preference
        this.currentPreference = 0;
        this.transferValue = 1.0; // Add this line - initially each vote is worth 1
    }

    getCurrentVote() {
        return this.preferences[this.currentPreference];
    }

    moveToNextPreference() {
        this.currentPreference++;
        return this.getCurrentVote();
    }
}

function calculateQuota(numVoters, numSeats) {
    return Math.floor(numVoters / (numSeats + 1)) + 1;
}

function generateRandomPreferences(numCandidates) {
    let preferences = Array.from({length: numCandidates}, (_, i) => i);
    return shuffle(preferences);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

generateBtn.addEventListener('click', () => {
    // Reset all state variables
    candidates = [];
    voters = [];
    currentRound = 0;
    quota = 0;
    elected = [];
    eliminated = [];
    
    const numCandidates = parseInt(document.getElementById('numCandidates').value);
    candidateList.innerHTML = '';

    for (let i = 0; i < numCandidates; i++) {
        const candidate = {
            id: i,
            name: generateRandomName(),
            image: `https://i.pravatar.cc/150?img=${i + 1}`,
            votes: 0
        };
        candidates.push(candidate);

        const candidateCard = document.createElement('div');
        candidateCard.className = 'candidate-card';
        candidateCard.innerHTML = `
            <img src="${candidate.image}" alt="${candidate.name}">
            <h3>${candidate.name}</h3>
        `;
        candidateList.appendChild(candidateCard);
    }

    simulateBtn.disabled = false;
    if (chart) {
        chart.destroy();
    }
    initializeChart();
});

async function runElection() {
    const numVoters = parseInt(document.getElementById('numVoters').value);
    const seatsAvailable = parseInt(document.getElementById('seatsAvailable').value);
    let seatsRemaining = seatsAvailable;
    
    quota = calculateQuota(numVoters, seatsAvailable);
    roundInfo.innerHTML = `<p>Quota to get elected: ${quota} votes</p>`;

    // Generate voters with random preferences
    voters = Array.from({length: numVoters}, (_, i) =>
        new Voter(i, generateRandomPreferences(candidates.length))
    );

    const maxRounds = candidates.length;
    roundStates = []; // Reset round states
    currentRoundIndex = -1;

    let electedThisRound = []; // Add this line
    let lowestCandidate = null; // Add this line

    voteFlows = []; // Reset vote flows

    while (
        seatsRemaining > 0 &&
        candidates.filter(c => !eliminated.includes(c.id) && !elected.includes(c.id)).length > 0
    ) {
        currentRound++;
        updateProgressBar(currentRound, maxRounds); // Update progress bar
        await countVotes();

        // Find candidates meeting quota
        electedThisRound = candidates.filter(
            c => c.votes >= quota && !elected.includes(c.id) && !eliminated.includes(c.id)
        );

        // Generate explanation for this round
        const explanation = generateExplanation(electedThisRound, lowestCandidate);

        // Save state of the current round
        saveRoundState(explanation);

        if (electedThisRound.length > 0) {
            for (let candidate of electedThisRound) {
                elected.push(candidate.id);
                seatsRemaining--;
                const transferDetails = await transferSurplus(candidate);
                const explanation = generateExplanation(electedThisRound, null, transferDetails);
                saveRoundState(explanation);
            }
        } else {
            // Eliminate candidate with fewest votes
            lowestCandidate = candidates
                .filter(c => !eliminated.includes(c.id) && !elected.includes(c.id))
                .reduce((min, c) => (c.votes < min.votes ? c : min));

            eliminated.push(lowestCandidate.id);
            await transferVotes(lowestCandidate);
        }

        // Clear votes for next round
        voters.forEach(voter => {
            if (eliminated.includes(voter.getCurrentVote())) {
                voter.moveToNextPreference();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // After the election ends, set currentRoundIndex for navigation
    currentRoundIndex = 0;
    updateDisplayForRound(currentRoundIndex);

    // Display final results
    displayFinalResults();
}

// Add function to save state after each round
function saveRoundState(explanation) {
    const state = {
        round: currentRound,
        candidates: JSON.parse(JSON.stringify(candidates)),
        elected: [...elected],
        eliminated: [...eliminated],
        quota: quota,
        explanation: explanation
    };
    roundStates.push(state);
}

// Update generateExplanation to accept parameters
function generateExplanation(electedThisRound = [], lowestCandidate = null, transferDetails = '') {
    let explanation = `<strong>Round ${currentRound} Analysis:</strong><br>`;
    explanation += `Quota is calculated as floor(${voters.length} / (${seatsAvailable} + 1)) + 1 = ${quota}.<br><br>`;
    explanation += `<strong>Candidates' Votes:</strong><br>`;
    candidates.forEach(c => {
        explanation += `${c.name}: ${c.votes.toFixed(2)} votes<br>`;
        explanation += `First Preference Votes: ${countFirstPreferences(c.id)}<br>`;
    });

    explanation += `<br><strong>Actions Taken:</strong><br>`;
    if (electedThisRound.length > 0) {
        explanation += `Elected: ${electedThisRound.map(c => c.name).join(', ')}<br>`;
        explanation += transferDetails; // Add transfer details
    } else if (lowestCandidate) {
        explanation += `Eliminated: ${lowestCandidate.name}<br>`;
        explanation += `Votes were transferred to next preferences.<br>`;
    }
    return explanation;
}

// Helper function to count first preference votes
function countFirstPreferences(candidateId) {
    return voters.filter(voter => voter.preferences[0] === candidateId).length;
}

// Add function to update progress bar
function updateProgressBar(current, total) {
    const progress = (current / total) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.innerText = `Round ${current}`;
}

// Add function to display final results
function displayFinalResults() {
    let resultHtml = '<h3>Final Results</h3>';
    resultHtml += '<ul>';
    for (let candidate of candidates) {
        if (elected.includes(candidate.id)) {
            resultHtml += `<li><strong>${candidate.name}</strong> - Elected</li>`;
        } else {
            resultHtml += `<li>${candidate.name} - Not Elected</li>`;
        }
    }
    resultHtml += '</ul>';
    electionStatus.innerHTML = resultHtml;
}

async function countVotes() {
    candidates.forEach(c => c.votes = 0);
    
    voters.forEach(voter => {
        let candidateId = voter.getCurrentVote();
        if (candidateId !== undefined) {
            candidates[candidateId].votes += voter.transferValue; // Use transfer value
        }
    });

    await updateChart();
}

async function transferSurplus(candidate) {
    const surplus = candidate.votes - quota;
    const transferValue = surplus / candidate.votes;
    const votersByNextPref = new Map();

    // Group voters by their next preference
    const candidateVoters = voters.filter(v => v.getCurrentVote() === candidate.id);
    candidateVoters.forEach(voter => {
        const nextPref = voter.preferences[voter.currentPreference + 1];
        if (nextPref !== undefined) {
            if (!votersByNextPref.has(nextPref)) {
                votersByNextPref.set(nextPref, []);
            }
            votersByNextPref.get(nextPref).push(voter);
        }
    });

    // Transfer votes and record flows
    votersByNextPref.forEach((voters, nextPrefId) => {
        const transferredVotes = voters.length * transferValue;
        voteFlows.push(new VoteTransfer(
            candidates[candidate.id].name,
            candidates[nextPrefId].name,
            transferredVotes,
            currentRound
        ));
    });

    // Existing transfer logic
    candidateVoters.forEach(voter => {
        const oldValue = voter.transferValue;
        voter.transferValue = oldValue * transferValue; // Reduce the vote's value
        voter.moveToNextPreference();
    });

    // Add explanation to the round state
    const transferDetails = `
        <br>Transfer Details:<br>
        - Original Votes: ${candidate.votes}<br>
        - Quota: ${quota}<br>
        - Surplus: ${surplus.toFixed(2)}<br>
        - Transfer Value: ${transferValue.toFixed(3)}<br>
        - Number of Votes Transferred: ${candidateVoters.length}
    `;

    return transferDetails;
}

async function transferVotes(candidate) {
    voters.forEach(voter => {
        if (voter.getCurrentVote() === candidate.id) {
            voter.moveToNextPreference();
        }
    });
}

// Modify updateDisplay to not update UI directly during simulation
async function updateDisplay(roundText) {
    // Do not update UI here during simulation
}

// Add function to update display based on stored round state
function updateDisplayForRound(index) {
    const state = roundStates[index];
    // Update round info
    roundInfo.innerHTML = `
        <p>Quota to get elected: ${state.quota} votes</p>
        <p><strong>Round ${state.round}</strong></p>
        ${state.candidates.map(c => {
            const status = state.elected.includes(c.id)
                ? '(Elected)'
                : state.eliminated.includes(c.id)
                ? '(Eliminated)'
                : '';
            return `<p>${c.name}: ${c.votes} votes ${status}</p>`;
        }).join('')}
        <p>${state.explanation}</p>
    `;
    // Update chart data
    candidates = state.candidates;
    elected = state.elected;
    eliminated = state.eliminated;
    quota = state.quota;
    updateChart();
    updateCandidateCards();
    // Update navigation buttons
    prevRoundBtn.disabled = index <= 0;
    nextRoundBtn.disabled = index >= roundStates.length - 1;

    createSankeyDiagram(index);
}

// Add event listeners for navigation buttons
nextRoundBtn.addEventListener('click', () => {
    if (currentRoundIndex < roundStates.length - 1) {
        currentRoundIndex++;
        updateDisplayForRound(currentRoundIndex);
    }
});

prevRoundBtn.addEventListener('click', () => {
    if (currentRoundIndex > 0) {
        currentRoundIndex--;
        updateDisplayForRound(currentRoundIndex);
    }
});

// Ensure only one event listener for simulateBtn
simulateBtn.addEventListener('click', async () => {
    // Reset simulation state
    currentRound = 0;
    elected = [];
    eliminated = [];
    roundInfo.innerHTML = ''; // Clear previous round information
    electionStatus.innerHTML = '';
    roundStates = [];
    currentRoundIndex = -1;

    // Disable buttons during simulation
    simulateBtn.disabled = true;
    nextRoundBtn.disabled = true;
    prevRoundBtn.disabled = true;

    await runElection();

    // Enable navigation buttons after simulation
    nextRoundBtn.disabled = false;
    prevRoundBtn.disabled = false;
    simulateBtn.disabled = false;
});

async function updateChart() {
    if (!chart) return;

    const electedIds = new Set(elected);
    const eliminatedIds = new Set(eliminated);

    chart.data.datasets[0].backgroundColor = candidates.map(c => {
        if (electedIds.has(c.id)) return 'rgba(76, 175, 80, 0.6)'; // Green
        if (eliminatedIds.has(c.id)) return 'rgba(244, 67, 54, 0.6)'; // Red
        return 'rgba(33, 150, 243, 0.6)'; // Blue
    });

    chart.data.datasets[0].data = candidates.map(c => c.votes);

    // Update quota line position
    chart.options.plugins.annotation.annotations.quotaLine.yMin = quota;
    chart.options.plugins.annotation.annotations.quotaLine.yMax = quota;

    chart.update();
}

function initializeChart() {
    if (chart) {
        chart.destroy();
    }

    // Fix Chart.js plugin registration
    Chart.register(window.ChartAnnotation);

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: candidates.map(c => c.name),
            datasets: [{
                label: 'Votes',
                data: candidates.map(c => c.votes),
                backgroundColor: candidates.map(() => 'rgba(33, 150, 243, 0.6)'),
                borderColor: candidates.map(() => 'rgba(33, 150, 243, 1)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                annotation: {
                    annotations: {
                        quotaLine: {
                            type: 'line',
                            yMin: quota,
                            yMax: quota,
                            borderColor: 'rgb(255, 0, 0)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'Quota',
                                enabled: true,
                                position: 'center'
                            }
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                duration: 500
            }
        }
    });
}

// Update candidate cards based on their status
function updateCandidateCards() {
    const candidateCards = document.querySelectorAll('.candidate-card');
    candidateCards.forEach((card, index) => {
        const candidate = candidates[index];
        if (elected.includes(candidate.id)) {
            card.classList.add('elected');
            card.classList.remove('eliminated');
        } else if (eliminated.includes(candidate.id)) {
            card.classList.add('eliminated');
            card.classList.remove('elected');
        } else {
            card.classList.remove('elected', 'eliminated');
        }
    });
}

// Add after existing global variables
let voteFlows = [];
let sankeyDiagram = null;

// Add new class to track vote transfers
class VoteTransfer {
    constructor(fromCandidate, toCandidate, votes, round) {
        this.from = fromCandidate;
        this.to = toCandidate;
        this.value = votes;
        this.round = round;
    }
}

// Add function to create Sankey diagram
function createSankeyDiagram(round) {
    const width = document.getElementById('sankeyDiagram').clientWidth;
    const height = 400;
    const padding = 20;

    // Clear previous diagram
    d3.select("#sankeyDiagram").selectAll("*").remove();

    // Process data for Sankey
    const nodes = [];
    const links = [];
    
    // Add nodes for each candidate in each round up to current
    for (let r = 0; r <= round; r++) {
        candidates.forEach(candidate => {
            nodes.push({
                id: `${candidate.name}-${r}`,
                name: candidate.name,
                round: r
            });
        });
    }

    // Add links based on vote transfers
    voteFlows
        .filter(flow => flow.round <= round)
        .forEach(flow => {
            links.push({
                source: `${flow.from}-${flow.round}`,
                target: `${flow.to}-${flow.round + 1}`,
                value: flow.value
            });
        });

    // Create Sankey generator
    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[padding, padding], [width - padding, height - padding]]);

    // Generate layout
    const {nodes: sankeyNodes, links: sankeyLinks} = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    // Create SVG
    const svg = d3.select("#sankeyDiagram")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Add links
    svg.append("g")
        .selectAll("path")
        .data(sankeyLinks)
        .join("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => {
            const targetNode = nodes.find(n => n.id === d.target.id);
            if (elected.includes(candidates.find(c => c.name === targetNode.name).id)) {
                return "rgba(76, 175, 80, 0.6)";
            }
            if (eliminated.includes(candidates.find(c => c.name === targetNode.name).id)) {
                return "rgba(244, 67, 54, 0.6)";
            }
            return "rgba(33, 150, 243, 0.6)";
        })
        .attr("stroke-width", d => Math.max(1, d.width));

    // Add nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(sankeyNodes)
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => {
            const candidate = candidates.find(c => c.name === d.name);
            if (elected.includes(candidate.id)) return "rgba(76, 175, 80, 0.8)";
            if (eliminated.includes(candidate.id)) return "rgba(244, 67, 54, 0.8)";
            return "rgba(33, 150, 243, 0.8)";
        });

    node.append("text")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => `${d.name}\n(${Math.round(d.value)})`);
}
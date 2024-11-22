// DOM references
const generateBtn = document.getElementById('generateBtn');
const simulateBtn = document.getElementById('simulateBtn');
const candidateList = document.getElementById('candidateList');
const roundInfo = document.getElementById('roundInfo');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const prevRoundBtn = document.getElementById('prevRoundBtn');
const progressBar = document.getElementById('progressBar');
const electionStatus = document.getElementById('electionStatus');

// State variables
let chart = null;
let candidates = [];
let voters = [];
let currentRound = 0;
let quota = 0;
let elected = [];
let eliminated = [];
let roundStates = [];
let currentRoundIndex = -1;
let voteFlows = [];
let sankeyDiagram = null;

// Constants
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

// Classes
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

class VoteTransfer {
    constructor(fromCandidate, toCandidate, votes, round) {
        this.from = fromCandidate;
        this.to = toCandidate;
        this.value = votes;
        this.round = round;
    }
}

function generateRandomName() {
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
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
        candidateCard.dataset.candidate = candidate.name; // Add data attribute for tooltips
        candidateCard.innerHTML = `
            <img src="${candidate.image}" alt="${candidate.name}">
            <h3>${candidate.name}</h3>
            <div class="vote-count">0 votes</div>
        `;
        candidateList.appendChild(candidateCard);
    }

    simulateBtn.disabled = false;
    if (chart) {
        chart.destroy();
    }
    initializeChart();
    initializeTooltips(); // Initialize tooltips after creating cards
});

async function runElection() {
    const numVoters = parseInt(document.getElementById('numVoters').value);
    const seatsAvailable = parseInt(document.getElementById('seatsAvailable').value);
    let seatsRemaining = seatsAvailable;
    
    quota = calculateQuota(numVoters, seatsAvailable);
    // Remove this line:
    // roundInfo.innerHTML = `<p>Quota to get elected: ${quota} votes</p>`;

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

    // Initialize progress bar
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.innerHTML = '<span>Round 0</span>';
    }

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
    let explanation = `<strong>Round ${currentRound}</strong><br>`;
    explanation += `<br><strong>Actions:</strong><br>`;
    if (electedThisRound.length > 0) {
        explanation += `Elected: ${electedThisRound.map(c => c.name).join(', ')}<br>`;
        explanation += transferDetails; // Add transfer details
    } else if (lowestCandidate) {
        explanation += `Eliminated: ${lowestCandidate.name}<br>`;
        explanation += `Votes transferred to next preferences.<br>`;
    }
    return explanation;
}

// Helper function to count first preference votes
function countFirstPreferences(candidateId) {
    return voters.filter(voter => voter.preferences[0] === candidateId).length;
}

// Add function to update progress bar
function updateProgressBar(current, total) {
    if (!progressBar) return; // Guard clause in case element isn't found
    
    const progress = (current / total) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.innerHTML = `<span>Round ${current}</span>`;
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

    // Update candidate card vote counts
    candidates.forEach(candidate => {
        const card = document.querySelector(`[data-candidate="${candidate.name}"] .vote-count`);
        if (card) {
            card.textContent = `${candidate.votes.toFixed(2)} votes`;
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
    // Update round info without quota
    roundInfo.innerHTML = `
        <p><strong>Round ${state.round}</strong></p>
        ${state.candidates.map(c => {
            const status = state.elected.includes(c.id)
                ? '<span class="status elected">Elected</span>'
                : state.eliminated.includes(c.id)
                ? '<span class="status eliminated">Eliminated</span>'
                : '';
            return `<p>${c.name}: ${c.votes.toFixed(2)} votes ${status}</p>`;
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

// Replace chart initialization with ApexCharts
function initializeChart() {
    try {
        const options = {
            series: [{
                name: 'Votes',
                data: candidates.map(c => c.votes)
            }],
            chart: {
                type: 'bar',
                height: 350,
                animations: {
                    enabled: true,
                    dynamicAnimation: {
                        speed: 350
                    }
                },
                background: 'transparent',
                foreColor: '#fff'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 8,
                    distributed: true
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return val.toFixed(2)
                },
                style: {
                    colors: ['#fff']
                }
            },
            colors: candidates.map(c => {
                if (elected.includes(c.id)) return '#2ecc71';
                if (eliminated.includes(c.id)) return '#e74c3c';
                return '#3498db';
            }),
            xaxis: {
                categories: candidates.map(c => c.name),
                labels: {
                    style: {
                        colors: Array(candidates.length).fill('#fff')
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Votes',
                    style: {
                        color: '#fff'
                    }
                },
                min: 0,
                max: Math.max(quota * 1.2, ...candidates.map(c => c.votes))
            },
            annotations: {
                yaxis: [{
                    y: quota,
                    borderColor: '#e74c3c',
                    label: {
                        text: 'Quota',
                        style: {
                            color: '#fff',
                            background: '#e74c3c'
                        }
                    }
                }]
            },
            grid: {
                borderColor: '#404040'
            },
            theme: {
                mode: 'dark'
            }
        };

        if (chart) {
            chart.destroy();
        }
        
        chart = new ApexCharts(document.querySelector("#voteChart"), options);
        chart.render();
    } catch (error) {
        console.error('Chart initialization failed:', error);
    }
}

async function updateChart() {
    if (!chart) return;

    try {
        // Update the chart data and styling
        chart.updateOptions({
            series: [{
                data: candidates.map(c => c.votes)
            }],
            colors: candidates.map(c => {
                if (elected.includes(c.id)) return '#2ecc71';
                if (eliminated.includes(c.id)) return '#e74c3c';
                return '#3498db';
            }),
            yaxis: {
                min: 0,
                max: Math.max(quota * 1.2, ...candidates.map(c => c.votes))
            },
            annotations: {
                yaxis: [{
                    y: quota,
                    borderColor: '#e74c3c',
                    label: {
                        text: 'Quota',
                        style: {
                            color: '#fff',
                            background: '#e74c3c'
                        }
                    }
                }]
            }
        });
    } catch (error) {
        console.error('Chart update failed:', error);
    }
}

// Replace vote transfer visualization with anime.js
function visualizeVoteTransfer(from, to, amount) {
    const fromElement = document.querySelector(`[data-candidate="${from}"]`);
    const toElement = document.querySelector(`[data-candidate="${to}"]`);
    
    const particle = document.createElement('div');
    particle.className = 'vote-particle';
    document.body.appendChild(particle);

    anime({
        targets: particle,
        translateX: [fromElement.offsetLeft, toElement.offsetLeft],
        translateY: [fromElement.offsetTop, toElement.offsetTop],
        duration: 1000,
        easing: 'easeInOutCubic',
        complete: () => particle.remove()
    });
}

// Add tooltips to candidate cards
function initializeTooltips() {
    tippy('.candidate-card', {
        content(reference) {
            const candidate = candidates.find(c => c.name === reference.getAttribute('data-candidate'));
            return `
                Votes: ${candidate.votes}
                Status: ${elected.includes(candidate.id) ? 'Elected' : 
                         eliminated.includes(candidate.id) ? 'Eliminated' : 'In Running'}
            `;
        },
        theme: 'custom',
        placement: 'top'
    });
}

// Replace createSankeyDiagram with Plotly Sankey implementation
function createSankeyDiagram(round) {
    // Prepare data for Plotly Sankey
    const flowData = voteFlows.filter(flow => flow.round <= round);
    const nodeNames = [];

    // Collect unique node names
    flowData.forEach(flow => {
        if (!nodeNames.includes(flow.from)) nodeNames.push(flow.from);
        if (!nodeNames.includes(flow.to)) nodeNames.push(flow.to);
    });

    const nodeIndices = {};
    nodeNames.forEach((name, index) => {
        nodeIndices[name] = index;
    });

    const sankeyData = {
        type: "sankey",
        orientation: "h",
        node: {
            pad: 15,
            thickness: 20,
            line: {
                color: "black",
                width: 0.5
            },
            label: nodeNames,
            color: nodeNames.map(name => {
                const candidate = candidates.find(c => c.name === name);
                if (elected.includes(candidate.id)) return 'rgba(76, 175, 80, 0.8)';
                if (eliminated.includes(candidate.id)) return 'rgba(244, 67, 54, 0.8)';
                return 'rgba(33, 150, 243, 0.8)';
            })
        },
        link: {
            source: flowData.map(flow => nodeIndices[flow.from]),
            target: flowData.map(flow => nodeIndices[flow.to]),
            value: flowData.map(flow => flow.value),
            color: flowData.map(flow => {
                const candidate = candidates.find(c => c.name === flow.to);
                if (elected.includes(candidate.id)) return "rgba(76, 175, 80, 0.6)";
                if (eliminated.includes(candidate.id)) return "rgba(244, 67, 54, 0.6)";
                return "rgba(33, 150, 243, 0.6)";
            })
        }
    };

    const layout = {
        title: "Vote Transfers Sankey Diagram",
        font: {
            size: 10
        },
        margin: { t: 50, l: 50, r: 50, b: 50 }
    };

    Plotly.newPlot('sankeyDiagram', [sankeyData], layout, {responsive: true});
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

// Add live quota calculation
function updateQuota() {
    const numVoters = parseInt(document.getElementById('numVoters').value) || 0;
    const seatsAvailable = parseInt(document.getElementById('seatsAvailable').value) || 1;
    const quota = calculateQuota(numVoters, seatsAvailable);
    document.getElementById('quotaValue').textContent = quota;
}

// Add event listeners for live updates
document.getElementById('numVoters').addEventListener('input', updateQuota);
document.getElementById('seatsAvailable').addEventListener('input', updateQuota);

// Call initially to set first value
updateQuota();

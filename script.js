let contentDatabase = {};
let termLocations = {};
let currentlyHighlightedTerm = null;

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const gridContainer = document.getElementById('grid-container');
const alphaContent = document.getElementById('alphaContent');
const leafList = document.getElementById('leafList');
const simplifiedTreeContainer = document.getElementById('simplified-tree-container');
const simplifiedTreeSvg = document.getElementById('simplified-tree-svg');

const gridSize = 30;
const grid = [];

for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.dataset.index = i;
    gridContainer.appendChild(cell);
    grid.push(cell);
}

function highlightTerm(termId) {
    clearHighlights();
    const location = termLocations[termId];
    if (location) {
        const [row, col] = location;
        const index1 = row * gridSize + col;
        const index2 = row * gridSize + col + 1;
        grid[index1].classList.add('highlight');
        grid[index2].classList.add('highlight');
    }
}

function clearHighlights() {
    grid.forEach(cell => cell.classList.remove('highlight'));
}

grid.forEach((cell, index) => {
    cell.addEventListener('mouseover', () => {
        const termId = Object.keys(termLocations).find(key => {
            const [row, col] = termLocations[key];
            return (index === row * gridSize + col) || (index === row * gridSize + col + 1);
        });
        if (termId) {
            highlightTerm(termId);
            alphaContent.textContent = contentDatabase[termId].content;
            currentlyHighlightedTerm = termId;
        }
    });
});

// Load and display the tree image
const treeImage = new Image();
treeImage.onload = function() {
    // Draw the image to fit the canvas
    ctx.drawImage(treeImage, 0, 0, canvas.width, canvas.height);
};

// Set the image source - using a placeholder for now
// You'll need to upload your image and replace this URL
treeImage.src = 'images/circle_crop_tree.png';

// Populate selection list
function populateLeafList() {
    leafList.innerHTML = '';
    
    const items = Object.keys(contentDatabase).map(key => ({ id: key, indent: 0 }));
    
    items.forEach(item => {
        const data = contentDatabase[item.id];
        if (data) {
            const li = document.createElement('li');
            li.textContent = `${data.english} | ${data.latin}`;
            li.style.paddingLeft = item.indent + 'px';
            li.addEventListener('mouseover', () => {
                if (currentlyHighlightedTerm !== item.id) {
                    highlightTerm(item.id);
                    currentlyHighlightedTerm = item.id;
                }
            });
            leafList.appendChild(li);
        }
    });
}

function buildSimplifiedTree() {
    simplifiedTreeContainer.innerHTML = '';
    simplifiedTreeSvg.innerHTML = '';

    const terms = [
        { id: 'b1', top: '90%', left: '45%' },
        { id: 'b2', top: '70%', left: '25%' },
        { id: 'b3', top: '70%', left: '45%' },
        { id: 'b4', top: '70%', left: '65%' },
        { id: 'b5', top: '50%', left: '15%' },
        { id: 'b6', top: '50%', left: '35%' },
        { id: 'b7', top: '50%', left: '55%' },
        { id: 'b8', top: '50%', left: '75%' },
        { id: 'b9', top: '30%', left: '65%' },
        { id: 'b10', top: '30%', left: '85%' },
        { id: 'b11', top: '30%', left: '5%' },
        { id: 'b12', top: '10%', left: '45%' }
    ];

    const connections = [
        { from: 'b1', to: 'b2' },
        { from: 'b1', to: 'b3' },
        { from: 'b1', to: 'b4' },
        { from: 'b2', to: 'b5' },
        { from: 'b2', to: 'b6' },
        { from: 'b4', to: 'b7' },
        { from: 'b4', to: 'b8' },
        { from: 'b8', to: 'b9' },
        { from: 'b8', to: 'b10' },
        { from: 'b3', to: 'b11' },
        { from: 'b11', to: 'b12' }
    ];

    terms.forEach(term => {
        const data = contentDatabase[term.id];
        if (data) {
            const node = document.createElement('div');
            node.classList.add('tree-node');
            node.textContent = data.latin;
            node.style.top = term.top;
            node.style.left = term.left;
            simplifiedTreeContainer.appendChild(node);
            term.element = node;
        }
    });

    connections.forEach(connection => {
        const fromTerm = terms.find(t => t.id === connection.from);
        const toTerm = terms.find(t => t.id === connection.to);

        if (fromTerm && toTerm) {
            const fromRect = fromTerm.element.getBoundingClientRect();
            const toRect = toTerm.element.getBoundingClientRect();
            const containerRect = simplifiedTreeContainer.getBoundingClientRect();

            const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
            const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
            const x2 = toRect.left + toRect.width / 2 - containerRect.left;
            const y2 = toRect.top + toRect.height / 2 - containerRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#ffd700');
            line.setAttribute('stroke-width', '1');
            simplifiedTreeSvg.appendChild(line);
        }
    });
}

Promise.all([
    fetch('content.json').then(response => response.json()),
    fetch('coords.json').then(response => response.json())
]).then(([content, coords]) => {
    contentDatabase = content;
    termLocations = coords;
    populateLeafList();
    buildSimplifiedTree();
});

// View navigation
const views = ['viewLanding', 'viewSimple', 'viewEnglish'];
let currentView = 0;

const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const buttonContainer = document.getElementById('buttonContainer');

const buttonConfig = {
    0: { // Landing view
        back: null,
        next: { text: 'Simplified', show: true }
    },
    1: { // Simple view
        back: { text: 'Back to the full glamorous tree', show: true },
        next: { text: 'English', show: true }
    },
    2: { // English view
        back: { text: 'Back to the full glamorous tree', show: true },
        next: { text: 'Latin', show: true }
    }
};

function updateView() {
    views.forEach((viewId, index) => {
        const element = document.getElementById(viewId);
        if (index === currentView) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });

    const config = buttonConfig[currentView];
    
    // Update back button
    if (config.back && config.back.show) {
        backBtn.textContent = config.back.text;
        backBtn.classList.remove('hidden');
    } else {
        backBtn.classList.add('hidden');
    }

    // Update next button
    if (config.next && config.next.show) {
        nextBtn.textContent = config.next.text;
        nextBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.add('hidden');
    }

    // Update button container alignment
    buttonContainer.classList.remove('space-between', 'left-align');
    
    if (currentView === 1) { // Simple view - space between
        buttonContainer.classList.add('space-between');
    } else if (currentView === 2) { // English view - space between
        buttonContainer.classList.add('space-between');
    }
}

nextBtn.addEventListener('click', () => {
    if (currentView === 0) {
        currentView = 1; // Landing to Simple
    } else if (currentView === 1) {
        currentView = 2; // Simple to English
    } else if (currentView === 2) {
        currentView = 1; // English to Latin (Simple)
    }
    updateView();
});

backBtn.addEventListener('click', () => {
    currentView = 0; // Always back to Landing
    updateView();
});

updateView();

let contentDatabase = {};
let termLocations = {};
let currentlyHighlightedTerm = null;
let currentSparkleNodeId = null;

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const gridContainer = document.getElementById('grid-container');
const alphaContent = document.getElementById('alphaContent');
const sectionAlphaTitle = document.getElementById('section-alpha-title');
const leafList = document.getElementById('leafList');
const simplifiedTreeContainer = document.getElementById('simplified-tree-container');
const simplifiedNodesLayer = document.getElementById('simplifiedNodesLayer');
const simplifiedLinesCanvas = document.getElementById('simplifiedLinesCanvas');
const zoomToggleContainer = document.getElementById('zoomToggleContainer');
const zoomToggleBtn = document.getElementById('zoomToggleBtn');
const TREE_IMAGE_SRC = 'images/circle_crop_tree.png';

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
            const data = contentDatabase[termId];
            alphaContent.textContent = data.content;
            sectionAlphaTitle.textContent = `${data.english} | ${data.latin}`;
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
treeImage.src = TREE_IMAGE_SRC;

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
            li.dataset.termId = item.id;
            li.addEventListener('mouseover', () => {
                if (currentlyHighlightedTerm !== item.id) {
                    highlightTerm(item.id);
                    currentlyHighlightedTerm = item.id;
                }
                if (currentView === 1) {
                    setSimplifiedNodeHighlight(item.id);
                } else {
                    clearSimplifiedNodeHighlight();
                }
            });
            li.addEventListener('mouseleave', () => {
                if (li.dataset.termId === currentSparkleNodeId) {
                    clearSimplifiedNodeHighlight();
                }
            });
            leafList.appendChild(li);
        }
    });
}

const DEFAULT_SIMPLIFIED_CONNECTIONS = [
    { from: 'b1', to: 'b2' },
    { from: 'b1', to: 'b3' },
    { from: 'b1', to: 'b4' },
    { from: 'b2', to: 'b5' },
    { from: 'b2', to: 'b6' },
    { from: 'b4', to: 'b7' },
    { from: 'b4', to: 'b8' },
    { from: 'b8', to: 'b10' },
    { from: 'b3', to: 'b11' }
];

const nodePositionOverrides = {
    b10: { topOffset: 12, leftOffset: 4 },
    b11: { topOffset: -4, leftOffset: 0 }
};

const clampPercentage = (value) => Math.max(0, Math.min(100, value));

let simplifiedConnections = [...DEFAULT_SIMPLIFIED_CONNECTIONS];
let simplifiedNodeMap = {};
let simplifiedConnectionsDirty = false;
let simplifiedConnectionsFrameScheduled = false;

const sanitizeName = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
};

function buildNodeLookup(database) {
    const lookup = new Map();
    Object.entries(database).forEach(([id, data]) => {
        const latin = sanitizeName(data.latin || '');
        const english = sanitizeName(data.english || '');
        [latin, english].forEach(key => {
            if (key && !lookup.has(key)) {
                lookup.set(key, id);
            }
        });
    });
    return lookup;
}

function resolveNodeId(name, lookup) {
    if (!name || !lookup) {
        return null;
    }
    const sanitized = sanitizeName(name);
    if (!sanitized) {
        return null;
    }
    if (lookup.has(sanitized)) {
        return lookup.get(sanitized);
    }
    for (const [key, value] of lookup.entries()) {
        if (key.includes(sanitized) || sanitized.includes(key)) {
            return value;
        }
    }
    return null;
}

function parseConnectionText(text, lookup) {
    if (!text || !lookup) {
        return [];
    }
    const lines = text.split(/\r?\n/);
    const edges = [];
    let currentParentId = null;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            currentParentId = null;
            return;
        }

        if (!trimmed.startsWith('-')) {
            currentParentId = resolveNodeId(trimmed, lookup);
            return;
        }

        if (!currentParentId) {
            return;
        }

        const childName = trimmed.replace(/^-+/, '').trim();
        const childId = resolveNodeId(childName, lookup);
        if (childId) {
            edges.push({ from: currentParentId, to: childId });
        }
    });

    return edges;
}

function updateSimplifiedConnectionsFromText(connectionText) {
    const lookup = buildNodeLookup(contentDatabase);
    const parsed = parseConnectionText(connectionText, lookup);
    if (parsed.length) {
        simplifiedConnections = parsed;
    } else {
        simplifiedConnections = [...DEFAULT_SIMPLIFIED_CONNECTIONS];
    }
    markSimplifiedConnectionsDirty();
}

function applyPositionOverrides(id, baseX, baseY) {
    const override = nodePositionOverrides[id] || {};
    return {
        left: clampPercentage(baseX + (override.leftOffset || 0)),
        top: clampPercentage(baseY + (override.topOffset || 0))
    };
}

function markSimplifiedConnectionsDirty() {
    simplifiedConnectionsDirty = true;
    requestSimplifiedConnectionDraw();
}

function requestSimplifiedConnectionDraw() {
    if (!simplifiedLinesCanvas || simplifiedConnectionsFrameScheduled || !simplifiedConnectionsDirty) {
        return;
    }
    simplifiedConnectionsFrameScheduled = true;
    requestAnimationFrame(() => {
        simplifiedConnectionsFrameScheduled = false;
        drawSimplifiedConnections();
    });
}

function drawSimplifiedConnections() {
    if (!simplifiedLinesCanvas || !simplifiedTreeContainer || !simplifiedConnectionsDirty) {
        return;
    }

    const containerRect = simplifiedTreeContainer.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) {
        return;
    }

    simplifiedConnectionsDirty = false;
    simplifiedLinesCanvas.width = containerRect.width;
    simplifiedLinesCanvas.height = containerRect.height;

    const ctx = simplifiedLinesCanvas.getContext('2d');
    ctx.clearRect(0, 0, simplifiedLinesCanvas.width, simplifiedLinesCanvas.height);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    simplifiedConnections.forEach(connection => {
        const fromNode = simplifiedNodeMap[connection.from];
        const toNode = simplifiedNodeMap[connection.to];
        if (!fromNode || !toNode) {
            return;
        }

        const fromRect = fromNode.getBoundingClientRect();
        const toRect = toNode.getBoundingClientRect();

        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
        const startY = fromRect.top - containerRect.top + fromRect.height / 2;
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + toRect.height / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    });
}

function buildSimplifiedTree() {
    if (!simplifiedTreeContainer || !simplifiedNodesLayer) {
        return;
    }

    simplifiedNodesLayer.innerHTML = '';
    simplifiedNodeMap = {};

    const terms = Object.keys(contentDatabase).map(id => {
        const data = contentDatabase[id];
        const location = termLocations[id];
        if (location) {
            const [row, col] = location;
            const x = (col / gridSize) * 100;
            const y = (row / gridSize) * 100;
            return { id, data, x, y };
        }
        return null;
    }).filter(Boolean);

    terms.forEach(term => {
        const node = document.createElement('div');
        node.classList.add('tree-node');
        node.textContent = term.data.latin;

        const { left, top } = applyPositionOverrides(term.id, term.x, term.y);
        node.style.left = `${left}%`;
        node.style.top = `${top}%`;

        simplifiedNodesLayer.appendChild(node);
        simplifiedNodeMap[term.id] = node;

        node.addEventListener('mouseover', () => {
            alphaContent.textContent = term.data.content;
            sectionAlphaTitle.textContent = `${term.data.english} | ${term.data.latin}`;
        });
    });

    if (currentSparkleNodeId && simplifiedNodeMap[currentSparkleNodeId]) {
        if (currentView === 1) {
            simplifiedNodeMap[currentSparkleNodeId].classList.add('sparkle');
        } else {
            currentSparkleNodeId = null;
        }
    } else {
        currentSparkleNodeId = null;
    }

    markSimplifiedConnectionsDirty();
}

Promise.all([
    fetch('content.json').then(response => response.json()),
    fetch('coords.json').then(response => response.json()),
    fetch('connections.txt').then(response => response.text()).catch(() => '')
]).then(([content, coords, connectionText]) => {
    contentDatabase = content;
    termLocations = coords;
    populateLeafList();
    updateSimplifiedConnectionsFromText(connectionText);
    buildSimplifiedTree();
});

// View navigation
const views = ['viewLanding', 'viewSimple', 'viewEnglish'];
let currentView = 0;

function setSimplifiedNodeHighlight(termId) {
    if (currentView !== 1 || !termId) {
        return;
    }
    if (currentSparkleNodeId === termId) {
        return;
    }
    const node = simplifiedNodeMap[termId];
    if (!node) {
        clearSimplifiedNodeHighlight();
        return;
    }
    clearSimplifiedNodeHighlight();
    node.classList.add('sparkle');
    currentSparkleNodeId = termId;
}

function clearSimplifiedNodeHighlight() {
    if (!currentSparkleNodeId) {
        return;
    }
    const node = simplifiedNodeMap[currentSparkleNodeId];
    if (node) {
        node.classList.remove('sparkle');
    }
    currentSparkleNodeId = null;
}

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

    if (zoomToggleContainer) {
        zoomToggleContainer.classList.toggle('hidden', currentView !== 0);
    }

    // Update next button
    if (config.next && config.next.show) {
        nextBtn.textContent = config.next.text;
        nextBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.add('hidden');
    }

    // Update button container alignment
    buttonContainer.classList.remove('space-between', 'left-align', 'back-left');
    if (currentView === 1 || currentView === 2) {
        buttonContainer.classList.add('back-left');
    }

    if (currentView === 1) {
        requestSimplifiedConnectionDraw();
    } else {
        clearSimplifiedNodeHighlight();
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

window.addEventListener('resize', () => {
    if (!simplifiedTreeContainer || !Object.keys(simplifiedNodeMap).length) {
        return;
    }
    markSimplifiedConnectionsDirty();
});

updateView();

const setZoomToggleState = (isOpen) => {
    if (!zoomToggleBtn) {
        return;
    }
    zoomToggleBtn.textContent = isOpen ? 'Close Zoom View' : 'Open Zoom View';
    zoomToggleBtn.setAttribute('aria-pressed', String(isOpen));
};

setZoomToggleState(false);

const zoomModalController = setupTreeZoomModal(setZoomToggleState);

if (zoomToggleBtn && zoomModalController) {
    zoomToggleBtn.addEventListener('click', () => {
        zoomModalController.toggle();
    });
}

function setupTreeZoomModal(onStateChange) {
    const canvasElement = document.getElementById('treeCanvas');
    const modal = document.getElementById('imageModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const zoomView = document.getElementById('zoomView');
    if (!canvasElement || !modal || !closeBtn || !zoomView) {
        if (typeof onStateChange === 'function') {
            onStateChange(false);
        }
        return;
    }

    const magnification = 5;
    let isPointerActive = false;
    let isModalOpen = false;
    let lastPosition = { x: 0.5, y: 0.5 };

    const notifyStateChange = (state) => {
        if (typeof onStateChange === 'function') {
            onStateChange(state);
        }
    };

    zoomView.style.backgroundSize = `${magnification * 100}% ${magnification * 100}%`;
    zoomView.style.backgroundImage = `url('${TREE_IMAGE_SRC}')`;

    const clamp = (value) => Math.min(Math.max(value, 0), 1);

    const updateZoomView = (relativeX, relativeY) => {
        const clampedX = clamp(relativeX);
        const clampedY = clamp(relativeY);
        zoomView.style.backgroundPosition = `${clampedX * 100}% ${clampedY * 100}%`;
        lastPosition = { x: clampedX, y: clampedY };
    };

    const openModal = (relativeX = lastPosition.x, relativeY = lastPosition.y) => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        isModalOpen = true;
        updateZoomView(relativeX, relativeY);
        notifyStateChange(true);
    };

    const closeModal = () => {
        if (modal.classList.contains('hidden')) {
            return;
        }
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        isPointerActive = false;
        isModalOpen = false;
        notifyStateChange(false);
    };

    const updatePositionFromEvent = (event) => {
        const rect = zoomView.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        updateZoomView(relativeX, relativeY);
    };

    const handleCanvasClick = (event) => {
        const rect = canvasElement.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        openModal(relativeX, relativeY);
    };

    const handlePointerDown = (event) => {
        isPointerActive = true;
        updatePositionFromEvent(event);
    };

    const handlePointerMove = (event) => {
        if (!isPointerActive) {
            return;
        }
        updatePositionFromEvent(event);
    };

    const handlePointerUp = () => {
        isPointerActive = false;
    };

    canvasElement.addEventListener('click', handleCanvasClick);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    zoomView.addEventListener('pointerdown', handlePointerDown);
    zoomView.addEventListener('pointermove', handlePointerMove);
    zoomView.addEventListener('pointerup', handlePointerUp);
    zoomView.addEventListener('pointerleave', handlePointerUp);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    notifyStateChange(false);

    return {
        openAt(relativeX = lastPosition.x, relativeY = lastPosition.y) {
            openModal(relativeX, relativeY);
        },
        close: closeModal,
        toggle() {
            if (isModalOpen) {
                closeModal();
            } else {
                openModal(lastPosition.x, lastPosition.y);
            }
        },
        isOpen() {
            return isModalOpen;
        }
    };
}

let contentDatabase = {};
let termLocations = {};
let currentlyHighlightedTerm = null;

const selectionOrder = [
    'b1',  // Suppositio
    'b5',  // Discreta
    'b6',  // Communis
    'b9',  // Naturalis
    'b2',  // Accidentalis
    'b3',  // Simplex
    'b4',  // Personalis
    'b7',  // Determinata
    'b8',  // Confusa
    'b10', // Mobilis et distributiva
    'b11'  // Immobilis
];

const APP_VERSION = 'v1.0.9';
if (typeof document !== 'undefined' && document.body) {
    document.body.dataset.appVersion = APP_VERSION;
}

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const gridContainer = document.getElementById('grid-container');
const highlightCanvas = document.getElementById('highlightCanvas');
const highlightCtx = highlightCanvas ? highlightCanvas.getContext('2d') : null;
const alphaContent = document.getElementById('alphaContent');
const sectionAlphaTitle = document.getElementById('section-alpha-title');
const leafList = document.getElementById('leafList');
const zoomToggleContainer = document.getElementById('zoomToggleContainer');
const zoomToggleBtn = document.getElementById('zoomToggleBtn');
const starfieldLayer = document.getElementById('starfield');
const TREE_IMAGE_SRC = 'images/circle_crop_tree.png';
let magnifierController = null;

const treeViewConfigs = {
    simplified: {
        containerId: 'simplified-tree-container',
        nodesLayerId: 'simplifiedNodesLayer',
        linesCanvasId: 'simplifiedLinesCanvas',
        labelResolver: (data) => data.latin
    },
    english: {
        containerId: 'english-tree-container',
        nodesLayerId: 'englishNodesLayer',
        linesCanvasId: 'englishLinesCanvas',
        labelResolver: (data) => data.english
    }
};

const treeViews = Object.entries(treeViewConfigs).reduce((acc, [key, config]) => {
    acc[key] = {
        key,
        container: document.getElementById(config.containerId),
        nodesLayer: document.getElementById(config.nodesLayerId),
        linesCanvas: document.getElementById(config.linesCanvasId),
        labelResolver: config.labelResolver,
        nodeMap: {},
        connectionsDirty: false,
        frameScheduled: false
    };
    return acc;
}, {});

const viewHighlightState = {
    simplified: null,
    english: null
};

const VIEW_KEY_TO_INDEX = {
    simplified: 1,
    english: 2
};

const formatTermContent = (text) => {
    if (!text) {
        return '';
    }
    return text.replace(/\nExamples:/g, '<br><br><strong>Examples:</strong>');
};

const gridSize = 30;
const grid = [];
let highlightCanvasSize = { width: 0, height: 0 };

for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.dataset.index = i;
    gridContainer.appendChild(cell);
    grid.push(cell);
}

function resizeHighlightCanvas() {
    if (!highlightCanvas || !highlightCtx || !gridContainer) {
        return;
    }
    const width = gridContainer.clientWidth;
    const height = gridContainer.clientHeight;
    if (!width || !height) {
        return;
    }
    const dpr = window.devicePixelRatio || 1;
    highlightCanvas.width = width * dpr;
    highlightCanvas.height = height * dpr;
    highlightCanvas.style.width = `${width}px`;
    highlightCanvas.style.height = `${height}px`;
    highlightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    highlightCanvasSize = { width, height };
    clearHighlightOverlay();
    if (currentlyHighlightedTerm) {
        drawHighlightOverlay(currentlyHighlightedTerm);
    }
}

function clearHighlightOverlay() {
    if (!highlightCtx || !highlightCanvas) {
        return;
    }
    highlightCtx.clearRect(0, 0, highlightCanvasSize.width || highlightCanvas.width, highlightCanvasSize.height || highlightCanvas.height);
    highlightCanvas.classList.remove('glow-active');
}

function drawHighlightOverlay(termId) {
    if (!highlightCtx || !highlightCanvas || !gridContainer) {
        return;
    }
    const location = termLocations[termId];
    if (!location) {
        return;
    }
    if (!highlightCanvasSize.width || !highlightCanvasSize.height) {
        resizeHighlightCanvas();
    }
    const width = highlightCanvasSize.width;
    const height = highlightCanvasSize.height;
    if (!width || !height) {
        return;
    }
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    const [row, col] = location;
    const startX = col * cellWidth;
    const startY = row * cellHeight;
    const highlightWidth = cellWidth * 2;
    const highlightHeight = cellHeight;

    clearHighlightOverlay();

    highlightCtx.save();
    highlightCtx.globalCompositeOperation = 'lighter';
    highlightCtx.shadowColor = 'rgba(255, 215, 0, 0.75)';
    highlightCtx.shadowBlur = Math.max(cellWidth, cellHeight) * 1.2;
    highlightCtx.lineWidth = Math.max(cellWidth, cellHeight) * 0.125;
    highlightCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';

    const radius = Math.min(highlightWidth, highlightHeight) * 0.45;
    highlightCtx.beginPath();
    highlightCtx.moveTo(startX + radius, startY);
    highlightCtx.lineTo(startX + highlightWidth - radius, startY);
    highlightCtx.quadraticCurveTo(startX + highlightWidth, startY, startX + highlightWidth, startY + radius);
    highlightCtx.lineTo(startX + highlightWidth, startY + highlightHeight - radius);
    highlightCtx.quadraticCurveTo(startX + highlightWidth, startY + highlightHeight, startX + highlightWidth - radius, startY + highlightHeight);
    highlightCtx.lineTo(startX + radius, startY + highlightHeight);
    highlightCtx.quadraticCurveTo(startX, startY + highlightHeight, startX, startY + highlightHeight - radius);
    highlightCtx.lineTo(startX, startY + radius);
    highlightCtx.quadraticCurveTo(startX, startY, startX + radius, startY);
    highlightCtx.closePath();
    highlightCtx.stroke();

    highlightCtx.restore();
    highlightCanvas.classList.add('glow-active');
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
        drawHighlightOverlay(termId);
    }
}

function clearHighlights() {
    grid.forEach(cell => cell.classList.remove('highlight'));
    clearHighlightOverlay();
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
            alphaContent.innerHTML = formatTermContent(data.content);
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
const getOrderedTermIds = () => {
    const existingIds = new Set(Object.keys(contentDatabase));
    const ordered = selectionOrder.filter(id => existingIds.has(id));
    const remaining = [...existingIds].filter(id => !selectionOrder.includes(id));
    return [...ordered, ...remaining];
};

function populateLeafList() {
    leafList.innerHTML = '';
    
    const items = getOrderedTermIds().map(key => ({ id: key, indent: 0 }));
    
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
                if (currentView === VIEW_KEY_TO_INDEX.simplified) {
                    setTreeNodeHighlight('simplified', item.id);
                } else if (currentView === VIEW_KEY_TO_INDEX.english) {
                    setTreeNodeHighlight('english', item.id);
                } else {
                    clearAllTreeNodeHighlights();
                }
            });
            li.addEventListener('mouseleave', () => {
                if (currentView === VIEW_KEY_TO_INDEX.simplified && li.dataset.termId === viewHighlightState.simplified) {
                    clearTreeNodeHighlight('simplified');
                }
                if (currentView === VIEW_KEY_TO_INDEX.english && li.dataset.termId === viewHighlightState.english) {
                    clearTreeNodeHighlight('english');
                }
            });
            li.addEventListener('click', () => {
                const termData = contentDatabase[item.id];
                if (!termData) {
                    return;
                }
                alphaContent.innerHTML = formatTermContent(termData.content);
                sectionAlphaTitle.textContent = `${termData.english} | ${termData.latin}`;
                highlightTerm(item.id);
                currentlyHighlightedTerm = item.id;
                if (currentView === VIEW_KEY_TO_INDEX.simplified) {
                    setTreeNodeHighlight('simplified', item.id);
                } else if (currentView === VIEW_KEY_TO_INDEX.english) {
                    setTreeNodeHighlight('english', item.id);
                } else {
                    clearAllTreeNodeHighlights();
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
    b10: { topOffset: -12, leftOffset: 0 },
    b11: { topOffset: 16, leftOffset: 4 }
};

const simplifiedViewSpacing = {
    centerX: 50,
    centerY: 50,
    spreadFactor: 1.4,
    anchorTermId: 'b4',
    anchorTargetX: 50
};

let cachedSimplifiedLeftShift = null;

const clampPercentage = (value) => Math.max(0, Math.min(100, value));

let treeConnections = [...DEFAULT_SIMPLIFIED_CONNECTIONS];

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
        treeConnections = parsed;
    } else {
        treeConnections = [...DEFAULT_SIMPLIFIED_CONNECTIONS];
    }
    markAllConnectionsDirty();
}

function applyPositionOverrides(id, baseX, baseY) {
    const override = nodePositionOverrides[id] || {};
    return {
        left: baseX + (override.leftOffset || 0),
        top: baseY + (override.topOffset || 0)
    };
}

function getSimplifiedLeftShift() {
    if (cachedSimplifiedLeftShift !== null) {
        return cachedSimplifiedLeftShift;
    }
    const { anchorTermId, anchorTargetX, centerX, spreadFactor } = simplifiedViewSpacing;
    if (!anchorTermId || !termLocations[anchorTermId]) {
        cachedSimplifiedLeftShift = 0;
        return cachedSimplifiedLeftShift;
    }
    const [row, col] = termLocations[anchorTermId];
    const baseX = (col / gridSize) * 100;
    const baseY = (row / gridSize) * 100;
    const basePosition = applyPositionOverrides(anchorTermId, baseX, baseY);
    const anchorLeft = centerX + (basePosition.left - centerX) * spreadFactor;
    cachedSimplifiedLeftShift = anchorLeft - (typeof anchorTargetX === 'number' ? anchorTargetX : 50);
    return cachedSimplifiedLeftShift;
}

function adjustPositionForView(viewKey, termId, position) {
    let left = position.left;
    let top = position.top;

    if (viewKey === 'simplified' || viewKey === 'english') {
        const { centerX, centerY, spreadFactor } = simplifiedViewSpacing;
        left = centerX + (left - centerX) * spreadFactor;
        left -= getSimplifiedLeftShift();
        top = centerY + (top - centerY) * spreadFactor;
    }

    return {
        left: clampPercentage(left),
        top: clampPercentage(top)
    };
}

const getRenderableTerms = () => {
    return Object.keys(contentDatabase).map(id => {
        const data = contentDatabase[id];
        const location = termLocations[id];
        if (data && location) {
            const [row, col] = location;
            const x = (col / gridSize) * 100;
            const y = (row / gridSize) * 100;
            return { id, data, x, y };
        }
        return null;
    }).filter(Boolean);
};

const getTreeView = (viewKey) => treeViews[viewKey];

const getHighlightedTermId = (viewKey) => viewHighlightState[viewKey] || null;

function isViewActive(viewKey) {
    return VIEW_KEY_TO_INDEX[viewKey] === currentView;
}

function setTreeNodeHighlight(viewKey, termId) {
    if (!viewKey || !termId) {
        return;
    }
    if (!isViewActive(viewKey)) {
        return;
    }
    const view = getTreeView(viewKey);
    if (!view) {
        return;
    }
    if (viewHighlightState[viewKey] === termId) {
        return;
    }
    clearTreeNodeHighlight(viewKey);
    const node = view.nodeMap[termId];
    if (node) {
        node.classList.add('sparkle');
        viewHighlightState[viewKey] = termId;
    }
}

function clearTreeNodeHighlight(viewKey) {
    if (!viewKey) {
        return;
    }
    const view = getTreeView(viewKey);
    const highlightedId = getHighlightedTermId(viewKey);
    if (view && highlightedId && view.nodeMap[highlightedId]) {
        view.nodeMap[highlightedId].classList.remove('sparkle');
    }
    viewHighlightState[viewKey] = null;
}

function clearAllTreeNodeHighlights() {
    Object.keys(viewHighlightState).forEach(clearTreeNodeHighlight);
}

function markConnectionsDirty(viewKey) {
    const view = getTreeView(viewKey);
    if (!view || !view.linesCanvas) {
        return;
    }
    view.connectionsDirty = true;
    requestConnectionDraw(viewKey);
}

function markAllConnectionsDirty() {
    Object.keys(treeViews).forEach(markConnectionsDirty);
}

function requestConnectionDraw(viewKey) {
    const view = getTreeView(viewKey);
    if (!view || view.frameScheduled || !view.connectionsDirty || !view.linesCanvas) {
        return;
    }
    view.frameScheduled = true;
    requestAnimationFrame(() => {
        view.frameScheduled = false;
        drawConnections(viewKey);
    });
}

function drawConnections(viewKey) {
    const view = getTreeView(viewKey);
    if (!view || !view.linesCanvas || !view.container || !view.connectionsDirty) {
        return;
    }

    const containerRect = view.container.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) {
        return;
    }

    view.connectionsDirty = false;
    view.linesCanvas.width = containerRect.width;
    view.linesCanvas.height = containerRect.height;

    const ctx = view.linesCanvas.getContext('2d');
    ctx.clearRect(0, 0, view.linesCanvas.width, view.linesCanvas.height);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    treeConnections.forEach(connection => {
        const fromNode = view.nodeMap[connection.from];
        const toNode = view.nodeMap[connection.to];
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

function buildTreeViewNodes(viewKey) {
    const view = getTreeView(viewKey);
    if (!view || !view.container || !view.nodesLayer) {
        return;
    }

    view.nodesLayer.innerHTML = '';
    view.nodeMap = {};

    const terms = getRenderableTerms();

    terms.forEach(term => {
        const node = document.createElement('div');
        node.classList.add('tree-node');
        const label = typeof view.labelResolver === 'function'
            ? view.labelResolver(term.data, term.id)
            : term.data.latin;
        node.textContent = label || term.data.latin;

        const basePosition = applyPositionOverrides(term.id, term.x, term.y);
        const { left, top } = adjustPositionForView(viewKey, term.id, basePosition);
        node.style.left = `${left}%`;
        node.style.top = `${top}%`;

        view.nodesLayer.appendChild(node);
        view.nodeMap[term.id] = node;

        node.addEventListener('mouseover', () => {
            alphaContent.innerHTML = formatTermContent(term.data.content);
            sectionAlphaTitle.textContent = `${term.data.english} | ${term.data.latin}`;
            if (isViewActive(viewKey)) {
                setTreeNodeHighlight(viewKey, term.id);
            }
        });

        node.addEventListener('mouseleave', () => {
            if (viewHighlightState[viewKey] === term.id) {
                clearTreeNodeHighlight(viewKey);
            }
        });
    });

    const highlightedId = getHighlightedTermId(viewKey);
    if (highlightedId && view.nodeMap[highlightedId]) {
        if (isViewActive(viewKey)) {
            view.nodeMap[highlightedId].classList.add('sparkle');
        } else {
            viewHighlightState[viewKey] = null;
        }
    }

    markConnectionsDirty(viewKey);
}

function buildAllTreeViews() {
    buildTreeViewNodes('simplified');
    buildTreeViewNodes('english');
}

Promise.all([
    fetch('content.json').then(response => response.json()),
    fetch('coords.json').then(response => response.json()),
    fetch('connections.txt').then(response => response.text()).catch(() => '')
]).then(([content, coords, connectionText]) => {
    contentDatabase = content;
    termLocations = coords;
    cachedSimplifiedLeftShift = null;
    populateLeafList();
    updateSimplifiedConnectionsFromText(connectionText);
    buildAllTreeViews();
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

    const showMagnifierToggle = currentView === 0;
    if (zoomToggleContainer) {
        zoomToggleContainer.classList.toggle('hidden', !showMagnifierToggle);
    }
    if (!showMagnifierToggle && magnifierController && magnifierController.isActive()) {
        magnifierController.disable();
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

    if (currentView === VIEW_KEY_TO_INDEX.simplified) {
        requestConnectionDraw('simplified');
    } else {
        clearTreeNodeHighlight('simplified');
    }

    if (currentView === VIEW_KEY_TO_INDEX.english) {
        requestConnectionDraw('english');
    } else {
        clearTreeNodeHighlight('english');
    }

    if (currentView === 0) {
        resizeHighlightCanvas();
    } else {
        clearHighlightOverlay();
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
    Object.keys(treeViews).forEach(viewKey => {
        const view = getTreeView(viewKey);
        if (view && view.container && Object.keys(view.nodeMap).length) {
            markConnectionsDirty(viewKey);
        }
    });
    if (currentView === 0) {
        resizeHighlightCanvas();
    }
    if (magnifierController && magnifierController.isActive()) {
        magnifierController.refresh();
    }
});

const setZoomToggleState = (isEnabled) => {
    if (!zoomToggleBtn) {
        return;
    }
    zoomToggleBtn.setAttribute('aria-pressed', String(isEnabled));
    zoomToggleBtn.classList.toggle('active', Boolean(isEnabled));
};

setZoomToggleState(false);

magnifierController = setupMagnifier(setZoomToggleState);

if (zoomToggleBtn && magnifierController) {
    zoomToggleBtn.addEventListener('click', () => {
        magnifierController.toggle();
    });
}

setupStarfieldParallax();

updateView();
resizeHighlightCanvas();

function setupMagnifier(onStateChange) {
    const canvasElement = document.getElementById('treeCanvas');
    const lens = document.getElementById('magnifierLens');
    const container = canvasElement ? canvasElement.parentElement : null;
    if (!canvasElement || !lens || !container) {
        if (typeof onStateChange === 'function') {
            onStateChange(false);
        }
        return null;
    }

    const magnification = 10;
    let lensDiameter = 20;
    let isActive = false;
    let lastPosition = { x: 0.5, y: 0.5 };

    const clamp = (value) => Math.min(Math.max(value, 0), 1);

    const updateLensDimensions = () => {
        const rect = container.getBoundingClientRect();
        if (!rect.width || !rect.height) {
            return lensDiameter;
        }
        const limitingSize = Math.min(rect.width, rect.height);
        lensDiameter = limitingSize * 0.25;
        lens.style.width = `${lensDiameter}px`;
        lens.style.height = `${lensDiameter}px`;
        return lensDiameter;
    };

    const updateLens = (relativeX, relativeY) => {
        const clampedX = clamp(relativeX);
        const clampedY = clamp(relativeY);
        lastPosition = { x: clampedX, y: clampedY };
        const containerRect = container.getBoundingClientRect();
        const currentDiameter = lensDiameter || updateLensDimensions();
        const offsetLeft = clampedX * containerRect.width - (currentDiameter / 2);
        const offsetTop = clampedY * containerRect.height - (currentDiameter / 2);
        lens.style.left = `${offsetLeft}px`;
        lens.style.top = `${offsetTop}px`;
        lens.style.backgroundPosition = `${clampedX * 100}% ${clampedY * 100}%`;
    };

    const updateFromPointer = (event) => {
        const rect = container.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        updateLens(relativeX, relativeY);
    };

    const showLensAtEvent = (event) => {
        if (!isActive) {
            return;
        }
        lens.style.display = 'block';
        updateFromPointer(event);
    };

    const handlePointerLeave = () => {
        lens.style.display = 'none';
    };

    const enable = () => {
        if (isActive) {
            return;
        }
        isActive = true;
        lens.style.display = 'none';
        lens.style.backgroundImage = `url('${TREE_IMAGE_SRC}')`;
        lens.style.backgroundSize = `${magnification * 100}% ${magnification * 100}%`;
        updateLensDimensions();
        updateLens(lastPosition.x, lastPosition.y);
        container.classList.add('magnifier-active');
        container.addEventListener('pointerenter', showLensAtEvent);
        container.addEventListener('pointermove', showLensAtEvent);
        container.addEventListener('pointerleave', handlePointerLeave);
        if (typeof onStateChange === 'function') {
            onStateChange(true);
        }
    };

    const disable = () => {
        if (!isActive) {
            return;
        }
        isActive = false;
        lens.style.display = 'none';
        container.classList.remove('magnifier-active');
        container.removeEventListener('pointerenter', showLensAtEvent);
        container.removeEventListener('pointermove', showLensAtEvent);
        container.removeEventListener('pointerleave', handlePointerLeave);
        if (typeof onStateChange === 'function') {
            onStateChange(false);
        }
    };

    const toggle = () => {
        if (isActive) {
            disable();
        } else {
            enable();
        }
    };

    return {
        enable,
        disable,
        toggle,
        isActive: () => isActive,
        refresh() {
            if (!container || !lens) {
                return;
            }
            updateLensDimensions();
            updateLens(lastPosition.x, lastPosition.y);
        }
    };
}

function setupStarfieldParallax() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return null;
    }
    if (!starfieldLayer) {
        return null;
    }
    const hasFinePointer = typeof window.matchMedia !== 'function'
        ? true
        : window.matchMedia('(any-pointer: fine)').matches;
    if (!hasFinePointer) {
        starfieldLayer.style.transform = 'translate3d(0px, 0px, 0) scale(1.05)';
        return null;
    }

    const horizontalRange = 30;
    const verticalRange = 20;
    const baseScale = 1.05;
    let pending = false;
    let translateX = 0;
    let translateY = 0;

    const applyTransform = () => {
        pending = false;
        starfieldLayer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${baseScale})`;
    };

    const handleMove = (event) => {
        const { innerWidth, innerHeight } = window;
        if (!innerWidth || !innerHeight) {
            return;
        }
        const xRatio = (event.clientX / innerWidth) - 0.5;
        const yRatio = (event.clientY / innerHeight) - 0.5;
        translateX = -xRatio * horizontalRange;
        translateY = -yRatio * verticalRange;
        if (!pending) {
            pending = true;
            requestAnimationFrame(applyTransform);
        }
    };

    const reset = () => {
        translateX = 0;
        translateY = 0;
        applyTransform();
    };

    const handleLeave = (event) => {
        if (event.relatedTarget === null) {
            reset();
        }
    };

    const supportsPointer = typeof window.PointerEvent === 'function';
    const moveEvent = supportsPointer ? 'pointermove' : 'mousemove';

    window.addEventListener(moveEvent, handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
    window.addEventListener('blur', reset);

    return {
        destroy() {
            window.removeEventListener(moveEvent, handleMove);
            document.removeEventListener('mouseleave', handleLeave);
            window.removeEventListener('blur', reset);
            reset();
        }
    };
}

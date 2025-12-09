let contentDatabase = {};
let termLocations = {};
let currentlyHighlightedTerm = null;

const APP_VERSION = 'v1.0.9';
if (typeof document !== 'undefined' && document.body) {
    document.body.dataset.appVersion = APP_VERSION;
}

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const gridContainer = document.getElementById('grid-container');
const alphaContent = document.getElementById('alphaContent');
const sectionAlphaTitle = document.getElementById('section-alpha-title');
const leafList = document.getElementById('leafList');
const zoomToggleContainer = document.getElementById('zoomToggleContainer');
const zoomToggleBtn = document.getElementById('zoomToggleBtn');
const TREE_IMAGE_SRC = 'images/circle_crop_tree.png';

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
    b10: { topOffset: 16, leftOffset: 4 },
    b11: { topOffset: -4, leftOffset: 0 }
};

const clampPercentage = (value) => Math.max(0, Math.min(100, value));

let simplifiedConnections = [...DEFAULT_SIMPLIFIED_CONNECTIONS];

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
    markAllConnectionsDirty();
}

function applyPositionOverrides(id, baseX, baseY) {
    const override = nodePositionOverrides[id] || {};
    return {
        left: clampPercentage(baseX + (override.leftOffset || 0)),
        top: clampPercentage(baseY + (override.topOffset || 0))
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

    simplifiedConnections.forEach(connection => {
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

        const { left, top } = applyPositionOverrides(term.id, term.x, term.y);
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

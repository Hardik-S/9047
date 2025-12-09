let contentDatabase = {};
let termLocations = {};
let currentlyHighlightedTerm = null;

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const gridContainer = document.getElementById('grid-container');
const alphaContent = document.getElementById('alphaContent');
const sectionAlphaTitle = document.getElementById('section-alpha-title');
const leafList = document.getElementById('leafList');
const simplifiedTreeContainer = document.getElementById('simplified-tree-container');
const simplifiedTreeSvg = document.getElementById('simplified-tree-svg');
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

    const terms = Object.keys(contentDatabase).map(id => {
        const data = contentDatabase[id];
        const location = termLocations[id];
        if (location) {
            const [row, col] = location;
            // Calculate position based on grid coordinates
            const x = (col / gridSize) * 100;
            const y = (row / gridSize) * 100;
            return { id, data, x, y, element: null };
        }
        return null;
    }).filter(Boolean);

    const connections = [
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

    // Create nodes
    terms.forEach(term => {
        const node = document.createElement('div');
        node.classList.add('tree-node');
        node.textContent = term.data.latin;
        node.style.position = 'absolute';
        // Flip Y-axis for root at bottom
        node.style.left = `${term.x}%`;
        node.style.top = `${100 - term.y}%`; // Initial flip
        simplifiedTreeContainer.appendChild(node);
        term.element = node;

        node.addEventListener('mouseover', () => {
            alphaContent.textContent = term.data.content;
            sectionAlphaTitle.textContent = `${term.data.english} | ${term.data.latin}`;
        });
    });

    // Draw connections after a short delay
    setTimeout(() => {
        connections.forEach(connection => {
            const fromTerm = terms.find(t => t.id === connection.from);
            const toTerm = terms.find(t => t.id === connection.to);

            if (fromTerm && toTerm && fromTerm.element && toTerm.element) {
                const x1 = fromTerm.element.offsetLeft + fromTerm.element.offsetWidth / 2;
                const y1 = fromTerm.element.offsetTop + fromTerm.element.offsetHeight / 2;
                const x2 = toTerm.element.offsetLeft + toTerm.element.offsetWidth / 2;
                const y2 = toTerm.element.offsetTop + toTerm.element.offsetHeight / 2;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', '#ffd700'); // Gold color
                line.setAttribute('stroke-width', '1'); // Thin line
                simplifiedTreeSvg.appendChild(line);
            }
        });
    }, 100);
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

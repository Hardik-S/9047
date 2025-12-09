const contentDatabase = {
    'b1': { latin: 'Suppositio', english: 'Supposition', content: 'Suppositio est acceptio termini substantivi pro aliquo.' },
    'b2': { latin: 'Materialis', english: 'Material', content: 'Suppositio materialis est acceptio termini pro se ipso vel pro alio termino.' },
    'b3': { latin: 'Simplex', english: 'Simple', content: 'Suppositio simplex est acceptio termini communis pro re universali representata per ipsum.' },
    'b4': { latin: 'Personalis', english: 'Personal', content: 'Suppositio personalis est acceptio termini pro re particulari.' },
    'b5': { latin: 'Discreta', english: 'Discrete', content: 'Suppositio personalis discreta est acceptio termini discreti pro re particulari.' },
    'b6': { latin: 'Communis', english: 'Common', content: 'Suppositio personalis communis est acceptio termini communis pro re particulari.' },
    'b7': { latin: 'Determinata', english: 'Determinate', content: 'Suppositio personalis communis determinata est acceptio termini communis pro re particulari determinata.' },
    'b8': { latin: 'Confusa', english: 'Confused', content: 'Suppositio personalis communis confusa est acceptio termini communis pro re particulari confusa.' },
    'b9': { latin: 'Tantum', english: 'Only', content: 'Suppositio personalis communis confusa tantum est acceptio termini communis pro re particulari confusa tantum.' },
    'b10': { latin: 'Mobilis', english: 'Mobile', content: 'Suppositio personalis communis confusa mobilis est acceptio termini communis pro re particulari confusa mobilis.' },
    'b11': { latin: 'Immobilis', english: 'Immobile', content: 'Suppositio personalis communis confusa immobilis est acceptio termini communis pro re particulari confusa immobilis.' },
    'b12': { latin: 'Appellatio', english: 'Appellation', content: 'Appellatio est acceptio termini pro re existente.' },
    'b13': { latin: 'Relativa', english: 'Relative', content: 'Appellatio relativa est acceptio termini pro re ad quam refertur.' },
    'b14': { latin: 'Naturalis', english: 'Natural', content: 'Appellatio naturalis est acceptio termini pro re secundum naturam.' },
    'b15': { latin: 'Consuetudinaria', english: 'Customary', content: 'Appellatio consuetudinaria est acceptio termini pro re secundum consuetudinem.' }
};

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const alphaContent = document.getElementById('alphaContent');
const leafList = document.getElementById('leafList');

// Load and display the tree image
const treeImage = new Image();
treeImage.onload = function() {
    // Draw the image to fit the canvas
    ctx.drawImage(treeImage, 0, 0, canvas.width, canvas.height);
};

// Set the image source - using a placeholder for now
// You'll need to upload your image and replace this URL
treeImage.src = 'tree_cropped.jpg';

// Populate selection list
function populateLeafList() {
    leafList.innerHTML = '';
    
    const items = [
        { id: 'b1', indent: 0 },
        { id: 'b2', indent: 20 },
        { id: 'b3', indent: 20 },
        { id: 'b4', indent: 20 },
        { id: 'b5', indent: 40 },
        { id: 'b6', indent: 40 },
        { id: 'b7', indent: 60 },
        { id: 'b8', indent: 60 },
        { id: 'b9', indent: 80 },
        { id: 'b10', indent: 80 },
        { id: 'b11', indent: 80 },
        { id: 'b12', indent: 0 },
        { id: 'b13', indent: 20 },
        { id: 'b14', indent: 40 },
        { id: 'b15', indent: 40 }
    ];
    
    items.forEach(item => {
        const data = contentDatabase[item.id];
        if (data) {
            const li = document.createElement('li');
            li.textContent = `${data.english} | ${data.latin}`;
            li.style.paddingLeft = item.indent + 'px';
            li.addEventListener('click', () => {
                alphaContent.textContent = data.content;
            });
            leafList.appendChild(li);
        }
    });
}

populateLeafList();

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

const contentDatabase = {
    'b1': {
        latin: 'Suppositio',
        english: 'Supposition',
        content: 'Supposition, in Peter of Spain\'s framework, is the way a term in a proposition stands in for what it signifies, so that the sentence is about things in the world rather than just about words. The idea is that when we reason, a spoken or written term is "put in place of" the thing it signifies, and different kinds of supposition mark different patterns in how that substitution works (for example, whether the term ranges over a universal, a single individual, or many individuals at once). Supposition is always context-sensitive: it belongs to the term as it appears in a specific proposition and position, not to the word in isolation.'
    },
    'b2': {
        latin: 'Materialis',
        english: 'Material',
        content: 'Suppositio materialis est acceptio termini pro se ipso vel pro alio termino.'
    },
    'b3': {
        latin: 'Simplex',
        english: 'Simple',
        content: 'Simple supposition is the pattern in which a common term stands, not for individual things, but for the universal or kind that it signifies. Instead of ranging over “lower” items in a genus-species hierarchy, the term refers to the species or genus itself, considered as a single, abstract entity. This is how we speak when doing classification or metaphysics rather than describing particular members: we are talking about what the kind is, not which individuals fall under it. Simple supposition thus contrasts with personal supposition, where the same term would stand for concrete instances.'
    },
    'b4': {
        latin: 'Personalis',
        english: 'Personal',
        content: 'Personal supposition is the pattern in which a common term stands for the individual things "below" it in the logical hierarchy, so that the proposition is about actual members of the relevant kind rather than about the universal itself. This is the dominant, everyday mode of speech: when we say “humans,” “cats,” or “students,” we are usually talking about concrete individuals who walk around, act, and change. In Peter of Spain\'s taxonomy, personal supposition is the main branch under which more fine-grained kinds like determinate and confused supposition are sorted, depending on how the term ranges over its many possible bearers.'
    },
    'b5': {
        latin: 'Discreta',
        english: 'Discrete',
        content: 'Discrete supposition is the kind of supposition had by discrete terms, expressions whose reference is fixed on a particular individual rather than a whole class. Instead of ranging over many possible instances, the term directly picks out a single thing, so the proposition is straightforwardly about that individual. Peter of Spain treats proper names and demonstratives as paradigmatic discrete terms, since they are designed to latch onto one item rather than a universal. In this way, discrete supposition is the “most determinate” kind of standing-for: there is exactly one bearer in view.'
    },
    'b6': {
        latin: 'Communis',
        english: 'Common',
        content: 'Common supposition is the kind of supposition had by common terms, expressions that can apply to many individuals and so have a more “universal” reach. Nouns like “human,” adjectives like “white,” and many verbs are common in this sense: they are not tied to one particular thing but are, in principle, apt to be truly predicated of many. When a term has common supposition, it does not, by itself, single out one bearer; instead, it opens up a field of possible instances that more specific grammatical devices (like quantifiers and modifiers) can then shape. This makes common supposition the natural starting point for talking about species, properties, and repeatable features.'
    },
    'b7': {
        latin: 'Determinata',
        english: 'Determinate',
        content: 'Determinate supposition is a kind of personal supposition in which a common term stands for “some one or other” of the things below it, such that the truth of the whole proposition requires that there be at least one such thing for which the predicate holds. The individual in question is not named, but the logical form allows you to descend to a single particular and preserve truth: if the sentence is true, it is because one concrete instance makes it so. Determinate supposition is characteristic of terms used indefinitely or with particular signs like “a,” “some,” or “a certain.”'
    },
    'b8': {
        latin: 'Confusa',
        english: 'Confused',
        content: 'Confused supposition is a kind of personal supposition in which a common term stands for many individuals at once in such a way that you cannot simply isolate one bearer and preserve the truth conditions. Here the term’s reference is “spread out” over its whole extension: the proposition is true only if what is said holds of all the relevant things, or at least in a way that cannot be captured by singling out one instance. This kind of supposition is typically triggered by universal signs like “every,” which force the term to range across its entire (or at least a broad) field of application.'
    },
    'b9': {
        latin: 'Tantum',
        english: 'Only',
        content: 'Suppositio personalis communis confusa tantum est acceptio termini communis pro re particulari confusa tantum.'
    },
    'b10': {
        latin: 'Mobilis',
        english: 'Mobile',
        content: 'Movable and distributive supposition is the subtype of confused supposition in which the common term stands for each of its many bearers conjunctively, in a way that licenses “descent” to any particular you choose while preserving truth. When supposition is movable and distributive, a universally quantified statement commits you to every individual in the class, so that from the general claim you can infer a whole series of singular instances. The “movable” label signals that you can move from the universal to these particulars; “distributive” signals that the property in question is distributed across them.'
    },
    'b11': {
        latin: 'Immobilis',
        english: 'Immobile',
        content: 'Immovable supposition, also called merely confused supposition, is the contrasting subtype in which a common term still stands for all the individuals in its extension, but only disjunctively, so that descent to particular instances does not preserve the original truth conditions. The proposition treats the term’s many bearers as an undivided totality or range, and carving out one of them on its own can distort the logical shape of what is being asserted. In such cases, the term’s supposition is “confused” because it ranges over many, but “immovable” because you cannot safely move from the general statement to parallel singular ones.'
    },
    'b12': {
        latin: 'Appellatio',
        english: 'Appellation',
        content: 'Appellatio est acceptio termini pro re existente.'
    },
    'b13': {
        latin: 'Relativa',
        english: 'Relative',
        content: 'Appellatio relativa est acceptio termini pro re ad quam refertur.'
    },
    'b14': {
        latin: 'Naturalis',
        english: 'Natural',
        content: 'Natural supposition is the default way a common term stands for the things it is naturally suited to signify, without any special restriction or extra device. When a term has natural supposition, it ranges over all the individuals that fall under its ordinary signification, and it can do so across times: past, present, and future. This is the “maximal” extension of the term, driven purely by what it means, not by extra temporal and modal operators. Natural supposition therefore describes how a bare common term would stand for its kind if nothing else in the sentence narrowed its reach.'
    },
    'b15': {
        latin: 'Consuetudinaria',
        english: 'Customary',
        content: 'Appellatio consuetudinaria est acceptio termini pro re secundum consuetudinem.'
    },
    'b16': {
        latin: 'Accidentalis',
        english: 'Accidental',
        content: 'Accidental supposition arises when a common term’s natural reach is narrowed, expanded, or otherwise modified by something “accidental” to it in the sentence, often a syncategorematic word like “present,” “future,” or a quantifier. Instead of standing for everything it could naturally signify, the term now stands only for a designated subset (or specially marked portion) of its extension, where that restriction comes from how the whole proposition is built. In this way, accidental supposition makes clear that terms do not supposit in a vacuum: what they stand for is shaped by temporal, modal, and logical structure.'
    }
};

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const gridContainer = document.getElementById('grid-container');
const alphaContent = document.getElementById('alphaContent');
const leafList = document.getElementById('leafList');

const gridSize = 20;
const grid = [];
const termLocations = {
    'b1': [10, 8],
    'b2': [6, 4],
    'b3': [10, 4],
    'b4': [14, 4],
    'b5': [4, 12],
    'b6': [8, 12],
    'b7': [12, 12],
    'b8': [16, 12],
    'b9': [14, 16],
    'b10': [18, 16],
    'b11': [2, 16],
    'b12': [10, 18],
    'b13': [6, 2],
    'b14': [10, 2],
    'b15': [14, 2],
    'b16': [18, 2]
};

for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.dataset.index = i;
    gridContainer.appendChild(cell);
    grid.push(cell);
}

function highlightTerm(termId) {
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
        clearHighlights();
        const termId = Object.keys(termLocations).find(key => {
            const [row, col] = termLocations[key];
            return (index === row * gridSize + col) || (index === row * gridSize + col + 1);
        });
        if (termId) {
            highlightTerm(termId);
            alphaContent.textContent = contentDatabase[termId].content;
        } else {
            alphaContent.textContent = '';
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
treeImage.src = 'tree_cropped.jpg';

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
                clearHighlights();
                highlightTerm(item.id);
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

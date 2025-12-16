const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
const elements = {
    distancer: document.getElementById('distancer'),
    highlighter: document.getElementById('highlightElements'),
    guidelines: document.getElementById('guidelines'),
    guidelinesExpanded: document.getElementById('guidelinesExpanded'),
    crosshair: document.getElementById('crosshair'),
    snapHorizontal: document.getElementsByName('snapHorizontal'),
    snapVertical: document.getElementsByName('snapVertical'),
    freezer: document.getElementById('mouseFreeze'),
    pin: document.getElementById('pinButton')
};

// State
const isPinned = new URLSearchParams(window.location.search).get('pinned') === 'true';

// Pin button setup
elements.pin.textContent = isPinned ? '✖' : '🗗';
elements.pin.title = isPinned ? 'Zamknij' : 'Przypnij';

// Helper functions
function getTargetTab() {
    return new Promise((resolve) => {
        if (isPinned) {
            browserAPI.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
                for (const win of windows) {
                    const activeTab = win.tabs.find(tab => tab.active);
                    if (activeTab) return resolve(activeTab);
                }
                resolve(null);
            });
        } else {
            browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                resolve(tabs[0] || null);
            });
        }
    });
}

function sendMessage(tabId, message) {
    return browserAPI.tabs.sendMessage(tabId, message).catch(() => {});
}

function getSnapValues() {
    return {
        snapHorizontal: Array.from(elements.snapHorizontal).find(i => i.checked)?.value || 'left',
        snapVertical: Array.from(elements.snapVertical).find(i => i.checked)?.value || 'top'
    };
}

async function toggleFeature(button, actionPrefix, extraData = {}) {
    const tab = await getTargetTab();
    if (!tab) return;

    const willActivate = !button.classList.contains('active');
    button.classList.toggle('active', willActivate);

    const action = willActivate ? `${actionPrefix}:active` : `${actionPrefix}:deactive`;
    await sendMessage(tab.id, { action, ...extraData });
}

function syncFeatureState(button, actionPrefix, onSync = null) {
    getTargetTab().then((tab) => {
        if (!tab) {
            button.classList.remove('active');
            onSync?.(false);
            return;
        }

        browserAPI.tabs.sendMessage(tab.id, { action: `${actionPrefix}:status` }, (response) => {
            if (browserAPI.runtime.lastError || !response) {
                button.classList.remove('active');
                onSync?.(false);
                return;
            }
            const active = !!response.active;
            button.classList.toggle('active', active);
            onSync?.(active);
        });
    });
}

// Event Listeners
elements.pin.addEventListener('click', () => {
    if (isPinned) {
        window.close();
    } else {
        browserAPI.windows.create({
            url: browserAPI.runtime.getURL('src/popup/popup.html?pinned=true'),
            type: 'popup',
            width: 300,
            height: 400,
            focused: true
        });
        window.close();
    }
});

elements.freezer.addEventListener('click', async () => {
    const tab = await getTargetTab();
    if (!tab) return;

    elements.freezer.classList.toggle('active');
    await sendMessage(tab.id, { action: 'mouseFreeze:toggle' });
});

elements.highlighter.addEventListener('click', () => {
    void toggleFeature(elements.highlighter, 'highlighter');
});

elements.distancer.addEventListener('click', () => {
    void toggleFeature(elements.distancer, 'distancer');
});

elements.guidelines.addEventListener('click', async () => {
    const tab = await getTargetTab();
    if (!tab) return;

    const willActivate = !elements.guidelines.classList.contains('active');
    elements.guidelines.classList.toggle('active', willActivate);
    elements.guidelinesExpanded.classList.toggle('visible', willActivate);

    const action = willActivate ? 'guidelines:active' : 'guidelines:deactive';
    await sendMessage(tab.id, { action });
});

elements.crosshair.addEventListener('click', () => {
    void toggleFeature(elements.crosshair, 'crosshair', getSnapValues());
});

// Snap settings listeners
const handleSnapChange = async () => {
    if (!elements.crosshair.classList.contains('active')) return;

    const tab = await getTargetTab();
    if (!tab) return;

    await sendMessage(tab.id, { action: 'crosshair:updateSnap', ...getSnapValues() });
};

[...elements.snapHorizontal, ...elements.snapVertical].forEach(input => {
    input.addEventListener('change', handleSnapChange);
});

// Initialize state sync
(function initSync() {
    syncFeatureState(elements.highlighter, 'highlighter');
    syncFeatureState(elements.distancer, 'distancer');
    syncFeatureState(elements.freezer, 'mouseFreeze');
    syncFeatureState(elements.crosshair, 'crosshair');
    syncFeatureState(elements.guidelines, 'guidelines', (active) => {
        elements.guidelinesExpanded.classList.toggle('visible', active);
    });
})();

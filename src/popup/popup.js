const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
// buttons references
const distancerBtn = document.getElementById('distancer');
const highlighterBtn = document.getElementById('highlightElements');
const pinButton = document.getElementById('pinButton');

const isPinned = new URLSearchParams(window.location.search).get('pinned') === 'true';

if (isPinned) {
    pinButton.textContent = '✖';
    pinButton.title = 'Zamknij';
} else {
    pinButton.textContent = '🗗';
    pinButton.title = 'Przypnij';
}

pinButton.addEventListener('click', function () {
    if (isPinned) {
        window.close();
    } else {
        browserAPI.windows.create({
            url: browserAPI.runtime.getURL('src/popup/popup.html?pinned=true'),
            type: 'popup',
            width: 350,
            height: 400,
            focused: true
        });
        window.close();
    }
});

// Helper: get target tab (active in current window or last focused tab)
async function getTargetTab() {
    if (isPinned) {
        // When pinned, get the active tab from the last focused normal window
        const windows = await browserAPI.windows.getAll({populate: true, windowTypes: ['normal']});
        for (const win of windows) {
            const activeTab = win.tabs.find(tab => tab.active);
            if (activeTab) return activeTab;
        }
        return null;
    } else {
        // Normal popup: get active tab in current window
        const tabs = await browserAPI.tabs.query({active: true, currentWindow: true});
        return tabs[0] || null;
    }
}

// popup listeners
document.getElementById('mouseFreeze').addEventListener('click', async function () {
    const tab = await getTargetTab();
    if (!tab) return;

    browserAPI.tabs.sendMessage(tab.id, {action: 'mouseFreeze:toggle'}).then();
});

highlighterBtn.addEventListener('click', async function () {
    const tab = await getTargetTab();
    if (!tab) return;

    const willActivate = !highlighterBtn.classList.contains('active');
    highlighterBtn.classList.toggle('active', willActivate);
    browserAPI.tabs.sendMessage(tab.id, {
        action: willActivate ? 'highlighter:active' : 'highlighter:deactive'
    }).then();
});

distancerBtn.addEventListener('click', async function () {
    const tab = await getTargetTab();
    if (!tab) return;

    const willActivate = !distancerBtn.classList.contains('active');
    distancerBtn.classList.toggle('active', willActivate);
    browserAPI.tabs.sendMessage(tab.id, {
        action: willActivate ? 'distancer:active' : 'distancer:deactive'
    }).then();
});

// Sync status from content-script on popup init
syncHighlighterState();
syncDistancerState();

async function syncHighlighterState() {
    const tab = await getTargetTab();
    if (!tab) {
        highlighterBtn.classList.remove('active');
        return;
    }

    browserAPI.tabs.sendMessage(tab.id, {action: 'highlighter:status'}, function (response) {
        if (browserAPI.runtime.lastError || !response) {
            highlighterBtn.classList.remove('active');
            return;
        }
        highlighterBtn.classList.toggle('active', !!response.active);
    });
}

async function syncDistancerState() {
    const tab = await getTargetTab();
    if (!tab) {
        distancerBtn.classList.remove('active');
        return;
    }

    browserAPI.tabs.sendMessage(tab.id, {action: 'distancer:status'}, function (response) {
        if (browserAPI.runtime.lastError || !response) {
            distancerBtn.classList.remove('active');
            return;
        }
        distancerBtn.classList.toggle('active', !!response.active);
    });
}

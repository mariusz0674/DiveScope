const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const distancerBtn = document.getElementById('distancer');
const highlighterBtn = document.getElementById('highlightElements');
const guidelinesBtn = document.getElementById('guidelines');
const guidelinesExpanded = document.getElementById('guidelinesExpanded');
const crosshairBtn = document.getElementById('crosshair');
const snapHorizontalInputs = document.getElementsByName('snapHorizontal');
const snapVerticalInputs = document.getElementsByName('snapVertical');
const freezerBtn = document.getElementById('mouseFreeze');
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
            width: 300,
            height: 280,
            focused: true
        });
        window.close();
    }
});

// Helper: get target tab (active in current window or last focused tab)
function getTargetTab(callback) {
    if (isPinned) {
        // When pinned, get the active tab from the last focused normal window
        browserAPI.windows.getAll({populate: true, windowTypes: ['normal']}, function (windows) {
            for (const win of windows) {
                const activeTab = win.tabs.find(tab => tab.active);
                if (activeTab) {
                    callback(activeTab);
                    return;
                }
            }
            callback(null);
        });
    } else {
        // Normal popup: get active tab in current window
        browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
            callback(tabs[0] || null);
        });
    }
}

// popup listeners
freezerBtn.addEventListener('click', function () {
    getTargetTab(function (tab) {
        if (!tab) return;

        const willActivate = !freezerBtn.classList.contains('active');
        freezerBtn.classList.toggle('active', willActivate);
        browserAPI.tabs.sendMessage(tab.id, {action: 'mouseFreeze:toggle'}).then();
    });
});

highlighterBtn.addEventListener('click', function () {
    getTargetTab(function (tab) {
        if (!tab) return;

        const willActivate = !highlighterBtn.classList.contains('active');
        highlighterBtn.classList.toggle('active', willActivate);
        browserAPI.tabs.sendMessage(tab.id, {
            action: willActivate ? 'highlighter:active' : 'highlighter:deactive'
        }).then();
    });
});


distancerBtn.addEventListener('click', function () {
    getTargetTab(function (tab) {
        if (!tab) return;

        const willActivate = !distancerBtn.classList.contains('active');
        distancerBtn.classList.toggle('active', willActivate);
        browserAPI.tabs.sendMessage(tab.id, {
            action: willActivate ? 'distancer:active' : 'distancer:deactive'
        }).then();
    });
});

guidelinesBtn.addEventListener('click', function () {
    getTargetTab(function (tab) {
        if (!tab) return;

        const willActivate = !guidelinesBtn.classList.contains('active');
        guidelinesBtn.classList.toggle('active', willActivate);
        guidelinesExpanded.classList.toggle('visible', willActivate);

        browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tab.id, {
                action: willActivate ? 'guidelines:active' : 'guidelines:deactive'
            }).then();
        });
    });
});

crosshairBtn.addEventListener('click', function () {
    getTargetTab(function (tab) {
        if (!tab) return;

        const willActivate = !crosshairBtn.classList.contains('active');
        crosshairBtn.classList.toggle('active', willActivate);

        const snapHorizontal = Array.from(snapHorizontalInputs).find(input => input.checked)?.value || 'left';
        const snapVertical = Array.from(snapVerticalInputs).find(input => input.checked)?.value || 'top';

        browserAPI.tabs.query({active: true, currentWindow: true}, function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                action: willActivate ? 'crosshair:active' : 'crosshair:deactive',
                snapHorizontal,
                snapVertical
            }).then();
        });
    });
});

Array.from(snapHorizontalInputs).forEach(input => {
    getTargetTab(function (tab) {
        if (!tab) return;

        input.addEventListener('change', function () {
            if (crosshairBtn.classList.contains('active')) {
                const snapHorizontal = this.value;
                const snapVertical = Array.from(snapVerticalInputs).find(input => input.checked)?.value || 'top';

                browserAPI.tabs.query({active: true, currentWindow: true}, function (tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'crosshair:updateSnap',
                        snapHorizontal,
                        snapVertical
                    }).then();
                });
            }
        });
    });
});

Array.from(snapVerticalInputs).forEach(input => {


    getTargetTab(function (tab) {
        if (!tab) return;

        input.addEventListener('change', function () {
            if (crosshairBtn.classList.contains('active')) {
                const snapHorizontal = Array.from(snapHorizontalInputs).find(input => input.checked)?.value || 'left';
                const snapVertical = this.value;

                browserAPI.tabs.query({active: true, currentWindow: true}, function (tab) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'crosshair:updateSnap',
                        snapHorizontal,
                        snapVertical
                    }).then();
                });
            }
        });
    });
});


// Sync status from content-script on popup init
syncHighlighterState();
syncDistancerState();
syncFreezerState();
syncGuidelinesState();
syncCrosshairState();

function syncHighlighterState() {
    getTargetTab(function (tab) {
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
    });
}

function syncDistancerState() {
    getTargetTab(function (tab) {
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
    });
}

function syncFreezerState() {
    getTargetTab(function (tab) {
        if (!tab) {
            freezerBtn.classList.remove('active');
            return;
        }

        browserAPI.tabs.sendMessage(tab.id, {action: 'mouseFreeze:status'}, function (response) {
            if (browserAPI.runtime.lastError || !response) {
                freezerBtn.classList.remove('active');
                return;
            }
            freezerBtn.classList.toggle('active', !!response.active);
        });
    });
}

function syncGuidelinesState() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'guidelines:status'}, function (response) {
            if (chrome.runtime.lastError || !response) {
                guidelinesBtn.classList.remove('active');
                guidelinesExpanded.classList.remove('visible');
                return;
            }
            guidelinesBtn.classList.toggle('active', !!response.active);
            guidelinesExpanded.classList.toggle('visible', !!response.active);
        });
    });
}

function syncCrosshairState() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'crosshair:status'}, function (response) {
            if (chrome.runtime.lastError || !response) {
                crosshairBtn.classList.remove('active');
                return;
            }
            crosshairBtn.classList.toggle('active', !!response.active);
        });
    });
}

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const distancerBtn = document.getElementById('distancer');
const highlighterBtn = document.getElementById('highlightElements');
const guidelinesBtn = document.getElementById('guidelines');
const guidelinesExpanded = document.getElementById('guidelinesExpanded');
const crosshairBtn = document.getElementById('crosshair');
const snapHorizontalInputs = document.getElementsByName('snapHorizontal');
const snapVerticalInputs = document.getElementsByName('snapVertical');


// popup listeners
document.getElementById('mouseFreeze').addEventListener('click', function () {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        browserAPI.tabs.sendMessage(tabs[0].id, {action: 'mouseFreeze:toggle'}).then();
    });
});


highlighterBtn.addEventListener('click', function () {
    const willActivate = !highlighterBtn.classList.contains('active');
    highlighterBtn.classList.toggle('active', willActivate);
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        browserAPI.tabs.sendMessage(tabs[0].id, {
            action: willActivate ? 'highlighter:active' : 'highlighter:deactive'
        }).then();
    });
});


distancerBtn.addEventListener('click', function () {
    const willActivate = !distancerBtn.classList.contains('active');
    distancerBtn.classList.toggle('active', willActivate);
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        browserAPI.tabs.sendMessage(tabs[0].id, {
            action: willActivate ? 'distancer:active' : 'distancer:deactive'
        }).then();
    });
});

guidelinesBtn.addEventListener('click', function () {
    const willActivate = !guidelinesBtn.classList.contains('active');
    guidelinesBtn.classList.toggle('active', willActivate);
    guidelinesExpanded.classList.toggle('visible', willActivate);

    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: willActivate ? 'guidelines:active' : 'guidelines:deactive'
        }).then();
    });
});

crosshairBtn.addEventListener('click', function () {
    const willActivate = !crosshairBtn.classList.contains('active');
    crosshairBtn.classList.toggle('active', willActivate);

    const snapHorizontal = Array.from(snapHorizontalInputs).find(input => input.checked)?.value || 'left';
    const snapVertical = Array.from(snapVerticalInputs).find(input => input.checked)?.value || 'top';

    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: willActivate ? 'crosshair:active' : 'crosshair:deactive',
            snapHorizontal,
            snapVertical
        }).then();
    });
});

Array.from(snapHorizontalInputs).forEach(input => {
    input.addEventListener('change', function () {
        if (crosshairBtn.classList.contains('active')) {
            const snapHorizontal = this.value;
            const snapVertical = Array.from(snapVerticalInputs).find(input => input.checked)?.value || 'top';

            browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'crosshair:updateSnap',
                    snapHorizontal,
                    snapVertical
                }).then();
            });
        }
    });
});

Array.from(snapVerticalInputs).forEach(input => {
    input.addEventListener('change', function () {
        if (crosshairBtn.classList.contains('active')) {
            const snapHorizontal = Array.from(snapHorizontalInputs).find(input => input.checked)?.value || 'left';
            const snapVertical = this.value;

            browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'crosshair:updateSnap',
                    snapHorizontal,
                    snapVertical
                }).then();
            });
        }
    });
});


// Sync status from content-script on popup init
syncHighlighterState();
syncDistancerState();
syncGuidelinesState();
syncCrosshairState();

function syncHighlighterState() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        browserAPI.tabs.sendMessage(tabs[0].id, {action: 'highlighter:status'}, function (response) {
            if (browserAPI.runtime.lastError || !response) {
                highlighterBtn.classList.remove('active');
                return;
            }
            highlighterBtn.classList.toggle('active', !!response.active);
        });
    });
}

function syncDistancerState() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        browserAPI.tabs.sendMessage(tabs[0].id, {action: 'distancer:status'}, function (response) {
            if (browserAPI.runtime.lastError || !response) {
                distancerBtn.classList.remove('active');
                return;
            }
            distancerBtn.classList.toggle('active', !!response.active);
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

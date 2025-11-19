const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
// buttons references
const distancerBtn = document.getElementById('distancer');
const highlighterBtn = document.getElementById('highlightElements');

// popup listeners
document.getElementById('mouseFreeze').addEventListener('click', function () {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'mouseFreeze:toggle'}).then();
    });
});


highlighterBtn.addEventListener('click', function () {
    const willActivate = !highlighterBtn.classList.contains('active');
    highlighterBtn.classList.toggle('active', willActivate);
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: willActivate ? 'highlighter:active' : 'highlighter:deactive'
        }).then();
    });
});


distancerBtn.addEventListener('click', function () {
    const willActivate = !distancerBtn.classList.contains('active');
    distancerBtn.classList.toggle('active', willActivate);
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: willActivate ? 'distancer:active' : 'distancer:deactive'
        }).then();
    });
});


// Sync status from content-script on popup init
syncHighlighterState();
syncDistancerState();

function syncHighlighterState() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'highlighter:status'}, function (response) {
            if (chrome.runtime.lastError || !response) {
                highlighterBtn.classList.remove('active');
                return;
            }
            highlighterBtn.classList.toggle('active', !!response.active);
        });
    });
}

function syncDistancerState() {
    browserAPI.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'distancer:status'}, function (response) {
            if (chrome.runtime.lastError || !response) {
                distancerBtn.classList.remove('active');
                return;
            }
            distancerBtn.classList.toggle('active', !!response.active);
        });
    });
}







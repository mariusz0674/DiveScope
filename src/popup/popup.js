document.getElementById('highlightElements').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightElements' });
    });
});


document.getElementById('mouseFreeze').addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'mouseFreeze:toggle' }, function (res) {
            // (opcjonalnie) zaktualizuj etykietę przycisku na podstawie res.enabled
            // document.getElementById('event-shield-toggle').textContent = res?.enabled ? 'Shield ON' : 'Shield OFF';
        });
    });
});
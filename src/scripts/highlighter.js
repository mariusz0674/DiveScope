(() => {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    let highlightEnabled = false;
    let tooltipEl = null;
    let overlayContainerEl = null;
    let highlightedChain = [];

    function enableHighlighter() {
        if (highlightEnabled) {
            return;
        }

        tooltipEl = document.createElement('div');
        Object.assign(tooltipEl.style, {
            position: 'fixed',
            padding: '6px 8px',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: '1.35',
            pointerEvents: 'none',
            zIndex: '2147483647',
            transition: 'opacity .12s',
            opacity: '0',
            maxWidth: '80vw',
            whiteSpace: 'normal',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            boxShadow: '0 2px 10px rgba(0,0,0,.3)',
            fontFamily: 'system-ui, Arial, sans-serif',
        });
        document.documentElement.appendChild(tooltipEl);

        overlayContainerEl = document.createElement('div');
        Object.assign(overlayContainerEl.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '2147483646', // Tuż pod tooltipem
            overflow: 'hidden',
        });
        document.documentElement.appendChild(overlayContainerEl);

        document.addEventListener('pointerover', onPointerOver, true);
        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('pointerout', onPointerOut, true);
        document.addEventListener('scroll', onScroll, true);
        highlightEnabled = true;
    }

    function disableHighlighter() {
        if (!highlightEnabled) {
            return;
        }

        document.removeEventListener('pointerover', onPointerOver, true);
        document.removeEventListener('pointermove', onPointerMove, true);
        document.removeEventListener('pointerout', onPointerOut, true);
        document.removeEventListener('scroll', onScroll, true);

        if (tooltipEl?.parentNode) {
            tooltipEl.parentNode.removeChild(tooltipEl);
        }
        if (overlayContainerEl?.parentNode) {
            overlayContainerEl.parentNode.removeChild(overlayContainerEl);
        }

        tooltipEl = null;
        overlayContainerEl = null;
        highlightedChain = [];
        highlightEnabled = false;
    }

    function getElementChain(e) {
        if (e.composedPath) {
            return e.composedPath().filter(node => node instanceof Element);
        }
        return [];
    }

    function onPointerOver(e) {
        if (!highlightEnabled) {
            return;
        }
        const chain = getElementChain(e);
        if (!chain.length || chain.includes(tooltipEl) || chain.includes(overlayContainerEl)) {
            return;
        }

        applyHighlights(chain);
        updateTooltip(e, chain);
    }

    function onPointerMove(e) {
        if (!highlightEnabled) {
            return;
        }
        const chain = getElementChain(e);
        if (!chain.length || chain.includes(tooltipEl) || chain.includes(overlayContainerEl)) {
            return;
        }

        applyHighlights(chain);
        updateTooltip(e, chain);
    }

    function onPointerOut(e) {
        if (!highlightEnabled) {
            return;
        }
        const chain = getElementChain(e);
        if (highlightedChain.length && highlightedChain[0] === chain[0]) {
            clearHighlights();
            if (tooltipEl) tooltipEl.style.opacity = '0';
        }
    }

    // Aktualizacja nakładek przy scrollowaniu
    function onScroll() {
        if (!highlightEnabled || !highlightedChain.length) {
            return;
        }
        drawOverlays(highlightedChain);
    }

    function applyHighlights(chain) {
        highlightedChain = chain;
        drawOverlays(chain);
        if (tooltipEl) tooltipEl.style.opacity = '1';
    }

    function drawOverlays(chain) {
        if (!overlayContainerEl) {
            return;
        }

        overlayContainerEl.innerHTML = '';

        const reversedChain = [...chain].reverse();

        reversedChain.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                return;
            }

            const box = document.createElement('div');
            Object.assign(box.style, {
                position: 'absolute',
                top: `${rect.top}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                boxSizing: 'border-box',
                pointerEvents: 'none',
            });

            const isTarget = (el === chain[0]);

            if (isTarget) {
                Object.assign(box.style, {
                    backgroundColor: 'rgba(0, 81, 255, 0.2)',
                    outline: '3px solid #0051ff',
                    outlineOffset: '-3px',
                    zIndex: '10',
                });
            } else {
                Object.assign(box.style, {
                    outline: '1px dashed #ff004c',
                    outlineOffset: '-1px',
                    zIndex: '1',
                });
            }

            overlayContainerEl.appendChild(box);
        });
    }

    function clearHighlights() {
        highlightedChain = [];
        if (overlayContainerEl) overlayContainerEl.innerHTML = '';
    }

    function updateTooltip(e, chain) {
        if (!tooltipEl || !chain || !chain.length) {
            return;
        }

        const dims = chain.map(cur => {
            const r = cur.getBoundingClientRect();
            return `${cur.tagName.toLowerCase()}:${Math.round(r.width)}x${Math.round(r.height)}`;
        });
        tooltipEl.textContent = dims.join(', ');

        const off = 14;
        let x = e.clientX + off;
        let y = e.clientY + off;

        const vw = innerWidth, vh = innerHeight;
        const box = tooltipEl.getBoundingClientRect();
        if (x + box.width + 8 > vw) {
            x = Math.max(8, vw - box.width - 8);
        }
        if (y + box.height + 8 > vh) {
            y = Math.max(8, vh - box.height - 8);
        }

        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
    }

    browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'highlighter:active') {
            enableHighlighter();
        } else if (request.action === 'highlighter:deactive') {
            disableHighlighter();
        } else if (request.action === 'highlighter:status') {
            sendResponse?.({ok: true, active: highlightEnabled});
        }
    });
})();
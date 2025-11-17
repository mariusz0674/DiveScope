(() => {
    let highlightEnabled = false;
    let tooltipEl = null;
    let highlightedChain = [];
    const prevStyles = new WeakMap();

    function enableHighlighter() {
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

        document.addEventListener('pointerover', onPointerOver, true);
        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('pointerout', onPointerOut, true);
        highlightEnabled = true;
    }

    function disableHighlighter() {
        clearHighlights();
        document.removeEventListener('pointerover', onPointerOver, true);
        document.removeEventListener('pointermove', onPointerMove, true);
        document.removeEventListener('pointerout', onPointerOut, true);
        if (tooltipEl?.parentNode) {
            tooltipEl.parentNode.removeChild(tooltipEl);
        }
        tooltipEl = null;
        highlightEnabled = false;
    }

    function onPointerOver(e) {
        if (!highlightEnabled) {
            return;
        }
        if (e.target === tooltipEl) {
            return;
        }
        applyHighlights(e.target);
        updateTooltip(e);
    }

    function onPointerMove(e) {
        if (!highlightEnabled) {
            return;
        }
        if (!highlightedChain.length) {
            applyHighlights(e.target);
        }
        updateTooltip(e);
    }

    function onPointerOut(e) {
        if (!highlightEnabled) {
            return;
        }
        if (highlightedChain.length && highlightedChain[0] === e.target) {
            clearHighlights();
            if (tooltipEl) tooltipEl.style.opacity = '0';
        }
    }

    function applyHighlights(target) {
        if (!(target instanceof Element)) {
            return;
        }

        const chain = [];
        let cur = target;
        while (cur && cur.nodeType === 1) {
            chain.push(cur);
            if (cur === document.documentElement) break;
            cur = cur.parentElement;
        }

        if (arraysShallowEqual(chain, highlightedChain)) return;

        clearHighlights();

        chain.forEach((el, idx) => {
            if (!prevStyles.has(el)) {
                prevStyles.set(el, {
                    outline: el.style.outline,
                    outlineOffset: el.style.outlineOffset,
                    backgroundColor: el.style.backgroundColor,
                });
            }
            if (idx === 0) {
                el.style.setProperty('outline', '3px solid blue', 'important');
                el.style.setProperty('outline-offset', '-1px', 'important');
                el.style.setProperty('background-color', 'rgba(0,0,255,.08)', 'important');
            } else {
                el.style.setProperty('outline', '1px dashed red', 'important');
                el.style.setProperty('outline-offset', '-1px', 'important');
            }
        });

        highlightedChain = chain;
        if (tooltipEl) {
            tooltipEl.style.opacity = '1';
        }
    }

    function clearHighlights() {
        if (!highlightedChain.length) {
            return;
        }
        highlightedChain.forEach((el) => {
            const prev = prevStyles.get(el);
            if (prev) {
                el.style.outline = prev.outline || '';
                el.style.outlineOffset = prev.outlineOffset || '';
                el.style.backgroundColor = prev.backgroundColor || '';
                prevStyles.delete(el);
            } else {
                el.style.removeProperty('outline');
                el.style.removeProperty('outline-offset');
                el.style.removeProperty('background-color');
            }
        });
        highlightedChain = [];
    }

    function arraysShallowEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    function updateTooltip(e) {
        if (!tooltipEl || !(e.target instanceof Element)) {
            return;
        }

        const dims = [];
        let cur = e.target;
        while (cur && cur.nodeType === 1) {
            const r = cur.getBoundingClientRect();
            dims.push(`${cur.tagName.toLowerCase()}:${Math.round(r.width)}x${Math.round(r.height)}`);
            if (cur === document.documentElement) {
                break;
            }
            cur = cur.parentElement;
        }
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

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'highlighter:active') {
            enableHighlighter();
        } else if (request.action === 'highlighter:deactive') {
            disableHighlighter();
        } else if (request.action === 'highlighter:status') {
            sendResponse?.({ok: true, active: highlightEnabled});
        }
    });
})();
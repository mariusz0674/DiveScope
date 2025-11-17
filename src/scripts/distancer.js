(() => {
    let measureEnabled = false;
    let baseElement = null;
    let hoverElement = null;
    let targetElement = null;

    let tooltipEl = null;
    let lineXEl = null;
    let lineYEl = null;
    let cursorStyleEl = null;
    let highlightStyleEl = null;

    function enableMeasurer() {
        if (measureEnabled) {
            return;
        }
        measureEnabled = true;

        injectHighlightStyles();
        createUI();
        applyCursorOverride();

        document.addEventListener('click', onClick, true);
        document.addEventListener('pointerdown', swallowEvent, true);
        document.addEventListener('mousedown', swallowEvent, true);
        document.addEventListener('mouseup', swallowEvent, true);

        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('keydown', onKeyDown, true);
    }

    function disableMeasurer() {
        if (!measureEnabled) {
            return;
        }
        measureEnabled = false;

        clearBase();
        clearTarget();
        clearHover();
        destroyUI();
        removeCursorOverride();
        removeHighlightStyles();

        document.removeEventListener('click', onClick, true);
        document.removeEventListener('pointerdown', swallowEvent, true);
        document.removeEventListener('mousedown', swallowEvent, true);
        document.removeEventListener('mouseup', swallowEvent, true);

        document.removeEventListener('pointermove', onPointerMove, true);
        document.removeEventListener('keydown', onKeyDown, true);
    }

    function injectHighlightStyles() {
        if (highlightStyleEl) {
            return;
        }
        highlightStyleEl = document.createElement('style');
        highlightStyleEl.textContent = `
            .distancer-base {
                outline: 2px solid #00c853 !important;
                outline-offset: -1px !important;
            }
            .distancer-target {
                outline: 2px solid #ffab00 !important;
                outline-offset: -1px !important;
            }
            .distancer-hover {
                outline: 1px dashed #42a5f5 !important;
                outline-offset: -1px !important;
            }
        `;
        document.head.appendChild(highlightStyleEl);
    }

    function removeHighlightStyles() {
        if (highlightStyleEl?.parentNode) {
            highlightStyleEl.parentNode.removeChild(highlightStyleEl);
        }
        highlightStyleEl = null;
    }

    function createUI() {
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            Object.assign(tooltipEl.style, {
                position: 'fixed',
                padding: '6px 8px',
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.3',
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
        }
        if (!lineXEl) {
            lineXEl = document.createElement('div');
            Object.assign(lineXEl.style, {
                position: 'fixed',
                height: '1px',
                borderTop: '1px dashed #00e5ff',
                zIndex: '2147483647',
                pointerEvents: 'none',
            });
            document.documentElement.appendChild(lineXEl);
        }
        if (!lineYEl) {
            lineYEl = document.createElement('div');
            Object.assign(lineYEl.style, {
                position: 'fixed',
                width: '1px',
                borderLeft: '1px dashed #ffab00',
                zIndex: '2147483647',
                pointerEvents: 'none',
            });
            document.documentElement.appendChild(lineYEl);
        }
    }

    function destroyUI() {
        if (tooltipEl?.parentNode) {
            tooltipEl.parentNode.removeChild(tooltipEl);
        }
        if (lineXEl?.parentNode) {
            lineXEl.parentNode.removeChild(lineXEl);
        }
        if (lineYEl?.parentNode) {
            lineYEl.parentNode.removeChild(lineYEl);
        }
        tooltipEl = null;
        lineXEl = null;
        lineYEl = null;
    }

    function applyCursorOverride() {
        if (cursorStyleEl) {
            return;
        }
        cursorStyleEl = document.createElement('style');
        cursorStyleEl.textContent = `* { cursor: default !important; }`;
        document.head.appendChild(cursorStyleEl);
    }

    function removeCursorOverride() {
        if (cursorStyleEl?.parentNode) {
            cursorStyleEl.parentNode.removeChild(cursorStyleEl);
        }
        cursorStyleEl = null;
    }

    // Blokujemy normalne zachowanie kliknięć (buttons, links itd.)
    function swallowEvent(e) {
        if (!measureEnabled) {
            return;
        }
        if (isUiElement(e.target)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    function onClick(e) {
        if (!measureEnabled) {
            return;
        }
        if (!(e.target instanceof Element)) {
            return;
        }
        if (isUiElement(e.target)) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        setBaseElement(e.target);
    }

    function onPointerMove(e) {
        if (!measureEnabled) {
            return;
        }
        if (!(e.target instanceof Element)) {
            return;
        }

        const isUi = isUiElement(e.target);

        if (isUi) {
            if (baseElement) {
                updateTooltipPosition(e.clientX, e.clientY);
            }
            return;
        }

        if (!baseElement) {
            setHoverElement(e.target);
            return;
        }

        if (!tooltipEl || !lineXEl || !lineYEl) return;

        const target = e.target;
        updateMeasurement(target, e.clientX, e.clientY);
    }

    function onKeyDown(e) {
        if (!measureEnabled) {
            return;
        }
        if (e.key === 'Escape') {
            clearBase();
            clearTarget();
            clearHover();
        }
    }

    function isUiElement(el) {
        return el === tooltipEl || el === lineXEl || el === lineYEl;
    }

    // BASE (zielony)
    function setBaseElement(el) {
        clearBase();
        clearTarget();
        clearHover();

        baseElement = el;
        baseElement.classList.add('distancer-base');
    }

    function clearBase() {
        if (baseElement) {
            baseElement.classList.remove('distancer-base');
        }
        baseElement = null;

        if (tooltipEl) {
            tooltipEl.style.opacity = '0';
        }
        if (lineXEl) {
            lineXEl.style.width = '0';
        }
        if (lineYEl) {
            lineYEl.style.height = '0';
        }
    }

    // HOVER preview (niebieski)
    function setHoverElement(el) {
        if (el === baseElement || el === targetElement) {
            clearHover();
            return;
        }
        if (el === hoverElement) return;

        clearHover();
        hoverElement = el;
        hoverElement.classList.add('distancer-hover');
    }

    function clearHover() {
        if (hoverElement) {
            hoverElement.classList.remove('distancer-hover');
        }
        hoverElement = null;
    }

    // TARGET (pomarańczowy)
    function setTargetElement(el) {
        if (el === baseElement) {
            clearTarget();
            return;
        }
        if (el === targetElement) return;

        clearTarget();
        targetElement = el;
        targetElement.classList.add('distancer-target');
    }

    function clearTarget() {
        if (targetElement) {
            targetElement.classList.remove('distancer-target');
        }
        targetElement = null;
    }

    function updateMeasurement(target, mouseX, mouseY) {
        if (!baseElement) return;

        setTargetElement(target);

        const a = baseElement.getBoundingClientRect();
        const b = target.getBoundingClientRect();

        // dystans poziomy – minimalna odległość między prostokątami po osi X
        let dx;
        let dxDir = '';
        if (b.left > a.right) {
            dx = Math.round(b.left - a.right);
            dxDir = '→';
        } else if (a.left > b.right) {
            dx = Math.round(a.left - b.right);
            dxDir = '←';
        } else {
            dx = 0;
            dxDir = 'overlap';
        }

        // dystans pionowy – minimalna odległość między prostokątami po osi Y
        let dy;
        let dyDir = '';
        if (b.top > a.bottom) {
            dy = Math.round(b.top - a.bottom);
            dyDir = '↓';
        } else if (a.top > b.bottom) {
            dy = Math.round(a.top - b.bottom);
            dyDir = '↑';
        } else {
            dy = 0;
            dyDir = 'overlap';
        }

        // Środki elementów
        const centerAx = Math.round(a.left + a.width / 2);
        const centerAy = Math.round(a.top + a.height / 2);
        const centerBx = Math.round(b.left + b.width / 2);
        const centerBy = Math.round(b.top + b.height / 2);
        const centerDx = centerBx - centerAx;
        const centerDy = centerBy - centerAy;

        // Wymiary – nawet przy parent/child / overlap
        const baseSize = `${Math.round(a.width)}x${Math.round(a.height)} px`;
        const targetSize = `${Math.round(b.width)}x${Math.round(b.height)} px`;

        if (tooltipEl) {
            const baseLabel = describeElement(baseElement);
            const targetLabel = describeElement(target);

            tooltipEl.innerHTML = [
                `<div><b>Base:</b> ${baseLabel} <span style="opacity:.8;">(${baseSize})</span></div>`,
                `<div><b>Target:</b> ${targetLabel} <span style="opacity:.8;">(${targetSize})</span></div>`,
                `<div style="margin-top:4px;">`,
                `H (edge→edge): <b>${dx}</b> px <span style="opacity:.8;">(${dxDir})</span><br>`,
                `V (edge→edge): <b>${dy}</b> px <span style="opacity:.8;">(${dyDir})</span><br>`,
                `<span style="opacity:.8;">Δ center: x=${centerDx} px, y=${centerDy} px</span>`,
                `</div>`
            ].join('');
            tooltipEl.style.opacity = '1';
            updateTooltipPosition(mouseX, mouseY);
        }

        updateLines(a, b);
    }

    function describeElement(el) {
        if (!el) {
            return 'null';
        }
        if (!(el instanceof Element)) {
            return String(el);
        }
        let s = el.tagName.toLowerCase();
        if (el.id) s += `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
            const classes = el.className.trim().split(/\s+/).filter(Boolean);
            if (classes.length) s += '.' + classes.join('.');
        }
        return s;
    }

    function updateTooltipPosition(x, y) {
        if (!tooltipEl) {
            return;
        }
        const off = 14;
        let px = x + off;
        let py = y + off;
        const vw = innerWidth, vh = innerHeight;
        const box = tooltipEl.getBoundingClientRect();
        if (px + box.width + 8 > vw) px = Math.max(8, vw - box.width - 8);
        if (py + box.height + 8 > vh) py = Math.max(8, vh - box.height - 8);
        tooltipEl.style.left = `${px}px`;
        tooltipEl.style.top = `${py}px`;
    }

    function updateLines(a, b) {
        if (!lineXEl || !lineYEl) {
            return;
        }

        const top = Math.round(Math.max(a.top, b.top, 0));
        const bottom = Math.round(Math.min(a.bottom, b.bottom, innerHeight));
        const yMid = (top + bottom) / 2;

        const left = Math.round(Math.min(a.right, b.right));
        const right = Math.round(Math.max(a.left, b.left));

        lineXEl.style.top = `${yMid}px`;
        lineXEl.style.left = `${left}px`;
        lineXEl.style.width = `${Math.max(0, right - left)}px`;

        const l = Math.round(Math.max(a.left, b.left, 0));
        const r = Math.round(Math.min(a.right, b.right, innerWidth));
        const xMid = (l + r) / 2;

        const t = Math.round(Math.min(a.bottom, b.bottom));
        const bt = Math.round(Math.max(a.top, b.top));

        lineYEl.style.left = `${xMid}px`;
        lineYEl.style.top = `${t}px`;
        lineYEl.style.height = `${Math.max(0, bt - t)}px`;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'distancer:active') {
            enableMeasurer();
        } else if (request.action === 'distancer:deactive') {
            disableMeasurer();
        } else if (request.action === 'distancer:status') {
            sendResponse?.({ok: true, active: measureEnabled});
        }
    });
})();

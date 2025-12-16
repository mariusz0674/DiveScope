(() => {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    let on = false;
    const offFns = [];
    const ENABLE_DELAY_MS = 2000;
    const SNAPSHOT_ATTR = 'data-frozen-style';

    const BLOCK_EVENTS = [
        'pointerdown','pointerup','pointermove','pointerenter','pointerleave','pointercancel',
        'mousedown','mouseup','mouseenter','mouseleave','mousemove','mouseover','mouseout',
        'click','dblclick','contextmenu','wheel','keydown','keyup','keypress',
        'dragstart','drag','dragend','dragenter','dragleave','dragover','drop'
    ];
    const PAGE_EVENTS = ['visibilitychange', 'pagehide', 'blur', 'focusout', 'resize', 'scroll'];

    function freezeVisualState() {
        document.getAnimations().forEach(anim => {
            try { anim.pause(); } catch(e){}
        });

        const allElements = document.querySelectorAll('*');

        const propsToFreeze = [
            'display',
            'visibility',
            'opacity',
            'transform',
            'position',
            'top', 'left', 'right', 'bottom',
            'width', 'height',
            'z-index'
        ];

        allElements.forEach(el => {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') {
                return;
            }

            const currentStyleAttr = el.getAttribute('style');
            el.setAttribute(SNAPSHOT_ATTR, currentStyleAttr || '');

            const computed = window.getComputedStyle(el);

            let newStyle = currentStyleAttr ? (currentStyleAttr + '; ') : '';

            propsToFreeze.forEach(prop => {
                const val = computed.getPropertyValue(prop);
                newStyle += `${prop}: ${val} !important; `;
            });

            newStyle += `transition: none !important; animation: none !important; pointer-events: auto !important;`;

            el.setAttribute('style', newStyle);
        });
    }

    function unfreezeVisualState() {
        document.getAnimations().forEach(anim => {
            try { anim.play(); } catch(e){}
        });

        const frozenElements = document.querySelectorAll(`[${SNAPSHOT_ATTR}]`);
        frozenElements.forEach(el => {
            const originalStyle = el.getAttribute(SNAPSHOT_ATTR);
            if (originalStyle === '') {
                el.removeAttribute('style');
            } else {
                el.setAttribute('style', originalStyle);
            }
            el.removeAttribute(SNAPSHOT_ATTR);
        });
    }

    function addCapture(type, handler) {
        const options = { capture: true, passive: false };
        window.addEventListener(type, handler, options);
        document.addEventListener(type, handler, options);
        document.documentElement.addEventListener(type, handler, options);

        offFns.push(() => {
            window.removeEventListener(type, handler, true);
            document.removeEventListener(type, handler, true);
            document.documentElement.removeEventListener(type, handler, true);
        });
    }

    function blockEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    function enable() {
        if (on) return;

        freezeVisualState();

        on = true;

        BLOCK_EVENTS.forEach(ev => addCapture(ev, blockEvent));
        PAGE_EVENTS.forEach(ev => addCapture(ev, blockEvent));
    }

    function disable() {
        if (!on) return;

        on = false;
        while (offFns.length) offFns.pop()();

        unfreezeVisualState();
    }

    browserAPI.runtime.onMessage.addListener((req, sender, sendResponse) => {
        if (req?.action === 'mouseFreeze:toggle') {
            if (!on) {
                setTimeout(enable, ENABLE_DELAY_MS);
            } else {
                disable();
            }
        }
        else if (req?.action === 'mouseFreeze:status') {
            sendResponse({ active: on });
        }

        return true;
    });
})();

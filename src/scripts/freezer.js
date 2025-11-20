(() => {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    let on = false;
    const offFns = [];
    let banner = null;
    let labelEl = null;
    const ENABLE_DELAY_MS = 2000;

    const MOUSE_EVENTS = [
        'pointerdown','pointerup','pointermove','pointerenter','pointerleave','pointercancel',
        'mousedown','mouseup','mouseenter','mouseleave','mousemove','mouseover','mouseout',
        'click','dblclick','auxclick','contextmenu',
        'dragstart','drag','dragend','dragenter','dragleave','dragover','drop'
    ];
    const PAGE_EVENTS = ['visibilitychange', 'pagehide', 'blur', 'focusout'];

    function addCapture(type, handler) {
        window.addEventListener(type, handler, { capture: true, passive: false });
        document.addEventListener(type, handler, { capture: true, passive: false });
        document.documentElement.addEventListener(type, handler, { capture: true, passive: false });
        offFns.push(() => {
            window.removeEventListener(type, handler, true);
            document.removeEventListener(type, handler, true);
            document.documentElement.removeEventListener(type, handler, true);
        });
    }

    function makeBanner(waiting = false) {
        if (banner) {
            return banner;
        }
        banner = document.createElement('div');
        banner.id = '__mouse_freezer_banner__';
        Object.assign(banner.style, {
            position: 'fixed',
            left: '8px',
            top: '8px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '6px 8px',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            borderRadius: '8px',
            fontFamily: 'system-ui, Arial, sans-serif',
            fontSize: '12px',
            zIndex: '2147483647',
            boxShadow: '0 2px 10px rgba(0,0,0,.3)',
            pointerEvents: 'auto'
        });
        const dot = document.createElement('span');
        Object.assign(dot.style, { width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4d', display: 'inline-block' });
        labelEl = document.createElement('span');                         // <—
        labelEl.textContent = 'Mouse Freeze: ' + (waiting ? 'waiting' : (on ? 'ON' : 'OFF'));
        const btn = document.createElement('button');
        btn.textContent = 'Unfreeze';
        Object.assign(btn.style, {
            border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
            background: '#fff', color: '#000', fontSize: '12px'
        });
        btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); disable(); });
        banner.append(dot, labelEl, btn);
        document.documentElement.appendChild(banner);
        return banner;
    }

    function removeBanner() {
        if (banner?.parentNode) {
            banner.parentNode.removeChild(banner);
        }
        banner = null;
        labelEl = null;
    }

    function isInsideBanner(target) {
        return banner && (target === banner || banner.contains(target));
    }

    function blockMouse(e) {
        const t = e.composedPath ? e.composedPath()[0] : e.target;
        if (isInsideBanner(t)) return;
        try { e.preventDefault(); } catch {}
        try { e.stopImmediatePropagation(); } catch {}
        try { e.stopPropagation(); } catch {}
    }

    function blockPageEvent(e) {
        try { e.preventDefault(); } catch {}
        try { e.stopImmediatePropagation(); } catch {}
        try { e.stopPropagation(); } catch {}
    }

    function enable() {
        if (on) {
            return;
        }
        on = true;

        MOUSE_EVENTS.forEach(ev => addCapture(ev, blockMouse));
        PAGE_EVENTS.forEach(ev => addCapture(ev, blockPageEvent));

        if (!banner) {
            makeBanner(false);
        }
        if (labelEl) {
            labelEl.textContent = 'Mouse Freeze: ON';
        }
    }

    function disable() {
        if (!on && !banner) {
            return;
        }
        on = false;
        while (offFns.length) offFns.pop()();
        removeBanner();
    }

    browserAPI.runtime.onMessage.addListener((req) => {
        if (req?.action === 'mouseFreeze:toggle') {
            if (!on) {
                makeBanner(true);
                setTimeout(enable, ENABLE_DELAY_MS);
            } else {
                disable();
            }
        } else if (req?.action === 'mouseFreeze:on') {
            makeBanner(true);
            setTimeout(enable, ENABLE_DELAY_MS);
        } else if (req?.action === 'mouseFreeze:off') {
            disable();
        }
    });
})();
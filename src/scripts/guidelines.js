(() => {
    let guidelinesEnabled = false;
    let crosshairEnabled = false;
    let horizontalLine = null;
    let verticalLine = null;
    let isDraggingHorizontal = false;
    let isDraggingVertical = false;
    let tooltip = null;
    let snapHorizontal = 'left';
    let snapVertical = 'top';
    let hoveredElement = null;
    let highlightOverlay = null;
    let distanceLineHorizontal = null;
    let distanceLineVertical = null;
    let horizontalDistanceLabel = null;
    let verticalDistanceLabel = null;

    function createGuidelines() {
        if (horizontalLine || verticalLine) return;

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        horizontalLine = document.createElement('div');
        horizontalLine.id = 'divescope-horizontal-guideline';
        Object.assign(horizontalLine.style, {
            position: 'fixed',
            left: '0',
            top: `${viewportHeight / 2}px`,
            width: '100%',
            height: '1px',
            backgroundColor: '#3fb950',
            boxShadow: '0 0 0 1px rgba(63, 185, 80, 0.3), 0 0 10px rgba(63, 185, 80, 0.5)',
            zIndex: '999998',
            cursor: 'ns-resize',
            pointerEvents: 'auto'
        });

        verticalLine = document.createElement('div');
        verticalLine.id = 'divescope-vertical-guideline';
        Object.assign(verticalLine.style, {
            position: 'fixed',
            left: `${viewportWidth / 2}px`,
            top: '0',
            width: '1px',
            height: '100%',
            backgroundColor: '#3fb950',
            boxShadow: '0 0 0 1px rgba(63, 185, 80, 0.3), 0 0 10px rgba(63, 185, 80, 0.5)',
            zIndex: '999998',
            cursor: 'ew-resize',
            pointerEvents: 'auto'
        });

        tooltip = document.createElement('div');
        tooltip.id = 'divescope-guideline-tooltip';
        Object.assign(tooltip.style, {
            position: 'fixed',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            fontSize: '11px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: '999999',
            display: 'none',
            whiteSpace: 'nowrap'
        });

        document.body.appendChild(horizontalLine);
        document.body.appendChild(verticalLine);
        document.body.appendChild(tooltip);

        horizontalDistanceLabel = document.createElement('div');
        horizontalDistanceLabel.id = 'divescope-horizontal-distance-label';
        Object.assign(horizontalDistanceLabel.style, {
            position: 'fixed',
            padding: '2px 6px',
            backgroundColor: '#f59e0b',
            color: '#000',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            borderRadius: '3px',
            pointerEvents: 'none',
            zIndex: '999999',
            display: 'none',
            whiteSpace: 'nowrap'
        });
        document.body.appendChild(horizontalDistanceLabel);

        verticalDistanceLabel = document.createElement('div');
        verticalDistanceLabel.id = 'divescope-vertical-distance-label';
        Object.assign(verticalDistanceLabel.style, {
            position: 'fixed',
            padding: '2px 6px',
            backgroundColor: '#f59e0b',
            color: '#000',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            borderRadius: '3px',
            pointerEvents: 'none',
            zIndex: '999999',
            display: 'none',
            whiteSpace: 'nowrap'
        });
        document.body.appendChild(verticalDistanceLabel);

        distanceLineHorizontal = document.createElement('div');
        distanceLineHorizontal.id = 'divescope-distance-horizontal-main';
        Object.assign(distanceLineHorizontal.style, {
            position: 'fixed',
            backgroundColor: '#f59e0b',
            pointerEvents: 'none',
            zIndex: '999996',
            display: 'none'
        });
        document.body.appendChild(distanceLineHorizontal);

        distanceLineVertical = document.createElement('div');
        distanceLineVertical.id = 'divescope-distance-vertical-main';
        Object.assign(distanceLineVertical.style, {
            position: 'fixed',
            backgroundColor: '#f59e0b',
            pointerEvents: 'none',
            zIndex: '999996',
            display: 'none'
        });
        document.body.appendChild(distanceLineVertical);

        document.addEventListener('mousemove', onDocumentMouseMove);

        addHorizontalLineHandlers();
        addVerticalLineHandlers();
    }

    function addHorizontalLineHandlers() {
        let startY = 0;
        let startTop = 0;

        const onMouseDown = (e) => {
            e.preventDefault();
            isDraggingHorizontal = true;
            startY = e.clientY;
            startTop = parseInt(horizontalLine.style.top);

            horizontalLine.style.height = '3px';
            horizontalLine.style.backgroundColor = '#1f6feb';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDraggingHorizontal) return;

            const deltaY = e.clientY - startY;
            const newTop = Math.max(0, Math.min(window.innerHeight, startTop + deltaY));

            horizontalLine.style.top = `${newTop}px`;

            tooltip.textContent = `Y: ${Math.round(newTop)}px`;
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        };

        const onMouseUp = () => {
            isDraggingHorizontal = false;
            horizontalLine.style.height = '1px';
            horizontalLine.style.backgroundColor = '#3fb950';
            tooltip.style.display = 'none';

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        horizontalLine.addEventListener('mousedown', onMouseDown);

        horizontalLine.addEventListener('mouseenter', () => {
            if (!isDraggingHorizontal) {
                horizontalLine.style.height = '2px';
            }
        });

        horizontalLine.addEventListener('mouseleave', () => {
            if (!isDraggingHorizontal) {
                horizontalLine.style.height = '1px';
            }
        });
    }

    function addVerticalLineHandlers() {
        let startX = 0;
        let startLeft = 0;

        const onMouseDown = (e) => {
            e.preventDefault();
            isDraggingVertical = true;
            startX = e.clientX;
            startLeft = parseInt(verticalLine.style.left);

            verticalLine.style.width = '3px';
            verticalLine.style.backgroundColor = '#1f6feb';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDraggingVertical) return;

            const deltaX = e.clientX - startX;
            const newLeft = Math.max(0, Math.min(window.innerWidth, startLeft + deltaX));

            verticalLine.style.left = `${newLeft}px`;

            tooltip.textContent = `X: ${Math.round(newLeft)}px`;
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        };

        const onMouseUp = () => {
            isDraggingVertical = false;
            verticalLine.style.width = '1px';
            verticalLine.style.backgroundColor = '#3fb950';
            tooltip.style.display = 'none';

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        verticalLine.addEventListener('mousedown', onMouseDown);

        verticalLine.addEventListener('mouseenter', () => {
            if (!isDraggingVertical) {
                verticalLine.style.width = '2px';
            }
        });

        verticalLine.addEventListener('mouseleave', () => {
            if (!isDraggingVertical) {
                verticalLine.style.width = '1px';
            }
        });
    }

    function removeGuidelines() {
        document.removeEventListener('mousemove', onDocumentMouseMove);

        if (horizontalLine) {
            horizontalLine.remove();
            horizontalLine = null;
        }
        if (verticalLine) {
            verticalLine.remove();
            verticalLine = null;
        }
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
        if (horizontalDistanceLabel) {
            horizontalDistanceLabel.remove();
            horizontalDistanceLabel = null;
        }
        if (verticalDistanceLabel) {
            verticalDistanceLabel.remove();
            verticalDistanceLabel = null;
        }
        if (distanceLineHorizontal) {
            distanceLineHorizontal.remove();
            distanceLineHorizontal = null;
        }
        if (distanceLineVertical) {
            distanceLineVertical.remove();
            distanceLineVertical = null;
        }
        isDraggingHorizontal = false;
        isDraggingVertical = false;
    }

    function onDocumentMouseMove(e) {
        if (isDraggingHorizontal || isDraggingVertical) return;

        const element = document.elementFromPoint(e.clientX, e.clientY);

        if (!element ||
            element === horizontalLine ||
            element === verticalLine ||
            element === tooltip ||
            element === horizontalDistanceLabel ||
            element === verticalDistanceLabel ||
            element === highlightOverlay ||
            element === distanceLineHorizontal ||
            element === distanceLineVertical) {
            if (horizontalDistanceLabel) {
                horizontalDistanceLabel.style.display = 'none';
            }
            if (verticalDistanceLabel) {
                verticalDistanceLabel.style.display = 'none';
            }
            if (distanceLineHorizontal) {
                distanceLineHorizontal.style.display = 'none';
            }
            if (distanceLineVertical) {
                distanceLineVertical.style.display = 'none';
            }
            return;
        }

        const rect = element.getBoundingClientRect();

        if (horizontalLine && verticalLine) {
            const horizontalLineY = parseInt(horizontalLine.style.top);
            const verticalLineX = parseInt(verticalLine.style.left);

            const distanceTop = Math.abs(rect.top - horizontalLineY);
            const distanceBottom = Math.abs(rect.bottom - horizontalLineY);
            const distanceLeft = Math.abs(rect.left - verticalLineX);
            const distanceRight = Math.abs(rect.right - verticalLineX);

            const verticalDistance = Math.min(distanceTop, distanceBottom);
            const horizontalDistance = Math.min(distanceLeft, distanceRight);


            if (distanceLineHorizontal) {
                distanceLineHorizontal.style.display = 'block';
                const startX = distanceLeft < distanceRight ? rect.left : rect.right;
                distanceLineHorizontal.style.left = `${Math.min(startX, verticalLineX)}px`;
                distanceLineHorizontal.style.top = `${rect.top + rect.height / 2}px`;
                distanceLineHorizontal.style.width = `${horizontalDistance}px`;
                distanceLineHorizontal.style.height = '2px';
            }

            if (distanceLineVertical) {
                distanceLineVertical.style.display = 'block';
                const startY = distanceTop < distanceBottom ? rect.top : rect.bottom;
                distanceLineVertical.style.left = `${rect.left + rect.width / 2}px`;
                distanceLineVertical.style.top = `${Math.min(startY, horizontalLineY)}px`;
                distanceLineVertical.style.width = '2px';
                distanceLineVertical.style.height = `${verticalDistance}px`;
            }

            if (verticalDistanceLabel) {
                verticalDistanceLabel.textContent = `${Math.round(verticalDistance)}px`;
                verticalDistanceLabel.style.display = 'block';
                const startY = distanceTop < distanceBottom ? rect.top : rect.bottom;
                const midY = (startY + horizontalLineY) / 2;
                verticalDistanceLabel.style.left = `${rect.left + rect.width / 2 + 5}px`;
                verticalDistanceLabel.style.top = `${midY - 8}px`;
            }

            if (horizontalDistanceLabel) {
                horizontalDistanceLabel.textContent = `${Math.round(horizontalDistance)}px`;
                horizontalDistanceLabel.style.display = 'block';
                const startX = distanceLeft < distanceRight ? rect.left : rect.right;
                const midX = (startX + verticalLineX) / 2;
                horizontalDistanceLabel.style.left = `${midX - 15}px`;
                horizontalDistanceLabel.style.top = `${rect.top + rect.height / 2 + 5}px`;
            }
        }
    }

    function enableGuidelines() {
        if (guidelinesEnabled) return;
        guidelinesEnabled = true;
        createGuidelines();
        console.log('Guidelines enabled');
    }

    function disableGuidelines() {
        if (!guidelinesEnabled) return;
        guidelinesEnabled = false;
        removeGuidelines();
        console.log('Guidelines disabled');
    }

    function enableCrosshair() {
        if (crosshairEnabled) return;
        crosshairEnabled = true;
        document.addEventListener('mousemove', onCrosshairMouseMove);
        document.addEventListener('click', onCrosshairClick);
        createHighlightOverlay();
        console.log('Crosshair enabled');
    }

    function disableCrosshair() {
        if (!crosshairEnabled) return;
        crosshairEnabled = false;
        document.removeEventListener('mousemove', onCrosshairMouseMove);
        document.removeEventListener('click', onCrosshairClick);
        removeHighlightOverlay();
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        hoveredElement = null;
        console.log('Crosshair disabled');
    }

    function createHighlightOverlay() {
        if (highlightOverlay) return;

        highlightOverlay = document.createElement('div');
        highlightOverlay.id = 'divescope-crosshair-highlight';
        Object.assign(highlightOverlay.style, {
            position: 'fixed',
            border: '2px dashed #3fb950',
            backgroundColor: 'rgba(63, 185, 80, 0.1)',
            pointerEvents: 'none',
            zIndex: '999997',
            display: 'none'
        });
        document.body.appendChild(highlightOverlay);
    }

    function removeHighlightOverlay() {
        if (highlightOverlay) {
            highlightOverlay.remove();
            highlightOverlay = null;
        }
    }

    function onCrosshairMouseMove(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);

        if (!element ||
            element === highlightOverlay ||
            element === horizontalLine ||
            element === verticalLine ||
            element === tooltip ||
            element === horizontalDistanceLabel ||
            element === verticalDistanceLabel) {
            if (highlightOverlay) {
                highlightOverlay.style.display = 'none';
            }
            if (tooltip) {
                tooltip.style.display = 'none';
            }
            hoveredElement = null;
            return;
        }

        hoveredElement = element;
        const rect = element.getBoundingClientRect();

        if (highlightOverlay) {
            highlightOverlay.style.display = 'block';
            highlightOverlay.style.left = `${rect.left}px`;
            highlightOverlay.style.top = `${rect.top}px`;
            highlightOverlay.style.width = `${rect.width}px`;
            highlightOverlay.style.height = `${rect.height}px`;
        }

        if (tooltip && horizontalLine && verticalLine) {

            tooltip.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div>Snap: ${snapHorizontal} / ${snapVertical}</div>
                    <div>Click to snap guidelines</div>
                </div>
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY + 15}px`;
        }
    }

    function onCrosshairClick(e) {
        if (!hoveredElement) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = hoveredElement.getBoundingClientRect();

        if (horizontalLine) {
            const verticalPos = snapVertical === 'top' ? rect.top : rect.bottom;
            horizontalLine.style.top = `${verticalPos}px`;
        }

        if (verticalLine) {
            const horizontalPos = snapHorizontal === 'left' ? rect.left : rect.right;
            verticalLine.style.left = `${horizontalPos}px`;
        }

        console.log(`Guidelines snapped to element: ${snapHorizontal}=${snapHorizontal === 'left' ? rect.left : rect.right}px, ${snapVertical}=${snapVertical === 'top' ? rect.top : rect.bottom}px`);
    }


    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'guidelines:active') {
            enableGuidelines();
            sendResponse({ success: true });
        } else if (request.action === 'guidelines:deactive') {
            disableGuidelines();
            sendResponse({ success: true });
        } else if (request.action === 'guidelines:status') {
            sendResponse({ active: guidelinesEnabled });
        } else if (request.action === 'crosshair:active') {
            snapHorizontal = request.snapHorizontal || 'left';
            snapVertical = request.snapVertical || 'top';
            enableCrosshair();
            sendResponse({ success: true });
        } else if (request.action === 'crosshair:deactive') {
            disableCrosshair();
            sendResponse({ success: true });
        } else if (request.action === 'crosshair:updateSnap') {
            snapHorizontal = request.snapHorizontal || 'left';
            snapVertical = request.snapVertical || 'top';
            sendResponse({ success: true });
        } else if (request.action === 'crosshair:status') {
            sendResponse({ active: crosshairEnabled });
        }
        return true;
    });
})();


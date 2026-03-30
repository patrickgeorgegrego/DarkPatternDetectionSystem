/*
=========================================================
INTEGRATION NOTES FOR MEMBER 1 & 3:
=========================================================
Hello Team! This is the core Orchestrator (Member 2).

How to trigger a scan: 
The script runs automatically on page load and watches for 
new DOM elements dynamically via a MutationObserver (with 
a 2-second debounce). You do not need to manually trigger 
a scan, it happens automatically.

How to pull results (For Member 1 - Popup UI):
Send a message from your popup.js like this:
chrome.tabs.sendMessage(tab.id, { action: "getResults" }, (response) => {
    // response is { count: 12, patterns: [...] }
});
=========================================================
*/

// Keep track of all findings so they can be retrieved by the popup
let foundPatterns = [];
let scanTimeout = null;

function highlightPattern(element, patternName, description) {
    if (!element) return;
    
    // Check if we've already highlighted this element
    if (!element.classList.contains('dp-highlight')) {
        element.classList.add('dp-highlight');
        element.title = `Dark Pattern Detected (${patternName}): ${description}`;
    }
}

function runScanners() {
    console.log("[Dark Pattern Detector: Member 2] Starting DOM scan...");
    let newFindings = [];
    
    try {
        if (typeof detectSneakyButtons === 'function') {
            newFindings = newFindings.concat(detectSneakyButtons());
        }
        if (typeof detectTrickyCheckboxes === 'function') {
            newFindings = newFindings.concat(detectTrickyCheckboxes());
        }
        if (typeof detectFakeUrgency === 'function') {
            newFindings = newFindings.concat(detectFakeUrgency());
        }
    } catch (error) {
        console.error("Error executing detectors:", error);
    }
    
    // Highlight items and store them
    newFindings.forEach(finding => {
        highlightPattern(finding.element, finding.patternName, finding.description);
        
        // Prevent duplicate entries in our global array
        const alreadyExists = foundPatterns.some(
            p => p.element === finding.element && p.patternName === finding.patternName
        );
        
        if (!alreadyExists) {
            foundPatterns.push(finding);
        }
    });
}

// 1. The 'Live' Observer (MutationObserver)
function debouncedScan() {
    if (scanTimeout) {
        clearTimeout(scanTimeout);
    }
    // 2-second debounce
    scanTimeout = setTimeout(() => {
        runScanners();
    }, 2000);
}

const observer = new MutationObserver((mutations) => {
    // Trigger a scan when DOM is mutated
    const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
    if (hasAddedNodes) {
        debouncedScan();
    }
});

function startObserver() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 2. The Communication Bridge (Messaging)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getResults') {
        const responseObj = {
            count: foundPatterns.length,
            patterns: foundPatterns.map(p => ({
                patternName: p.patternName,
                description: p.description,
                elementTag: p.element.tagName,
                elementText: p.element.innerText ? p.element.innerText.substring(0, 100) : ''
            }))
        };
        sendResponse(responseObj);
    }
    
    // Return true to indicate we will send a response asynchronously if needed
    return true; 
});

// Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        runScanners();
        startObserver();
    });
} else {
    // Adding a slight delay to allow dynamically rendered content to render
    setTimeout(() => {
        runScanners();
        startObserver();
    }, 1500);
}

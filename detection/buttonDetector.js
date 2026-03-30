// detection/buttonDetector.js

/**
 * Scans the DOM for dark patterns related to buttons.
 * Detects things like visually minimized cancel buttons or trick wording.
 */
function detectSneakyButtons() {
    const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    const findings = [];
    
    buttons.forEach(button => {
        const text = (button.innerText || button.value || '').toLowerCase();
        
        // Example logic: Cancel buttons that are made to look identical to non-interactive text
        if (text.includes('cancel') || text.includes('no thanks') || text.includes('decline')) {
            const style = window.getComputedStyle(button);
            
            // If the text color is very faint or it has no clear button-like background/border
            if (style.opacity < 0.6 || style.color === 'rgb(153, 153, 153)' || (style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderStyle === 'none')) {
                findings.push({
                    element: button,
                    patternName: 'Confirmshaming / Sneaky Button',
                    description: 'Decline option is visually minimized to discourage selection.'
                });
            }
        }
    });
    
    return findings;
}

// TEST RULE: Highlight EVERYTHING to prove the engine is alive
export function testScanner(el) {
    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
        return {
            type: "General Element",
            severity: "Low",
            metadata: { originalText: el.innerText }
        };
    }
    return null;
}

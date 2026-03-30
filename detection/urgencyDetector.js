// detection/urgencyDetector.js

/**
 * Scans the DOM for dark patterns related to fake urgency or social proof.
 */
function detectFakeUrgency() {
    const findings = [];
    const urgencyPatterns = [
        { regex: /only \d+ left in stock/i, type: 'Scarcity' },
        { regex: /\d+ people are viewing this/i, type: 'Social Proof' },
        { regex: /offer expires in/i, type: 'Urgency' },
        { regex: /hurry/i, type: 'Urgency' },
        { regex: /high demand/i, type: 'Social Proof' }
    ];
    
    // Walk over all text nodes in the body
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    
    while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (text.length > 0) {
            for (let pattern of urgencyPatterns) {
                if (pattern.regex.test(text)) {
                    // Ignore elements that are hidden or scripts
                    if (node.parentElement && node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE') {
                        findings.push({
                            element: node.parentElement,
                            patternName: \`Fake \${pattern.type}\`,
                            description: \`Detected text designed to pressure the user: "\${text}"\`
                        });
                        break; // Move to the next text node
                    }
                }
            }
        }
    }
    
    return findings;
}

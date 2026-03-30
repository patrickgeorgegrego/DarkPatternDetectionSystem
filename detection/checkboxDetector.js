// detection/checkboxDetector.js

/**
 * Scans the DOM for dark patterns related to checkboxes.
 * Detects double negatives and sneaky pre-selections.
 */
function detectTrickyCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const findings = [];
    
    checkboxes.forEach(checkbox => {
        const labelElement = checkbox.labels && checkbox.labels.length > 0 
            ? checkbox.labels[0] 
            : checkbox.parentElement;
            
        const text = labelElement.innerText.toLowerCase();
            
        // Check for double negatives
        if ((text.includes('do not') || text.includes('uncheck')) && (text.includes('cancel') || text.includes('unsubscribe'))) {
            findings.push({
                element: labelElement,
                patternName: 'Trick Question',
                description: 'Checkbox phrasing uses confusing double negatives.'
            });
        }
        
        // Check for pre-selected opt-ins
        if (checkbox.checked && (text.includes('subscribe') || text.includes('promotions') || text.includes('offers'))) {
             findings.push({
                 element: labelElement,
                 patternName: 'Preselection',
                 description: 'Optional marketing material is opted-in by default.'
             });
        }
    });
    
    return findings;
}

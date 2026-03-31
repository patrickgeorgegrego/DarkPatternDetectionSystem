// content.js - Injected into the current web page

/**
 * 0. Highlighting Utilities
 * Injects global CSS for the Pseudo-Element tag [SNEAKY] and dynamically attaches classes.
 */
function injectSneakyStyles() {
    if (document.getElementById('sneaky-style')) return;
    const style = document.createElement('style');
    style.id = 'sneaky-style';
    style.innerHTML = `
        .sneaky-highlight {
            border: 3px dashed #ff4444 !important;
            position: relative !important;
        }
        .sneaky-highlight::after {
            content: "[SNEAKY]";
            position: absolute;
            top: -20px;
            right: 0;
            background: #ff4444;
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 2px;
            pointer-events: none;
            z-index: 999999;
        }
    `;
    document.head.appendChild(style);
}

function highlightElement(element, message) {
    if (!element) return;
    injectSneakyStyles();
    element.classList.add('sneaky-highlight');

    // Log message to console for developer inspection
    console.log("Dark Pattern Detector Highlighted:", message, element);
}

/**
 * 1. Logic for Privacy Policy Extraction
 * Looks for specific containers, limits noise, and grabs the text.
 */
function findPrivacyContent() {
    const privacyLinks = Array.from(document.querySelectorAll('a')).filter(a => {
        const text = a.textContent.toLowerCase();
        return text.includes('privacy') || text.includes('terms');
    });

    let extractedText = "";

    // Temporarily hide noisy, boilerplate UI components before text extraction
    const noisyTags = document.querySelectorAll('nav, footer, header, script, style, noscript');
    noisyTags.forEach(el => el.style.display = 'none');

    // Try to find the most likely content container
    const contentContainer = document.querySelector('main, article, .content, #content, [role="main"]');

    if (contentContainer) extractedText = contentContainer.innerText;
    else extractedText = document.body.innerText;

    // Restore hidden components immediately
    noisyTags.forEach(el => el.style.display = '');

    return {
        hasPrivacyLinksFound: privacyLinks.length > 0,
        text: extractedText.slice(0, 50000)
    };
}


/**
 * 2a. Pre-Checked Scanners
 */
function detectPrecheckedBoxes() {
    let detected = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"]');

    checkboxes.forEach(checkbox => {
        let isChecked = checkbox.checked;
        if (checkbox.getAttribute('role') === 'checkbox') {
            isChecked = checkbox.getAttribute('aria-checked') === 'true';
        }

        if (isChecked) {
            let labelText = "";
            let parentLabel = checkbox.closest('label');
            if (parentLabel) {
                labelText = parentLabel.innerText.toLowerCase();
            } else if (checkbox.labels && checkbox.labels.length > 0) {
                labelText = checkbox.labels[0].innerText.toLowerCase();
            } else if (checkbox.nextElementSibling) {
                labelText = checkbox.nextElementSibling.innerText.toLowerCase();
            }

            // Check for high-risk auto-opt-in terms
            const keywords = ["autopay", "subscribe", "terms", "marketing"];
            const isSneaky = keywords.some(kw => labelText.includes(kw));

            if (isSneaky) {
                detected.push(`pre-checked box: sneaky opt-in detected`);
                highlightElement(checkbox, "Sneaky Pre-selection Opt-In");
            } else {
                detected.push("pre-checked box");
                highlightElement(checkbox, "Pre-selected Checkbox");
            }
        }
    });

    return detected;
}

/**
 * 2b. Hidden Cancels / Modals
 */
function detectHiddenClose() {
    let detected = [];
    const elements = document.querySelectorAll('div, section, dialog, [role="dialog"]');
    const windowArea = window.innerWidth * window.innerHeight;

    elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
            const rect = el.getBoundingClientRect();
            const area = rect.width * rect.height;

            // If overlay covers >20% of screen
            if (area > (windowArea * 0.20)) {
                const text = el.innerText.toLowerCase();
                const html = el.innerHTML.toLowerCase();
                const hasCloseIndicator = ["x", "close", "cancel"].some(kw => {
                    // Check text strictly inside tags, ARIA labels, or distinct X identifiers
                    return text.includes(`\n${kw}\n`) || html.includes(`aria-label="${kw}"`) || html.includes(`>${kw}<`);
                });

                // If there's no visible close indicator
                if (!hasCloseIndicator) {
                    detected.push("hidden exit");
                    highlightElement(el, "Hidden Exit Overlay");
                }
            }
        }
    });
    return detected;
}

/**
 * 2c. Main Aggregator Loop
 */
function scanForPatterns() {
    let detectedFlags = [];

    // Aggressive regex rules for urgency/scarcity
    const bodyText = document.body.innerText;
    const countdownRegex = /\b\d{1,2}:\d{2}:\d{2}\b/;
    const scarcityRegex = /only\s\d+\s[a-zA-Z\s\-]*left|only\s\d+\s[a-zA-Z\s\-]*remaining/i;

    if (countdownRegex.test(bodyText) || bodyText.toLowerCase().includes("ends in")) {
        detectedFlags.push("urgency countdown");
    }
    if (scarcityRegex.test(bodyText)) {
        detectedFlags.push("scarcity low stock");
    }

    // Dynamic Nodes Checking
    const prechecked = detectPrecheckedBoxes();
    const hiddenExits = detectHiddenClose();

    // Grab actionable buttons for NLP Engine (Confirmshaming check)
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    buttons.forEach(btn => {
        let txt = btn.innerText.trim().toLowerCase();
        if (txt) {
            detectedFlags.push(`button: ${txt}`);
        }
    });

    return detectedFlags.concat(prechecked).concat(hiddenExits);
}

/**
 * 3. Communication
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scanAndAnalyze") {
        console.log("Dark Pattern Detector: Initiating scan...");

        const contentData = findPrivacyContent();
        const patternFlags = scanForPatterns();

        async function retrieveAnalysis() {
            try {
                // Submit Privacy Policy Logic
                const summaryReq = fetch('http://127.0.0.1:8000/summarize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: window.location.href,
                        text: contentData.text || "No readable text found."
                    })
                }).then(res => {
                    if (!res.ok) throw new Error("Summarize Endpoint Error");
                    return res.json();
                });

                // Submit UX UI Elements Logic
                const analyzeReq = fetch('http://127.0.0.1:8000/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: window.location.href,
                        detected_elements: patternFlags
                    })
                }).then(res => {
                    if (!res.ok) throw new Error("Analyze Endpoint Error");
                    return res.json();
                });

                const [summaryReply, analyzeReply] = await Promise.all([summaryReq, analyzeReq]);

                sendResponse({
                    status: "success",
                    data: {
                        summary: summaryReply,
                        analysis: analyzeReply,
                        rawFlags: patternFlags,
                        hasPrivacyLinks: contentData.hasPrivacyLinksFound
                    }
                });
            } catch (err) {
                console.error("Extension Network Error:", err);
                sendResponse({
                    status: "error",
                    message: "Backend Connection Error - Please ensure the API is running."
                });
            }
        }

        retrieveAnalysis();
        return true;
    }
});

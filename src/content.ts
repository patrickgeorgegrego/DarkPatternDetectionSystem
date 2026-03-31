chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getDomData") {
    // 1. Grab visible text for backend spaCy modeling
    const text = document.body.innerText;
    
    // 2. Scan core DOM Nodes
    const detected_elements: string[] = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
    checkboxes.forEach(cb => {
        const isChecked = (cb as HTMLInputElement).checked || cb.getAttribute('aria-checked') === 'true';
        if (isChecked) {
           let parent = cb.closest('label');
           let txt = parent ? parent.innerText.toLowerCase() : "";
           detected_elements.push(`pre-checked box: ${txt.slice(0, 30)}`);
        }
    });

    const buttons = document.querySelectorAll('button, a, [role="button"]');
    buttons.forEach(btn => {
        if (btn.textContent) {
          detected_elements.push(`button: ${btn.textContent.trim().toLowerCase()}`);
        }
    });

    // 3. Return payload representation back to Popup React App for API forwarding
    sendResponse({ text, detected_elements });
  }
  return true;
});

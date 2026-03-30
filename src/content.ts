// content.ts - Handles scanning and policy summarization via external API

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Content script received message:", message);

  if (message.action === "scan") {
    // Return specific dummy patterns as requested
    sendResponse({ 
      patterns: ["Fake urgency", "Hidden fees"] 
    });
  }

  if (message.action === "summarize") {
    const text = document.body.innerText;

    // Send the extracted text to the local summarization server
    fetch("http://localhost:3000/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    })
    .then(response => response.json())
    .then(data => {
      // Return the response from the server back to the popup
      sendResponse(data);
    })
    .catch(error => {
      console.error("Summarization error:", error);
      sendResponse({ 
        summary: "Error: Could not connect to the summarization server at http://localhost:3000/summarize.",
        risk_level: "High"
      });
    });

    // Return true to indicate we will send a response asynchronously
    return true;
  }

  return true;
});

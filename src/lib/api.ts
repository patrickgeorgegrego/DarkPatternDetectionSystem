/**
 * API Helper Module for Dark Pattern Detector
 */

const BASE_URL = "http://localhost:3000";

export interface SummarizeResponse {
  summary: string;
  risk_level: "Low" | "Medium" | "High";
}

/**
 * Sends a POST request to the summarization service.
 * @param text The extracted page text to summarize.
 * @returns A promise that resolves to the summarization data.
 */
export async function summarizeText(text: string): Promise<SummarizeResponse> {
  try {
    const response = await fetch(`${BASE_URL}/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Request failed:", error);
    return {
      summary: "Error: Could not connect to the summarization service. Please ensure the server is running on http://localhost:3000.",
      risk_level: "High"
    };
  }
}

const BASE_URL = "http://localhost:3000";

export const api = {
  scan: async (data: { detected_elements: string[] }) => {
    const res = await fetch(`${BASE_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },
  summarize: async (data: { text: string }) => {
    const res = await fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },
  health: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  },
  history: async () => {
    const res = await fetch(`${BASE_URL}/history`);
    if (!res.ok) throw new Error("API Offline");
    return res.json();
  }
};

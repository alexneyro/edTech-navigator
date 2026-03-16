export interface AIModel {
  id: string;
  name?: string;
}

const getProxyUrl = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

export const fetchAIModels = async (baseUrl: string, apiKey?: string): Promise<AIModel[]> => {
  if (!apiKey) throw new Error('API Key не указан');
  
  const rawUrl = `${baseUrl.replace(/\/$/, '')}/models`;
  const url = baseUrl.includes('groq.com') ? getProxyUrl(rawUrl) : rawUrl;

  const response = await fetch(url, {
    method: 'GET',
    referrerPolicy: "no-referrer", // Игнорируем русские буквы в URL сайта
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`Ошибка ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
};

export const chatWithAI = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  messages: any[]
): Promise<string> => {
  const rawUrl = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const url = baseUrl.includes('groq.com') ? getProxyUrl(rawUrl) : rawUrl;

  const response = await fetch(url, {
    method: 'POST',
    referrerPolicy: "no-referrer", // Игнорируем русские буквы в URL сайта
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.trim(),
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Ошибка API');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export interface AIModel {
  id: string;
  name?: string;
}

// Используем более надежный прокси
const getProxyUrl = (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

export const fetchAIModels = async (baseUrl: string, apiKey?: string): Promise<AIModel[]> => {
  if (!apiKey) throw new Error('API Key не указан');
  
  const rawUrl = `${baseUrl.replace(/\/$/, '')}/models`;
  // К OpenRouter идем НАПРЯМУЮ (он поддерживает CORS), к остальным через прокси
  const url = baseUrl.includes('openrouter.ai') ? rawUrl : getProxyUrl(rawUrl);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) throw new Error(`Ошибка провайдера: ${response.status}`);
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
  const url = baseUrl.includes('openrouter.ai') ? rawUrl : getProxyUrl(rawUrl);

  const response = await fetch(url, {
    method: 'POST',
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
    if (response.status === 429) throw new Error('Лимит запросов исчерпан. Попробуйте через 20 секунд или смените модель.');
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Ошибка связи с ИИ');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

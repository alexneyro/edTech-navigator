export interface AIModel {
  id: string;
  name?: string;
}

export const fetchAIModels = async (baseUrl: string, apiKey?: string): Promise<AIModel[]> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API Key не указан');
  }
  
  // Убираем лишние слэши и формируем чистый путь
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/models`;

  const response = await fetch(url, {
    method: 'GET',
    referrerPolicy: "no-referrer",
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
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API ключ не установлен.');
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    referrerPolicy: "no-referrer",
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.trim(),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Ошибка AI провайдера');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

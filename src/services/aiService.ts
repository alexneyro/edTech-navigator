const getProxyUrl = (url: string) => 'https://corsproxy.io/?' + encodeURIComponent(url);

export interface AIModel {
  id: string;
  name?: string;
}

export const fetchAIModels = async (baseUrl: string, apiKey?: string): Promise<AIModel[]> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API Key не указан');
  }
  
  try {
    const finalUrl = getProxyUrl(baseUrl + '/models');
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error || errorMessage;
        if (typeof errorMessage === 'object') {
          errorMessage = JSON.stringify(errorMessage);
        }
      } catch (e) {
        // Fallback to default message
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    // OpenRouter returns { data: [...] }, others might return [...]
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error: any) {
    console.error('Error fetching AI models:', error);
    if (error.message?.includes('Invalid API Key') || error.message?.includes('invalid_api_key')) {
      throw new Error('Неверный API ключ. Проверьте его в настройках.');
    }
    throw error;
  }
};

export const chatWithAI = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API ключ не установлен. Пожалуйста, обратитесь к учителю.');
  }

  try {
    const finalUrl = getProxyUrl(baseUrl + '/chat/completions');
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      let errorMessage = 'Ошибка AI провайдера';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.error || `Ошибка ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Пустой ответ от AI');
    }
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    // If it's a "Provider returned error", it's often a temporary issue with the specific model
    if (error.message?.includes('Provider returned error')) {
      throw new Error('Выбранная модель временно недоступна у провайдера. Попробуйте сменить модель в настройках.');
    }
    if (error.message?.includes('Invalid API Key') || error.message?.includes('invalid_api_key')) {
      throw new Error('Неверный API ключ. Пожалуйста, проверьте правильность ввода в настройках профиля.');
    }
    throw error;
  }
};

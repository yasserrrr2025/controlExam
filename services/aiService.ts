// c:\Users\Azzam\Desktop\newcontrol\services\aiService.ts

// OpenRouter Free Models in order of preference
const AI_MODELS = [
  'meta-llama/llama-3-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'openchat/openchat-7b:free'
];

export interface AiInsightsResult {
  metrics: {
    title: string;
    value: string;
    status: 'success' | 'warning' | 'danger' | 'info';
  }[];
  insights: string[];
}

export const fetchAIAnalysis = async (
  apiKey: string,
  dataContext: any,
  analysisType: 'absence' | 'proctor' | 'receipt' | 'errors'
): Promise<AiInsightsResult | null> => {
  if (!apiKey) throw new Error('API Key is missing');

  let prompt = '';
  const basePromptEnd = `
Respond ONLY with a valid JSON object matching this TypeScript interface exactly:
{
  "metrics": [ { "title": "string (arabic short)", "value": "string (number or %)", "status": "success" | "warning" | "danger" | "info" } ],
  "insights": [ "string (arabic bullet points)" ]
}
Make the insights actionable and specific to the data. Use Arabic language for all output text. DO NOT wrap JSON in markdown block, return raw JSON string.`;

  if (analysisType === 'absence') {
    prompt = `You are a data analyst for a school exam control system. Analyze the following student absence/delay data and provide a mini-dashboard structure.
Data: ${JSON.stringify(dataContext)} ${basePromptEnd}`;
  } else if (analysisType === 'proctor') {
    prompt = `You are a data analyst for a school exam control system. Analyze the following proctor delay and alert data and provide a mini-dashboard structure.
Data: ${JSON.stringify(dataContext)} ${basePromptEnd}`;
  } else if (analysisType === 'receipt') {
     prompt = `You are a data analyst for a school exam control system. Analyze the following envelope receipt and delivery logs and provide a mini-dashboard structure.
Data: ${JSON.stringify(dataContext)} ${basePromptEnd}`;
  } else if (analysisType === 'errors') {
     prompt = `You are an expert system auditor for a school exam control system. Analyze the following daily system errors, unresolved alerts, and system issues, and provide a mini-dashboard structure.
Data: ${JSON.stringify(dataContext)} ${basePromptEnd}`;
  }

  for (const model of AI_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Smart Exam Control System'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content;
      
      // Clean up potential markdown formatting from LLM
      content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(content);
      
      if (parsed.metrics && parsed.insights) {
          return parsed as AiInsightsResult;
      }
      throw new Error('Invalid JSON structure returned by AI');
      
    } catch (error) {
      console.warn(`Model ${model} failed, trying next... Error:`, error);
      // Continue to next
    }
  }
  
  throw new Error('جميع النماذج الذكية تحت الضغط حالياً، يرجى المحاولة لاحقاً.');
};

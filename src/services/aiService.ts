// AI Service for handling OpenAI API calls
// Note: In a production environment, API keys should be stored securely on the server side

export interface AIResponse {
  text: string;
  error?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AIService {
  private apiKey: string;
  private apiEndpoint: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-3.5-turbo';
  private autoAssistEnabled: boolean = true;

  constructor() {
    // In a real app, this should be stored securely on the server
    this.apiKey = '';

    // Load auto-assist preference from localStorage
    const savedPreference = localStorage.getItem('ai_auto_assist');
    if (savedPreference !== null) {
      this.autoAssistEnabled = savedPreference === 'true';
    }
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public isAutoAssistEnabled(): boolean {
    return this.autoAssistEnabled;
  }

  public toggleAutoAssist(): boolean {
    this.autoAssistEnabled = !this.autoAssistEnabled;
    localStorage.setItem('ai_auto_assist', this.autoAssistEnabled.toString());
    return this.autoAssistEnabled;
  }

  public async askQuestion(question: string, conversationHistory: AIMessage[] = []): Promise<AIResponse> {
    if (!this.apiKey) {
      return {
        text: "API key not set. Please configure the OpenAI API key.",
        error: "API_KEY_MISSING"
      };
    }

    try {
      // Prepare the messages array with conversation history and the new question
      const messages = [
        {
          role: "system",
          content: "You are a helpful assistant for a police admin dashboard. Provide concise, accurate information about police procedures, case management, and administrative tasks. Be professional and direct."
        },
        ...conversationHistory,
        {
          role: "user",
          content: question
        }
      ];

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        return {
          text: "Sorry, I encountered an error while processing your request.",
          error: errorData.error?.message || "API_ERROR"
        };
      }

      const data = await response.json();
      return {
        text: data.choices[0].message.content
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return {
        text: "Sorry, I encountered an error while processing your request.",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      };
    }
  }
}

// Create a singleton instance
const aiService = new AIService();

// Set the API key (in a real app, this would be done securely)
// API key should be set by the application, not hardcoded
// aiService.setApiKey('YOUR_API_KEY_HERE');

export default aiService;

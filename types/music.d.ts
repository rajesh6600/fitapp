declare namespace Music {
  type GenerateRequest = {
    prompt: string;
    duration?: number;
  };
  
  type Response = {
    id: string;
    url: string;
    status: 'processing' | 'completed' | 'failed';
    error?: string;
    prompt?: string;
    duration?: number;
  };
}
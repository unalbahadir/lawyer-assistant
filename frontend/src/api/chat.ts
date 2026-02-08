import client from './client'

export interface ChatRequest {
  case_id: number
  message: string
}

export interface ChatResponse {
  response: string
  sources: string[]
  kvkk_warning: string
}

export interface ChatMessage {
  id: number
  message: string
  response: string
  sources: string[]
  created_at: string
}

export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await client.post('/api/chat/', request)
    return response.data
  },
  
  getHistory: async (caseId: number): Promise<ChatMessage[]> => {
    const response = await client.get(`/api/chat/case/${caseId}`)
    return response.data
  },
}

import client from './client'

export interface TemplateRequest {
  case_id: number
  template_type: 'dilekce' | 'sozlesme' | 'tutanak'
  context?: string
}

export interface TemplateResponse {
  draft: string
  sources: string[]
}

export const templatesApi = {
  generate: async (request: TemplateRequest): Promise<TemplateResponse> => {
    const response = await client.post('/api/templates/', request)
    return response.data
  },
}

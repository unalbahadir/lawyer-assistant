import client from './client'

export interface Case {
  id: number
  title: string
  description?: string
  client_name?: string
  case_number?: string
  status: string
  created_at: string
  updated_at: string
}

export interface CaseCreate {
  title: string
  description?: string
  client_name?: string
  case_number?: string
  status?: string
}

export const casesApi = {
  getAll: async (): Promise<Case[]> => {
    const response = await client.get('/api/cases/')
    return response.data
  },
  
  getById: async (id: number): Promise<Case> => {
    const response = await client.get(`/api/cases/${id}`)
    return response.data
  },
  
  create: async (data: CaseCreate): Promise<Case> => {
    const response = await client.post('/api/cases/', data)
    return response.data
  },
  
  update: async (id: number, data: CaseCreate): Promise<Case> => {
    const response = await client.put(`/api/cases/${id}`, data)
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/cases/${id}`)
  },
}

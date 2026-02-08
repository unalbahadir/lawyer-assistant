import client from './client'

export interface Document {
  id: number
  case_id: number
  filename: string
  file_path: string
  file_type?: string
  file_size?: number
  uploaded_at: string
  is_indexed: boolean
}

export const documentsApi = {
  getByCaseId: async (caseId: number): Promise<Document[]> => {
    const response = await client.get(`/api/documents/case/${caseId}`)
    return response.data
  },
  
  upload: async (caseId: number, file: File): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await client.post(`/api/documents/${caseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/documents/${id}`)
  },
}

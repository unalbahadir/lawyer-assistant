import client from './client'

export interface Task {
  id: number
  case_id?: number
  title: string
  description?: string
  completed: boolean
  due_date?: string
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string
  case_id?: number
  due_date?: string
}

export const tasksApi = {
  getAll: async (caseId?: number, completed?: boolean): Promise<Task[]> => {
    const params: any = {}
    if (caseId !== undefined) params.case_id = caseId
    if (completed !== undefined) params.completed = completed
    const response = await client.get('/api/tasks/', { params })
    return response.data
  },
  
  create: async (data: TaskCreate): Promise<Task> => {
    const response = await client.post('/api/tasks/', data)
    return response.data
  },
  
  update: async (id: number, data: TaskCreate): Promise<Task> => {
    const response = await client.put(`/api/tasks/${id}`, data)
    return response.data
  },
  
  toggleComplete: async (id: number): Promise<Task> => {
    const response = await client.patch(`/api/tasks/${id}/complete`)
    return response.data
  },
  
  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/tasks/${id}`)
  },
}

import { useState, useEffect } from 'react'
import { CheckSquare, Plus, X, Calendar } from 'lucide-react'
import { tasksApi, Task } from '../api/tasks'
import './TasksPage.css'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
  })

  useEffect(() => {
    loadTasks()
  }, [filter])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const completed = filter === 'all' ? undefined : filter === 'completed'
      const data = await tasksApi.getAll(undefined, completed)
      setTasks(data)
    } catch (error) {
      console.error('Error loading tasks:', error)
      alert('Görevler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tasksApi.create({
        title: newTask.title,
        description: newTask.description || undefined,
        due_date: newTask.due_date && newTask.due_date.trim() ? newTask.due_date : undefined,
      })
      setShowModal(false)
      setNewTask({ title: '', description: '', due_date: '' })
      loadTasks()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Görev oluşturulurken hata oluştu')
    }
  }

  const handleToggleComplete = async (id: number) => {
    try {
      await tasksApi.toggleComplete(id)
      loadTasks()
    } catch (error) {
      console.error('Error toggling task:', error)
      alert('Görev güncellenirken hata oluştu')
    }
  }

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return

    try {
      await tasksApi.delete(id)
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Görev silinirken hata oluştu')
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h2>Görev Listesi</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Yeni Görev
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('all')}
        >
          Tümü
        </button>
        <button
          className={filter === 'active' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('active')}
        >
          Aktif
        </button>
        <button
          className={filter === 'completed' ? 'filter-tab active' : 'filter-tab'}
          onClick={() => setFilter('completed')}
        >
          Tamamlanan
        </button>
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} />
          <p>Henüz görev eklenmemiş</p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              <div className="task-content">
                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task.id)}
                  />
                </div>
                <div className="task-info">
                  <h3 className={task.completed ? 'strikethrough' : ''}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={task.completed ? 'strikethrough' : ''}>
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <div className="task-due-date">
                      <Calendar size={16} />
                      <span>
                        {new Date(task.due_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => handleDeleteTask(task.id)}
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni Görev Oluştur</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Başlık *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

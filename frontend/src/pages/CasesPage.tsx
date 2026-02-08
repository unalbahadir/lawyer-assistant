import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Search } from 'lucide-react'
import { casesApi, Case } from '../api/cases'
import './CasesPage.css'

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    client_name: '',
    case_number: '',
  })

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      setLoading(true)
      const data = await casesApi.getAll()
      setCases(data)
    } catch (error) {
      console.error('Error loading cases:', error)
      alert('Davalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await casesApi.create(newCase)
      setShowModal(false)
      setNewCase({ title: '', description: '', client_name: '', case_number: '' })
      loadCases()
    } catch (error) {
      console.error('Error creating case:', error)
      alert('Dava oluşturulurken hata oluştu')
    }
  }

  const handleDeleteCase = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Bu davayı silmek istediğinize emin misiniz?')) return
    
    try {
      await casesApi.delete(id)
      loadCases()
    } catch (error) {
      console.error('Error deleting case:', error)
      alert('Dava silinirken hata oluştu')
    }
  }

  const filteredCases = cases.filter(caseItem =>
    caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.case_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="cases-page">
      <div className="page-header">
        <h2>Dava Yönetimi</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Yeni Dava
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Dava ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : filteredCases.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>Henüz dava eklenmemiş</p>
        </div>
      ) : (
        <div className="cases-grid">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="case-card"
              onClick={() => navigate(`/cases/${caseItem.id}`)}
            >
              <div className="case-card-header">
                <h3>{caseItem.title}</h3>
                <button
                  className="btn-icon"
                  onClick={(e) => handleDeleteCase(caseItem.id, e)}
                >
                  ×
                </button>
              </div>
              {caseItem.client_name && (
                <p className="case-client">Müvekkil: {caseItem.client_name}</p>
              )}
              {caseItem.case_number && (
                <p className="case-number">Dava No: {caseItem.case_number}</p>
              )}
              {caseItem.description && (
                <p className="case-description">{caseItem.description}</p>
              )}
              <div className="case-status">
                <span className={`status-badge status-${caseItem.status}`}>
                  {caseItem.status === 'active' ? 'Aktif' : 
                   caseItem.status === 'closed' ? 'Kapalı' : 'Arşiv'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Yeni Dava Oluştur</h3>
            <form onSubmit={handleCreateCase}>
              <div className="form-group">
                <label>Başlık *</label>
                <input
                  type="text"
                  required
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Müvekkil</label>
                <input
                  type="text"
                  value={newCase.client_name}
                  onChange={(e) => setNewCase({ ...newCase, client_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dava No</label>
                <input
                  type="text"
                  value={newCase.case_number}
                  onChange={(e) => setNewCase({ ...newCase, case_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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

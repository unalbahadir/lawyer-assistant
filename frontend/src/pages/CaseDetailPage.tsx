import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Send, FileText, File, X } from 'lucide-react'
import { casesApi, Case } from '../api/cases'
import { documentsApi, Document } from '../api/documents'
import { chatApi, ChatMessage } from '../api/chat'
import { templatesApi } from '../api/templates'
import './CaseDetailPage.css'

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'templates'>('chat')
  const [templateType, setTemplateType] = useState<'dilekce' | 'sozlesme' | 'tutanak'>('dilekce')
  const [templateDraft, setTemplateDraft] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (caseId) {
      loadCase()
      loadDocuments()
      loadChatHistory()
    }
  }, [caseId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadCase = async () => {
    try {
      const data = await casesApi.getById(Number(caseId))
      setCaseData(data)
    } catch (error) {
      console.error('Error loading case:', error)
      alert('Dava yüklenirken hata oluştu')
      navigate('/')
    }
  }

  const loadDocuments = async () => {
    try {
      const data = await documentsApi.getByCaseId(Number(caseId))
      setDocuments(data)
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const loadChatHistory = async () => {
    try {
      const data = await chatApi.getHistory(Number(caseId))
      setChatMessages(data)
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file || !caseId) return

    try {
      await documentsApi.upload(Number(caseId), file)
      loadDocuments()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Dosya yüklenirken hata oluştu')
    }
  }

  const handleSendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!message.trim() || !caseId || loading) return

    const userMessage = message
    setMessage('')
    setLoading(true)

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      message: userMessage,
      response: '',
      sources: [],
      created_at: new Date().toISOString(),
    }
    setChatMessages([...chatMessages, tempUserMessage])

    try {
      const response = await chatApi.sendMessage({
        case_id: Number(caseId),
        message: userMessage,
      })

      // Update with actual response
      const newMessage: ChatMessage = {
        id: Date.now() + 1,
        message: userMessage,
        response: response.response,
        sources: response.sources,
        created_at: new Date().toISOString(),
      }

      setChatMessages((prev: ChatMessage[]) => {
        const filtered = prev.filter((m: ChatMessage) => m.id !== tempUserMessage.id)
        return [...filtered, newMessage]
      })
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Mesaj gönderilirken hata oluştu')
      setChatMessages((prev: ChatMessage[]) => prev.filter((m: ChatMessage) => m.id !== tempUserMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return

    try {
      await documentsApi.delete(id)
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Dosya silinirken hata oluştu')
    }
  }

  const handleGenerateTemplate = async () => {
    if (!caseId) return

    setTemplateLoading(true)
    try {
      const response = await templatesApi.generate({
        case_id: Number(caseId),
        template_type: templateType,
      })
      setTemplateDraft(response.draft)
    } catch (error) {
      console.error('Error generating template:', error)
      alert('Taslak oluşturulurken hata oluştu')
    } finally {
      setTemplateLoading(false)
    }
  }

  if (!caseData) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="case-detail-page">
      <div className="case-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Geri
        </button>
        <div>
          <h2>{caseData.title}</h2>
          {caseData.client_name && <p className="case-meta">Müvekkil: {caseData.client_name}</p>}
          {caseData.case_number && <p className="case-meta">Dava No: {caseData.case_number}</p>}
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'chat' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={activeTab === 'documents' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('documents')}
        >
          📄 Dokümanlar
        </button>
        <button
          className={activeTab === 'templates' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('templates')}
        >
          📝 Taslaklar
        </button>
      </div>

      {activeTab === 'chat' && (
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="empty-chat">
                <FileText size={48} />
                <p>Bu dava için henüz mesaj yok. Soru sormak için aşağıdaki kutuya yazın.</p>
                <p className="info-text">Not: Sadece yüklenen dokümanlardan cevap verilir.</p>
              </div>
            ) : (
              chatMessages.map((msg: ChatMessage) => (
                <div key={msg.id} className="chat-message">
                  <div className="message-user">
                    <strong>Sen:</strong>
                    <p>{msg.message}</p>
                  </div>
                  <div className="message-assistant">
                    <strong>AI:</strong>
                    <p>{msg.response}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="sources">
                        <strong>Kaynaklar:</strong>
                        <ul>
                          {msg.sources.map((source: string, idx: number) => (
                            <li key={idx}>{source}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="kvkk-warning">
                      ⚠️ Bu yanıt yalnızca yüklenen dokümanlara dayanmaktadır. Kişisel verilerin korunmasına ilişkin KVKK mevzuatına uygun hareket edilmesi gerekmektedir.
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message-assistant">
                <p className="typing">Yanıtlanıyor...</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
              placeholder="Dokümanlar hakkında soru sorun..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !message.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="documents-container">
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.txt"
            />
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} />
              Dosya Yükle
            </button>
            <p className="upload-info">PDF, DOC, DOCX veya TXT dosyaları yükleyebilirsiniz</p>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              <File size={48} />
              <p>Henüz doküman yüklenmemiş</p>
            </div>
          ) : (
            <div className="documents-list">
              {documents.map((doc: Document) => (
                <div key={doc.id} className="document-item">
                  <div className="document-info">
                    <FileText size={24} />
                    <div>
                      <strong>{doc.filename}</strong>
                      <p className="document-meta">
                        {doc.file_size && `${(doc.file_size / 1024).toFixed(2)} KB`} • 
                        {new Date(doc.uploaded_at).toLocaleDateString('tr-TR')} • 
                        {doc.is_indexed ? '✓ İndekslendi' : '⏳ İndeksleniyor...'}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="templates-container">
          <div className="template-controls">
            <select
              value={templateType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTemplateType(e.target.value as 'dilekce' | 'sozlesme' | 'tutanak')}
              className="template-select"
            >
              <option value="dilekce">Dilekçe</option>
              <option value="sozlesme">Sözleşme</option>
              <option value="tutanak">Tutanak</option>
            </select>
            <button
              className="btn btn-primary"
              onClick={handleGenerateTemplate}
              disabled={templateLoading}
            >
              {templateLoading ? 'Oluşturuluyor...' : 'Taslak Oluştur'}
            </button>
          </div>

          {templateDraft && (
            <div className="template-draft">
              <div className="draft-header">
                <h3>Taslak</h3>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(templateDraft)
                    alert('Taslak panoya kopyalandı!')
                  }}
                >
                  Kopyala
                </button>
              </div>
              <div className="draft-content">
                <pre>{templateDraft}</pre>
              </div>
              <div className="kvkk-warning">
                ⚠️ Bu taslak AI tarafından oluşturulmuştur. Kullanmadan önce gözden geçirin ve gerekli düzenlemeleri yapın. KVKK mevzuatına uygun hareket edilmesi gerekmektedir.
              </div>
            </div>
          )}

          {!templateDraft && !templateLoading && (
            <div className="empty-state">
              <FileText size={48} />
              <p>Yukarıdaki butona tıklayarak taslak oluşturun</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

# Avukat AI Assistant - MVP

Avukat ve arabulucular için AI destekli web uygulaması. Case yönetimi, doküman yükleme, RAG tabanlı chat, taslak oluşturma ve görev yönetimi özelliklerini içerir.

## 🚀 Özellikler

- **Case Yönetimi**: Dava dosyalarını oluşturma, düzenleme ve yönetme
- **Doküman Yükleme**: PDF, DOC, DOCX ve TXT dosyalarını yükleme ve otomatik indeksleme
- **RAG Chat**: Case-scoped AI chat - sadece yüklenen dokümanlardan cevap verir
- **Kaynak Gösterimi**: Her cevapta kullanılan doküman kaynakları gösterilir
- **KVKK Uyarısı**: Her AI yanıtında KVKK uyarısı eklenir
- **Taslak Oluşturma**: Dilekçe, sözleşme ve tutanak taslakları oluşturma
- **Görev Listesi**: Basit görev yönetimi

## 📋 Gereksinimler

- Docker ve Docker Compose
- Google API Key (Gemini API için RAG ve taslak oluşturma)

## 🛠️ Kurulum

1. **Repository'yi klonlayın veya indirin**

2. **Environment dosyasını oluşturun:**
   ```bash
   cp .env.example .env
   ```

3. **`.env` dosyasını düzenleyin ve Google API key'inizi ekleyin:**
   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   ```

4. **Docker ile uygulamayı başlatın:**
   ```bash
   docker-compose up -d
   ```

5. **Uygulamaya erişin:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

## 📁 Proje Yapısı

```
avukat/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI uygulaması
│   │   ├── models.py            # SQLAlchemy modelleri
│   │   ├── schemas.py           # Pydantic şemaları
│   │   ├── database.py          # Veritabanı yapılandırması
│   │   ├── config.py            # Ayarlar
│   │   ├── routes/              # API route'ları
│   │   │   ├── cases.py
│   │   │   ├── documents.py
│   │   │   ├── chat.py
│   │   │   ├── templates.py
│   │   │   └── tasks.py
│   │   └── services/
│   │       └── rag_service.py   # RAG servisi
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/              # React sayfaları
│   │   ├── components/          # React bileşenleri
│   │   └── api/                 # API client'ları
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔧 Teknoloji Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM
- **SQLite**: Veritabanı (production için PostgreSQL önerilir)
- **ChromaDB**: Vector database (RAG için)
- **Google Gemini API**: LLM (chat ve taslak oluşturma)
- **Sentence Transformers**: Embeddings (multilingual)
- **PyPDF2 & python-docx**: Doküman işleme

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **React Router**: Routing
- **Axios**: HTTP client
- **Lucide React**: Icons

## 📖 Kullanım

### Case Oluşturma
1. Ana sayfada "Yeni Dava" butonuna tıklayın
2. Dava bilgilerini doldurun (başlık zorunlu)
3. "Oluştur" butonuna tıklayın

### Doküman Yükleme
1. Bir dava seçin
2. "Dokümanlar" sekmesine gidin
3. "Dosya Yükle" butonuna tıklayın
4. PDF, DOC, DOCX veya TXT dosyası seçin
5. Dosya otomatik olarak indekslenecektir

### Chat Kullanımı
1. Bir dava seçin
2. "Chat" sekmesine gidin
3. Dokümanlar hakkında soru sorun
4. AI sadece yüklenen dokümanlardan cevap verecektir
5. Her cevapta kaynaklar ve KVKK uyarısı gösterilir

### Taslak Oluşturma
1. Bir dava seçin
2. "Taslaklar" sekmesine gidin
3. Taslak tipini seçin (Dilekçe, Sözleşme, Tutanak)
4. "Taslak Oluştur" butonuna tıklayın
5. Oluşturulan taslağı kopyalayın ve düzenleyin

### Görev Yönetimi
1. "Görevler" menüsüne gidin
2. "Yeni Görev" butonuna tıklayın
3. Görev bilgilerini doldurun
4. Görevleri tamamlayabilir veya silebilirsiniz

## 🔒 Güvenlik ve KVKK

- Uygulama sadece yüklenen dokümanlardan cevap verir
- Her AI yanıtında KVKK uyarısı gösterilir
- Dokümanlar case-scoped olarak saklanır ve işlenir
- Production ortamında ek güvenlik önlemleri alınmalıdır:
  - Authentication/Authorization
  - HTTPS
  - Veritabanı şifreleme
  - API rate limiting

## 🐛 Sorun Giderme

### Backend başlamıyor
- `.env` dosyasında `GOOGLE_API_KEY` doğru ayarlanmış mı kontrol edin
- Port 8000'in kullanılabilir olduğundan emin olun

### Dokümanlar indekslenmiyor
- Dosya formatının desteklendiğinden emin olun (PDF, DOC, DOCX, TXT)
- Backend loglarını kontrol edin: `docker-compose logs backend`

### Chat çalışmıyor
- Google API key'in geçerli olduğundan emin olun
- En az bir doküman yüklenmiş ve indekslenmiş olmalı

## 📝 Notlar

- Bu bir MVP (Minimum Viable Product) versiyonudur
- Production kullanımı için ek geliştirmeler gereklidir:
  - Kullanıcı kimlik doğrulama
  - Daha güçlü veritabanı (PostgreSQL)
  - Dosya depolama (S3 benzeri)
  - Logging ve monitoring
  - Error handling iyileştirmeleri
  - Test coverage

## 📄 Lisans

Bu proje MVP amaçlı geliştirilmiştir.

## 🤝 Katkıda Bulunma

MVP aşamasında olduğu için şu an için katkı kabul edilmemektedir.

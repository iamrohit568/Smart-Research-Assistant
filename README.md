

````markdown
# 🚀 Smart Research Assistant

A powerful research productivity suite combining a **Chrome extension** and a **Spring Boot backend**, equipped with AI-powered summarization, multi-modal file analysis, and seamless research organization tools.

---

## ✨ Features

### 🔍 Core Capabilities
- **One-Click Summarization**  
  Instantly generate AI summaries for highlighted text on any webpage.
  
- **Similar Research Suggestions**  
  - Uses **Gemini API** to generate 3–5 relevant research topics  
  - Fetches authoritative sources from **Semantic Scholar**  
  - Presents results as clickable, well-formatted HTML

---

### 🧠 Advanced Research Tools
- **Multi-Modal File Analysis**
  - 📄 PDF text extraction & summarization  
  - 🖼️ Image OCR using **Google Cloud Vision**  
  - 🎙️ Audio transcription via **OpenAI Whisper**

- **Research Workstation**
  - Upload PDFs, images, or audio files
  - Choose the desired analysis (e.g., summarization, OCR, transcription)
  - View results in clean, Markdown-formatted text

---

### 🛠️ Productivity Features
- **Research Notes**  
  Save and sync notes securely across sessions.

- **Complete History**  
  View all past analyses with **search** and **filter** functionality.

- **Export Results**  
  Download your analysis as `.txt` files.

---

### 🔐 Security & Collaboration
- User Authentication (Login & Registration)
- Individual Research History per User
- Secure Deletion of Sensitive Data (file & notes)

---

## 💻 Technology Stack

### Backend (Spring Boot)
- **Core**: Java 17, Spring Boot 3.5, Spring WebFlux
- **AI & Cloud APIs**:
  - Google Gemini API
  - Google Cloud Vision API
  - OpenAI Whisper
- **Database**: MySQL + JPA (Hibernate)
- **File Handling**: PDFBox, ImageIO
- **Planned Security**: JWT Auth

### Frontend (Chrome Extension)
- **Framework**: Vanilla JavaScript + Web Components
- **Manifest**: Chrome Extension Manifest V3
- **UI**: HTML/CSS with responsive design and custom variables

### External APIs Used
- Google Generative AI (Gemini)
- Google Cloud Vision
- OpenAI Whisper
- Semantic Scholar API

---

## 🛠️ Installation & Setup

### ✅ Prerequisites
- Java 17+
- Maven
- MySQL 8+
- Chrome Browser
- API Keys for:
  - Google Gemini
  - Google Cloud Vision
  - OpenAI Whisper

### 🔧 Backend Setup
1. Clone the Repository:
   ```bash
   git clone https://github.com/your-username/smart-research-assistant.git
   cd smart-research-assistant
````

2. Configure `application.properties`:

   ```properties
   # MySQL Configuration
   spring.datasource.url=jdbc:mysql://localhost:3306/research_assistant
   spring.datasource.username=dbuser
   spring.datasource.password=dbpass

   # API Keys
   gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=
   gemini.api.key=your_gemini_key
   google.cloud.vision.api.key=your_vision_key
   openai.api.key=your_openai_key
   ```

3. Build & Run the Server:

   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### 🧩 Chrome Extension Setup

1. Navigate to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** and select the `extension/` directory
4. Pin the extension to your toolbar for quick access

---

## 🧭 Usage Guide

### 🔗 Browser Extension

* **Summarize Text**
  Highlight text → Click the extension icon → Click `Summarize`

* **Find Similar Research**
  Highlight text → Click the extension icon → Click `Find Similar Research`

* **Save Notes**
  Type into the note area → Click `Save Notes`

### 🧠 Research Workstation

* **Upload & Analyze Files**
  Open “Workstation” in the extension → Upload a PDF/image/audio file → Select operation (e.g., OCR, summarize)

* **View Research History**
  Go to “Research History” → Browse/search/filter/delete entries → Download results as needed

---

## 🏗️ System Architecture

```
.
├── backend/
│   ├── src/main/java/com/research/assistant/
│   │   ├── config/            # Spring Boot Configuration
│   │   ├── controller/        # REST API Controllers
│   │   ├── dto/               # DTOs
│   │   ├── model/             # JPA Entities
│   │   ├── repository/        # Database Repositories
│   │   ├── service/           # Business Logic
│   │   └── exception/         # Custom Exception Handling
│
├── extension/
│   ├── assets/                # Icons and Images
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript Modules
│   ├── sidepanel.html         # UI Entry Point
│   └── manifest.json          # Chrome Extension Manifest
```

---


## 📜 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for more details.

---

## 👨‍💻 Developed with ❤️ by \[Rohit Tambe]

* 🌐 [LinkedIn](https://www.linkedin.com/in/rohit-tambe-1585b0257/)

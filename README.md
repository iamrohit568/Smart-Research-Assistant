```markdown
# Smart Research Assistant Chrome Extension 🚀

A Chrome extension integrated with a Spring Boot backend to summarize selected webpage text using Google's Gemini API. Designed to streamline research workflows with AI-powered summaries and local note-saving.

---

## Features ✨
- **One-Click Summarization**: Highlight text on any webpage and get instant AI-generated summaries.
- **Research Notes**: Save notes locally in the extension’s side panel.
- **Cross-Origin Communication**: Secure REST API built with Spring Boot for backend processing.
- **Reactive HTTP Calls**: Non-blocking WebClient for Gemini API integration.

---

## Installation & Setup 🛠️

### Prerequisites
- Java 17+
- Maven
- Google Gemini API Key
- Chrome Browser

### Backend Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/smart-research-assistant.git
   ```
2. **Configure Gemini API**:
   - Add your Gemini API key to `application.properties`:
     ```properties
     gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=
     gemini.api.key=YOUR_API_KEY
     ```
3. **Run the Spring Boot App**:
   ```bash
   mvn spring-boot:run
   ```

### Chrome Extension Setup
1. **Load the Extension**:
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** (top-right toggle).
   - Click **Load unpacked** and select the `extension/` directory.
2. **Pin the Extension**:
   - Click the puzzle icon in Chrome’s toolbar and pin the **Research Assistant**.

---

## Usage 🖱️
1. **Open the Side Panel**:
   - Click the extension icon in the toolbar.
2. **Summarize Text**:
   - Select text on any webpage.
   - Click **Summarize** in the side panel.
3. **Save Notes**:
   - Type notes in the text area and click **Save Notes**.

---

## Project Structure 📂
```
.
├── backend/                 # Spring Boot Application
│   ├── src/main/java/com/reseach/assistant/
│   │   ├── ResearchController.java   # REST endpoint
│   │   ├── ResearchService.java      # Gemini API logic
│   │   └── GeminiResponse.java       # API response model
│
├── extension/              # Chrome Extension Files
│   ├── sidepanel.html      # Side panel UI
│   ├── sidepanel.js        # Script for summarization
│   ├── manifest.json       # Extension config
│   └── sidepanel.css       # Styling
```

---


## Technologies Used 💻
- **Backend**: Java 17, Spring Boot 3.5, WebClient, Lombok, Jackson.
- **Frontend**: Chrome Extension APIs (Manifest V3), JavaScript, HTML/CSS.
- **APIs**: Google Gemini.

---

## License 📜
Distributed under the MIT License. See `LICENSE` for details.

---

**Made with ❤️ by [Rohit]**  
_Let’s connect on [LinkedIn](https://www.linkedin.com/in/rohit-tambe-1585b0257/)!_
```

---

**Tips**:  
- Replace `YOUR_API_KEY` and GitHub links with your actual details.  
- Add screenshots of the extension in action under a **Demo** section.  
- Include a GIF/video demo link for visual appeal!

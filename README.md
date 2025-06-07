Got it! Here’s an updated version of your README reflecting the new **similarResearch()** feature with Gemini and Semantic Scholar integration, plus the clickable links HTML output.

---

````markdown
# Smart Research Assistant Chrome Extension 🚀

A Chrome extension integrated with a Spring Boot backend to summarize selected webpage text using Google's Gemini API. Designed to streamline research workflows with AI-powered summaries, related research suggestions, and local note-saving.

---

## Features ✨
- **One-Click Summarization**: Highlight text on any webpage and get instant AI-generated summaries.
- **Similar Research Suggestions**:  
  - Uses Gemini API to generate 3–5 relevant research topic titles based on selected text.  
  - Fetches authoritative links from Semantic Scholar for each topic.  
  - Returns formatted HTML with clickable links displayed in the extension side panel.
- **Research Notes**: Save notes locally in the extension’s side panel.
- **Cross-Origin Communication**: Secure REST API built with Spring Boot for backend processing.
- **Reactive HTTP Calls**: Non-blocking WebClient for Gemini and Semantic Scholar API integration.

---

## Installation & Setup 🛠️

### Prerequisites
- Java 17+
- Maven
- Google Gemini API Key
- Semantic Scholar API access (no key required but rate limits apply)
- Chrome Browser

### Backend Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/smart-research-assistant.git
````

2. **Configure Gemini API**:

   * Add your Gemini API key to `application.properties`:

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

   * Open Chrome and navigate to `chrome://extensions`.
   * Enable **Developer mode** (top-right toggle).
   * Click **Load unpacked** and select the `extension/` directory.
2. **Pin the Extension**:

   * Click the puzzle icon in Chrome’s toolbar and pin the **Research Assistant**.

---

## Usage 🖱️

1. **Open the Side Panel**:

   * Click the extension icon in the toolbar.
2. **Summarize Text**:

   * Select text on any webpage.
   * Click **Summarize** in the side panel.
3. **Find Similar Research**:

   * Select text on any webpage.
   * Click **Find Similar Research** in the side panel.
   * View AI-generated research topic titles with clickable Semantic Scholar links.
4. **Save Notes**:

   * Type notes in the text area and click **Save Notes**.

---

## Project Structure 📂

```
.
├── backend/                 # Spring Boot Application
│   ├── src/main/java/com/research/assistant/
│   │   ├── ResearchController.java       # REST endpoints (summarize & similarResearch)
│   │   ├── ResearchService.java          # Gemini & Semantic Scholar API logic
│   │   └── GeminiResponse.java           # Gemini API response model
│
├── extension/              # Chrome Extension Files
│   ├── sidepanel.html      # Side panel UI (added buttons for similar research)
│   ├── sidepanel.js        # Script for summarization & similarResearch calls
│   ├── manifest.json       # Extension config
│   └── sidepanel.css       # Styling
```

---

## Technologies Used 💻

* **Backend**: Java 17, Spring Boot 3.5, WebClient, Lombok, Jackson.
* **Frontend**: Chrome Extension APIs (Manifest V3), JavaScript, HTML/CSS.
* **APIs**: Google Gemini, Semantic Scholar.

---

## License 📜

Distributed under the MIT License. See `LICENSE` for details.

---

**Made with ❤️ by \[Rohit]**
*Let’s connect on [LinkedIn](https://www.linkedin.com/in/rohit-tambe-1585b0257/)!*

```

---

**Tips**:  
- Replace `YOUR_API_KEY` and GitHub links with your actual details.  
- Add screenshots or a GIF/video demo showcasing the **Similar Research** feature in action.  
- Highlight how the extension returns clickable Semantic Scholar links for further reading.

---

If you want, I can also help draft the **sidepanel.js** usage snippet or the Spring Boot controller code snippet for this new feature!
```

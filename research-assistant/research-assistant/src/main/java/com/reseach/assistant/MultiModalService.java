package com.reseach.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.*;

@Service
public class MultiModalService {

    @Value("${google.cloud.vision.api.key}")
    private String visionApiKey;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final com.reseach.assistant.FileAnalysisRepository fileAnalysisRepository;

    public MultiModalService(WebClient.Builder webClientBuilder,
                             ObjectMapper objectMapper,
                             com.reseach.assistant.FileAnalysisRepository fileAnalysisRepository) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.fileAnalysisRepository = fileAnalysisRepository;
    }

    public String processFile(MultipartFile file, String operation, Integer userId) {
        try {
            String fileType = determineFileType(file);

            // Create database record
            FileAnalysis analysis = new FileAnalysis();
            analysis.setUserId(userId);
            analysis.setFileName(file.getOriginalFilename());
            analysis.setFileType(fileType);
            analysis.setOperation(operation);
            analysis.setFileSize(file.getSize());
            analysis.setStatus("PROCESSING");
            analysis = fileAnalysisRepository.save(analysis);

            String extractedContent = "";

            switch (fileType.toUpperCase()) {
                case "PDF":
                    extractedContent = extractTextFromPDF(file);
                    break;
                case "IMAGE":
                    extractedContent = extractTextFromImage(file);
                    break;
                case "AUDIO":
                    extractedContent = transcribeAudio(file);
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported file type: " + fileType);
            }

            // Store extracted content
            analysis.setExtractedContent(extractedContent);

            // Process based on operation
            String result = processExtractedContent(extractedContent, operation, fileType);

            // Update database with results
            analysis.setAnalysisResult(result);
            analysis.setStatus("COMPLETED");
            fileAnalysisRepository.save(analysis);

            return result;

        } catch (Exception e) {
            return "❌ Error processing file: " + e.getMessage();
        }
    }

    private String determineFileType(MultipartFile file) {
        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename();

        if (contentType != null) {
            if (contentType.equals("application/pdf")) return "PDF";
            if (contentType.startsWith("image/")) return "IMAGE";
            if (contentType.startsWith("audio/")) return "AUDIO";
        }

        if (fileName != null) {
            String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
            switch (extension) {
                case "pdf": return "PDF";
                case "jpg": case "jpeg": case "png": case "gif": case "bmp": return "IMAGE";
                case "mp3": case "wav": case "m4a": case "ogg": return "AUDIO";
            }
        }

        throw new IllegalArgumentException("Cannot determine file type");
    }

    private String extractTextFromPDF(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(
                file.getInputStream()  // For PDFBox 2.x
                // For PDFBox 3.x use: file.getInputStream(), ""
        )) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractTextFromImage(MultipartFile file) {
        try {
            // Convert image to base64
            byte[] imageBytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // Use Google Cloud Vision API
            Map<String, Object> request = Map.of(
                    "requests", List.of(
                            Map.of(
                                    "image", Map.of("content", base64Image),
                                    "features", List.of(
                                            Map.of("type", "TEXT_DETECTION", "maxResults", 10),
                                            Map.of("type", "DOCUMENT_TEXT_DETECTION", "maxResults", 10)
                                    )
                            )
                    )
            );

            String response = webClient.post()
                    .uri("https://vision.googleapis.com/v1/images:annotate?key=" + visionApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromVisionResponse(response);

        } catch (Exception e) {
            return performBasicOCR(file);
        }
    }

    private String extractTextFromVisionResponse(String response) {
        try {
            JsonNode json = objectMapper.readTree(response);
            JsonNode responses = json.get("responses");

            if (responses != null && responses.isArray() && responses.size() > 0) {
                JsonNode firstResponse = responses.get(0);
                JsonNode fullTextAnnotation = firstResponse.get("fullTextAnnotation");

                if (fullTextAnnotation != null && fullTextAnnotation.has("text")) {
                    return fullTextAnnotation.get("text").asText();
                }

                // Fallback to textAnnotations
                JsonNode textAnnotations = firstResponse.get("textAnnotations");
                if (textAnnotations != null && textAnnotations.isArray() && textAnnotations.size() > 0) {
                    return textAnnotations.get(0).get("description").asText();
                }
            }

            return "No text detected in image";
        } catch (Exception e) {
            return "Error extracting text from vision response: " + e.getMessage();
        }
    }

    private String performBasicOCR(MultipartFile file) {
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            return "Basic OCR not implemented - please configure Google Cloud Vision API";
        } catch (Exception e) {
            return "OCR failed: " + e.getMessage();
        }
    }

    private String transcribeAudio(MultipartFile file) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            body.add("model", "whisper-1");
            body.add("response_format", "text");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(openaiApiKey);

            String response = webClient.post()
                    .uri("https://api.openai.com/v1/audio/transcriptions")
                    .headers(httpHeaders -> httpHeaders.addAll(headers))
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return response != null ? response : "Transcription failed";

        } catch (Exception e) {
            return "Audio transcription failed: " + e.getMessage();
        }
    }

    private String processExtractedContent(String content, String operation, String fileType) {
        String prompt = buildAnalysisPrompt(content, operation, fileType);

        Map<String, Object> requestBody = Map.of("contents", List.of(
                Map.of("parts", List.of(
                        Map.of("text", prompt)
                ))
        ));

        try {
            String response = webClient.post()
                    .uri(geminiApiUrl + geminiApiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromGeminiResponse(response);
        } catch (Exception e) {
            return "Analysis failed: " + e.getMessage();
        }
    }

    private String buildAnalysisPrompt(String content, String operation, String fileType) {
        StringBuilder prompt = new StringBuilder();

        switch (operation.toLowerCase()) {
            case "summarize":
                prompt.append("You are an AI assistant. Provide a clear and well-formatted **Markdown summary** of the following ")
                        .append(fileType.toLowerCase())
                        .append(" content.\n\n")
                        .append("### 📄 Format:\n")
                        .append("#### # Title\n")
                        .append("#### 🔑 Key Points\n")
                        .append("- Use bullet points to list key ideas or facts\n")
                        .append("- Include technical terms or examples if present\n")
                        .append("#### 📝 Summary Paragraph\n")
                        .append("Write a concise paragraph summarizing the content in natural language.\n\n")
                        .append("```text\n");
                break;

            case "extract_formulas":
                prompt.append("You are a scientific assistant. Extract all mathematical expressions and provide explanations in Markdown format.\n\n")
                        .append("### 🧪 Format:\n")
                        .append("#### # Extracted Formulas\n")
                        .append("1. **Formula:** `E = mc^2`\n")
                        .append("   - **Explanation:** Energy-mass equivalence from relativity\n")
                        .append("2. **Formula:** `<next>`\n")
                        .append("   - **Explanation:** ...\n\n")
                        .append("Include LaTeX-style formulas where needed for clarity.\n\n")
                        .append("```text\n");
                break;

            case "transcribe":
                prompt.append("You are a transcription editor. Clean and format the following **audio transcription** into clear Markdown text.\n\n")
                        .append("### 🎧 Format:\n")
                        .append("- Use proper punctuation and grammar\n")
                        .append("- Split sections with paragraphs for readability\n")
                        .append("- Keep the tone natural and flowing\n\n")
                        .append("```text\n");
                break;

            case "analyze":
                prompt.append("You are a research assistant. Perform an in-depth analysis of the given content and format it in Markdown.\n\n")
                        .append("### 🔍 Format:\n")
                        .append("#### # Title\n")
                        .append("#### 📌 Key Themes\n")
                        .append("- Theme 1\n")
                        .append("- Theme 2\n")
                        .append("#### ⚙️ Methodologies\n")
                        .append("- Describe methods or models used\n")
                        .append("#### 🧠 Findings\n")
                        .append("- List or describe key conclusions\n")
                        .append("#### 💡 Insights\n")
                        .append("- Add any significant interpretations or ideas\n\n")
                        .append("```text\n");
                break;

            default:
                prompt.append("Please analyze and summarize the following content using Markdown structure:\n\n")
                        .append("### 📝 General Format:\n")
                        .append("- Title as heading\n")
                        .append("- Key points as bullet list\n")
                        .append("- Summary paragraph\n\n")
                        .append("```text\n");
                break;
        }

        prompt.append(content).append("\n```");

        prompt.append(content);

        if ("PDF".equals(fileType)) {
            prompt.append("\n\nThis content was extracted from a PDF document. Please structure your response with clear headings and bullet points where appropriate.");
        } else if ("IMAGE".equals(fileType)) {
            prompt.append("\n\nThis content was extracted from an image using OCR. Please account for any potential OCR errors and focus on the main information.");
        } else if ("AUDIO".equals(fileType)) {
            prompt.append("\n\nThis content was transcribed from audio. Please create structured notes with key points and important quotes.");
        }

        return prompt.toString();
    }

    private String extractTextFromGeminiResponse(String response) {
        try {
            GeminiRespone geminiResponse = objectMapper.readValue(response, GeminiRespone.class);
            if (geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()) {
                GeminiRespone.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if (firstCandidate.getContent() != null &&
                        firstCandidate.getContent().getParts() != null &&
                        !firstCandidate.getContent().getParts().isEmpty()) {
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No response generated";
        } catch (Exception e) {
            return "Error processing response: " + e.getMessage();
        }
    }

    public List<FileAnalysis> getUserFileHistory(Integer userId) {
        return fileAnalysisRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<FileAnalysis> searchFileHistory(Integer userId, String query) {
        return fileAnalysisRepository.searchByUserIdAndFileName(userId, query);
    }

    public String chatWithPdf(String pdfContent, String question) {
        // Build a prompt that includes the PDF content and the question
        String prompt = buildChatPrompt(pdfContent, question);

        Map<String, Object> requestBody = Map.of("contents", List.of(
                Map.of("parts", List.of(
                        Map.of("text", prompt)
                ))
        ));

        try {
            String response = webClient.post()
                    .uri(geminiApiUrl + geminiApiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromGeminiResponse(response);
        } catch (Exception e) {
            return "Chat failed: " + e.getMessage();
        }
    }

    private String buildChatPrompt(String pdfContent, String question) {
        return "You are an AI assistant that answers questions about PDF documents. " +
                "Answer the following question based on the provided PDF content:\n\n" +
                "Question: " + question + "\n\n" +
                "PDF Content:\n```\n" + pdfContent + "\n```\n\n" +
                "Instructions:\n" +
                "- Answer concisely but thoroughly\n" +
                "- If the answer isn't in the PDF, say 'The PDF doesn't contain information about this'\n" +
                "- Format your answer clearly with markdown if needed\n" +
                "- Provide page numbers or sections if possible";
    }
}
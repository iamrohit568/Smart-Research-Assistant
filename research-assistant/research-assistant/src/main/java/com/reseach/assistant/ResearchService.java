package com.reseach.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class ResearchService {
    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClienBuilder, ObjectMapper objectMapper) {
        this.webClient = webClienBuilder.build();
        this.objectMapper = objectMapper;
    }

    public String processContent(ResearchRequest request) {
        if (request.getOperation() == null || request.getOperation().isEmpty()) {
            throw new IllegalArgumentException("Operation field is required");
        }

        if (request.getOperation().equalsIgnoreCase("similar")) {
            return processSimilarResearch(request);
        }

        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = Map.of("contents", new Object[]{
                Map.of("parts", new Object[]{
                        Map.of("text", prompt)
                })
        });

        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    private String processSimilarResearch(ResearchRequest request) {
        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = Map.of("contents", new Object[]{
                Map.of("parts", new Object[]{
                        Map.of("text", prompt)
                })
        });

        String geminiResponse = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        String rawTopics = extractTextFromResponse(geminiResponse);
        String[] topics = rawTopics.split("\n");

        StringBuilder finalHtml = new StringBuilder();
        for (String topic : topics) {
            topic = topic.trim();
            if (!topic.isEmpty()) {
                String url = searchSemanticScholarLink(topic);
                if (url == null) {
                    // Fallback to Google Scholar
                    url = "https://scholar.google.com/scholar?q=" + URLEncoder.encode(topic, StandardCharsets.UTF_8);
                }
                finalHtml.append("\uD83D\uDD17 ").append(topic);
                finalHtml.append(" <a href=\"").append(url).append("\" target=\"_blank\">Read more</a>");
                finalHtml.append("<br>");
            }
        }
        return finalHtml.toString();
    }

    private String searchSemanticScholarLink(String topic) {
        try {
            String apiUrl = "https://api.semanticscholar.org/graph/v1/paper/search?query=" +
                    URLEncoder.encode(topic, StandardCharsets.UTF_8) +
                    "&limit=1&fields=url";

            String response = webClient.get()
                    .uri(apiUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode json = objectMapper.readTree(response);
            JsonNode data = json.get("data");
            if (data != null && data.isArray() && data.size() > 0) {
                JsonNode first = data.get(0);
                if (first.has("url")) {
                    return first.get("url").asText();
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching from Semantic Scholar: " + e.getMessage());
        }
        return null;
    }

    private String extractTextFromResponse(String response) {
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
            return "No response found";
        } catch (Exception e) {
            return "Error processing response: " + e.getMessage();
        }
    }

    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();
        String operation = request.getOperation();
        if (operation == null) {
            throw new IllegalArgumentException("Operation cannot be null");
        }

        switch (operation.toLowerCase()) {
            case "summarise":
                prompt.append("Provide clear summary of following text in sentence:\n\n ");
                break;
            case "suggest":
                prompt.append("Based on following content: suggest related topics and further reading. Format the response with clear headings and bullet points:\n\n ");
                break;
            case "similar":
                prompt.append("List 5 similar academic research topics or titles (1 per line, no numbering). Do not add links or formatting. Just plain topic names:<br>\n\n");
                break;
            default:
                throw new IllegalArgumentException("Invalid operation: " + operation);
        }

        prompt.append(request.getContent());
        return prompt.toString();
    }
}

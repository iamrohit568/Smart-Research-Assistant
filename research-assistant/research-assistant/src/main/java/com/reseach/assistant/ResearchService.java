package com.reseach.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

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
        //build prompt
        String prompt = buildPrompt(request);

        //Query the ai model api
        Map<String,Object> requestBody=Map.of("contents",new Object[]{
                Map.of("parts",new Object[]{
                        Map.of("text",prompt)
                })
        }
        );
        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();  // This blocks the thread until the response is received

        //parse response
        //return response

        return extractTextFromResponse(response);
    }

    private String extractTextFromResponse(String response) {
        try{
            GeminiRespone geminiResponse=objectMapper.readValue(response,GeminiRespone.class);
            if(geminiResponse.getCandidates() !=null && !geminiResponse.getCandidates().isEmpty()){
                GeminiRespone.Candidate firstCandidate=geminiResponse.getCandidates().get(0);
                if (firstCandidate.getContent() != null &&
                        firstCandidate.getContent().getParts() != null &&
                        !firstCandidate.getContent().getParts().isEmpty()) {

                    return firstCandidate.getContent().getParts().get(0).getText();
                }

            }
            return "No response found";
        }catch(Exception e){
            return "Error processing response"+e.getMessage();
        }

    }

    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();
        String operation = request.getOperation(); // Ensure this is not null
        if (operation == null) {
            throw new IllegalArgumentException("Operation cannot be null");
        }
        switch (operation.toLowerCase()) { // Use lowercase for consistency
            case "summarise": // Corrected spelling
                prompt.append("Provide clear summary of following text in sentence:\n\n ");
                break;
            case "suggest":
                prompt.append("Based on following content: suggest related topics and further reading. Format the response with clear headings and bullet points:\n\n ");
                break;
            default:
                throw new IllegalArgumentException("Invalid operation: " + operation);
        }
        prompt.append(request.getContent());
        return prompt.toString();
    }
}

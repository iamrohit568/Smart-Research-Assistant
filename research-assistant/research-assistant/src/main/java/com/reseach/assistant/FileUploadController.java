package com.reseach.assistant;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class FileUploadController {

    private final MultiModalService multiModalService;
    private final FileAnalysisRepository fileAnalysisRepository;


    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("operation") String operation,
            @RequestHeader("X-User-ID") Integer userId) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            // Check file size (max 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "File size too large. Maximum 10MB allowed.");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate operation
            if (!isValidOperation(operation)) {
                response.put("success", false);
                response.put("message", "Invalid operation. Supported: summarize, extract_formulas, transcribe, analyze");
                return ResponseEntity.badRequest().body(response);
            }

            String result = multiModalService.processFile(file, operation, userId);

            response.put("success", true);
            response.put("message", "File processed successfully");
            response.put("result", result);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileSize", file.getSize());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "File processing failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getFileHistory(
            @RequestHeader("X-User-ID") Integer userId) {

        Map<String, Object> response = new HashMap<>();

        try {
            List<FileAnalysis> history = multiModalService.getUserFileHistory(userId);

            response.put("success", true);
            response.put("history", history);
            response.put("count", history.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to retrieve file history: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/analysis/{id}")
    public ResponseEntity<Map<String, Object>> getAnalysisDetails(
            @PathVariable Long id,
            @RequestHeader("X-User-ID") Integer userId) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Here you would add logic to get specific analysis details
            // and verify the user owns this analysis

            response.put("success", true);
            response.put("message", "Analysis details retrieved");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to retrieve analysis: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/supported-formats")
    public ResponseEntity<Map<String, Object>> getSupportedFormats() {
        Map<String, Object> response = new HashMap<>();

        Map<String, Object> supportedFormats = new HashMap<>();
        supportedFormats.put("pdf", new String[]{"application/pdf"});
        supportedFormats.put("images", new String[]{"image/jpeg", "image/png", "image/gif", "image/bmp"});
        supportedFormats.put("audio", new String[]{"audio/mpeg", "audio/wav", "audio/m4a", "audio/ogg"});

        Map<String, String> operations = new HashMap<>();
        operations.put("summarize", "Generate comprehensive summary");
        operations.put("extract_formulas", "Extract mathematical formulas and equations");
        operations.put("transcribe", "Transcribe and clean up audio content");
        operations.put("analyze", "Perform detailed content analysis");

        response.put("supportedFormats", supportedFormats);
        response.put("operations", operations);
        response.put("maxFileSize", "10MB");

        return ResponseEntity.ok(response);
    }

    private boolean isValidOperation(String operation) {
        return operation != null &&
                (operation.equals("summarize") ||
                        operation.equals("extract_formulas") ||
                        operation.equals("transcribe") ||
                        operation.equals("analyze"));
    }

    @GetMapping("/search-history")
    public ResponseEntity<Map<String, Object>> searchFileHistory(
            @RequestHeader("X-User-ID") Integer userId,
            @RequestParam(required = false) String query) {

        Map<String, Object> response = new HashMap<>();

        try {
            List<FileAnalysis> history;
            if (query != null && !query.isEmpty()) {
                history = multiModalService.searchFileHistory(userId, query);
            } else {
                history = multiModalService.getUserFileHistory(userId);
            }

            response.put("success", true);
            response.put("history", history);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error retrieving history: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteAnalysis(
            @PathVariable Long id,
            @RequestHeader("X-User-ID") Integer userId) {

        Map<String, Object> response = new HashMap<>();

        try {
            // First verify the analysis exists and belongs to the user
            Optional<FileAnalysis> analysis = fileAnalysisRepository.findByIdAndUserId(id, userId);

            if (!analysis.isPresent()) {
                response.put("success", false);
                response.put("message", "Analysis not found or doesn't belong to user");
                return ResponseEntity.status(404).body(response);
            }

            // Delete the analysis
            fileAnalysisRepository.deleteById(id);

            response.put("success", true);
            response.put("message", "Analysis deleted successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to delete analysis: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @DeleteMapping("/delete-all")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteAllAnalyses(
            @RequestHeader("X-User-ID") Integer userId) {

        Map<String, Object> response = new HashMap<>();

        try {
            fileAnalysisRepository.deleteAllByUserId(userId);
            response.put("success", true);
            response.put("message", "All analyses deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to delete analyses: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }


}
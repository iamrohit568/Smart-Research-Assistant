package com.reseach.assistant;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class FileUploadRequest {
    private MultipartFile file;
    private String operation; // "summarize", "extract_formulas", "transcribe", "analyze"
    private String fileType; // "pdf", "image", "audio"
}
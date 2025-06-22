package com.reseach.assistant;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_analyses")
@Data
public class FileAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType; // PDF, IMAGE, AUDIO

    @Column(nullable = false)
    private String operation; // summarize, extract_formulas, transcribe, analyze

    @Column(columnDefinition = "TEXT")
    private String extractedContent;

    @Column(columnDefinition = "TEXT")
    private String analysisResult;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private Long fileSize;

    @Column
    private String status; // PROCESSING, COMPLETED, FAILED

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PROCESSING";
        }
    }
}
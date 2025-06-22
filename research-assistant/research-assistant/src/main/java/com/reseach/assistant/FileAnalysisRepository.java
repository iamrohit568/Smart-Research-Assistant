package com.reseach.assistant;

import com.reseach.assistant.FileAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileAnalysisRepository extends JpaRepository<FileAnalysis, Long> {

    List<FileAnalysis> findByUserIdOrderByCreatedAtDesc(Integer userId);  // 1 usage

    List<FileAnalysis> findByUserIdAndFileType(Integer userId, String fileType);  // no usages

    List<FileAnalysis> findByUserIdAndStatus(Integer userId, String status);  // no usages

    long countByUserIdAndStatus(Integer userId, String status);  // no usages

    @Query("SELECT fa FROM FileAnalysis fa WHERE fa.userId = :userId AND fa.fileName LIKE %:query% ORDER BY fa.createdAt DESC")  // no usages
    List<FileAnalysis> searchByUserIdAndFileName(@Param("userId") Integer userId, @Param("query") String query);

    Optional<FileAnalysis> findByIdAndUserId(Long id, Integer userId);


    @Modifying
    @Query("DELETE FROM FileAnalysis fa WHERE fa.userId = :userId")
    void deleteAllByUserId(@Param("userId") Integer userId);

}


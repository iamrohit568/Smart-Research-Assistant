package com.reseach.assistant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiRespone {
    public List<Candidate> candidates;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Candidate{
        private Content Content;
    }
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Content{
        private List<Part> Parts;
    }
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Part{
        private String Text;
    }
}

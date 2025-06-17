package com.reseach.assistant;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String username;
    private String password;
}
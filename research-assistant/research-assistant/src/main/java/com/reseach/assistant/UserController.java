package com.reseach.assistant;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<User> user = userService.findByUsernameAndPassword(
                    request.getUsername(),
                    request.getPassword()
            );

            if (user.isPresent()) {
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("user", Map.of(
                        "id", user.get().getId(),
                        "name", user.get().getName(),
                        "username", user.get().getUsername()
                ));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Invalid username or password");
                return ResponseEntity.status(401).body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Check if username already exists
            if (userService.existsByUsername(request.getUsername())) {
                response.put("success", false);
                response.put("message", "Username already exists");
                return ResponseEntity.status(400).body(response);
            }

            User newUser = userService.createUser(
                    request.getName(),
                    request.getUsername(),
                    request.getPassword()
            );

            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("user", Map.of(
                    "id", newUser.getId(),
                    "name", newUser.getName(),
                    "username", newUser.getUsername()
            ));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateUser(@RequestParam String username) {
        Map<String, Object> response = new HashMap<>();

        try {
            Optional<User> user = userService.findByUsername(username);
            if (user.isPresent()) {
                response.put("valid", true);
                response.put("user", Map.of(
                        "id", user.get().getId(),
                        "name", user.get().getName(),
                        "username", user.get().getUsername()
                ));
            } else {
                response.put("valid", false);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("valid", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
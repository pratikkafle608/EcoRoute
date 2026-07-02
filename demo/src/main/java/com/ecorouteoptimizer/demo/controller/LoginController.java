package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.model.Password;
import com.ecorouteoptimizer.demo.model.User;
import com.ecorouteoptimizer.demo.repository.PasswordRepository;
import com.ecorouteoptimizer.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {

    @Autowired private PasswordRepository passwordRepo;
    @Autowired private UserRepository userRepo;

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        Integer userId = (Integer) body.get("userId");
        String inputPassword = (String) body.get("password");

        if (userId == null || inputPassword == null || inputPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and password are required"));
        }

        Password record = passwordRepo.findByUserUserId(userId).orElse(null);

        if (record == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No account found for this user"));
        }

        if (!record.getPassword().equals(inputPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Incorrect password"));
        }

        return ResponseEntity.ok(record.getUser());
    }

    @PostMapping("/signup")
    @Transactional
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> body) {
        String name     = (String) body.get("name");
        String email    = (String) body.get("email");
        String password = (String) body.get("password");

        if (name == null || name.isBlank() || email == null || email.isBlank()
                || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "name, email and password are required"));
        }

        if (userRepo.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with that email already exists"));
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setTotalSaved(0);
        User saved = userRepo.save(user);

        Password pwd = new Password();
        pwd.setUser(saved);
        pwd.setPassword(password);
        passwordRepo.save(pwd);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}

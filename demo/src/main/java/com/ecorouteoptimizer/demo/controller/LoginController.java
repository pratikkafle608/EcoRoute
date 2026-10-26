package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.model.Password;
import com.ecorouteoptimizer.demo.model.User;
import com.ecorouteoptimizer.demo.repository.PasswordRepository;
import com.ecorouteoptimizer.demo.repository.UserRepository;
import com.ecorouteoptimizer.demo.service.AuthTokens;
import com.ecorouteoptimizer.demo.service.CredentialValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {

    @Autowired private PasswordRepository passwordRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthTokens tokens;

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String email = CredentialValidator.email(CredentialValidator.text(body, "email"));
        String inputPassword = CredentialValidator.loginPassword(CredentialValidator.raw(body, "password"));

        User user = userRepo.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No account found for this email"));
        }

        Password record = passwordRepo.findByUserUserId(user.getUserId()).orElse(null);

        if (record == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No account found for this user"));
        }

        if (!passwordEncoder.matches(inputPassword, record.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Incorrect password"));
        }

        return ResponseEntity.ok(withToken(record.getUser()));
    }

    @PostMapping("/signup")
    @Transactional
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> body) {
        String name     = CredentialValidator.name(CredentialValidator.text(body, "name"));
        String email    = CredentialValidator.email(CredentialValidator.text(body, "email"));
        String password = CredentialValidator.newPassword(CredentialValidator.raw(body, "password"));

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
        pwd.setPassword(passwordEncoder.encode(password));
        passwordRepo.save(pwd);

        return ResponseEntity.status(HttpStatus.CREATED).body(withToken(saved));
    }

    // The user's fields plus a signed token the frontend sends as "Authorization: Bearer <token>"
    private Map<String, Object> withToken(User u) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", u.getUserId());
        body.put("name", u.getName());
        body.put("email", u.getEmail());
        body.put("totalSaved", u.getTotalSaved());
        body.put("token", tokens.issue(u.getUserId()));
        return body;
    }
}

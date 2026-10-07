package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.model.User;
import com.ecorouteoptimizer.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

// No list-all or create endpoints: the API is public, so they would leak every user's email
// and let anyone bypass /api/signup. Accounts are created through LoginController only.
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserRepository userRepo;

    // Public profile only - never expose the email
    @GetMapping("/{id}") public Map<String, Object> getOne(@PathVariable Integer id) {
        User u = userRepo.findById(id).orElseThrow();
        return Map.of("userId", u.getUserId(), "name", u.getName());
    }
}

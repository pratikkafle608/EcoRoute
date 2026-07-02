package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.model.User;
import com.ecorouteoptimizer.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserRepository userRepo;

    @GetMapping         public List<User> getAll()                    { return userRepo.findAll(); }
    @PostMapping        public User       create(@RequestBody User u)  { return userRepo.save(u); }
    @GetMapping("/{id}") public User      getOne(@PathVariable Integer id) {
        return userRepo.findById(id).orElseThrow();
    }
}
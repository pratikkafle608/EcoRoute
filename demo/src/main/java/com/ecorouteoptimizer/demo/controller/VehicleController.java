package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.model.Vehicle;
import com.ecorouteoptimizer.demo.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired private VehicleRepository vehicleRepo;

    @GetMapping("/user/{userId}")
    public List<Vehicle> byUser(@PathVariable Integer userId) {
        return vehicleRepo.findByUserUserId(userId);
    }

    @PostMapping
    public Vehicle create(@RequestBody Vehicle v) { return vehicleRepo.save(v); }
}

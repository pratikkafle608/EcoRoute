package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.model.User;
import com.ecorouteoptimizer.demo.model.Vehicle;
import com.ecorouteoptimizer.demo.repository.VehicleRepository;
import com.ecorouteoptimizer.demo.service.AuthConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired private VehicleRepository vehicleRepo;

    @GetMapping("/user/{userId}")
    public List<Vehicle> byUser(@PathVariable Integer userId,
                                @RequestAttribute(AuthConfig.AUTH_USER_ID) Integer authUserId) {
        if (!userId.equals(authUserId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return vehicleRepo.findByUserUserId(userId);
    }

    @PostMapping
    public Vehicle create(@RequestBody Vehicle v, @RequestAttribute(AuthConfig.AUTH_USER_ID) Integer authUserId) {
        v.setVehicleId(null); // always insert - a client-sent id would overwrite someone else's vehicle
        User owner = new User();
        owner.setUserId(authUserId);
        v.setUser(owner);
        return vehicleRepo.save(v);
    }
}

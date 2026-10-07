package com.ecorouteoptimizer.demo.controller;

import com.ecorouteoptimizer.demo.service.AuthConfig;
import com.ecorouteoptimizer.demo.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired private RouteService routeService;

    @PostMapping("/calculate")
    public Map<String, Object> calculate(@RequestBody Map<String, Object> body,
                                         @RequestAttribute(AuthConfig.AUTH_USER_ID) Integer userId) {
        // userId comes from the login token; any userId in the body is ignored
        Integer vehicleId   = (Integer) body.get("vehicleId");
        String  origin      = (String)  body.get("origin");
        String  destination = (String)  body.get("destination");

        if (vehicleId == null) throw new IllegalArgumentException("vehicleId is required");
        if (origin == null || origin.isBlank()) throw new IllegalArgumentException("origin is required");
        if (destination == null || destination.isBlank()) throw new IllegalArgumentException("destination is required");

        return routeService.calculateRoute(userId, vehicleId, origin, destination);
    }

    @GetMapping("/history/{userId}")
    public Object history(@PathVariable Integer userId,
                          @RequestAttribute(AuthConfig.AUTH_USER_ID) Integer authUserId) {
        if (!userId.equals(authUserId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return routeService.getUserRoutes(userId);
    }
}
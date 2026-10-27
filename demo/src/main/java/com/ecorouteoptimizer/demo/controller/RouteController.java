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

    private static final int MAX_PLACE_LENGTH = 200;

    @Autowired private RouteService routeService;

    @PostMapping("/calculate")
    public Map<String, Object> calculate(@RequestBody Map<String, Object> body,
                                         @RequestAttribute(AuthConfig.AUTH_USER_ID) Integer userId) {
        // userId comes from the login token; any userId in the body is ignored
        // Junk is rejected here, before any DB lookup or paid API call
        if (!(body.get("vehicleId") instanceof Integer vehicleId)) throw new IllegalArgumentException("vehicleId is required");
        String origin      = place(body, "origin");
        String destination = place(body, "destination");

        return routeService.calculateRoute(userId, vehicleId, origin, destination);
    }

    private static String place(Map<String, Object> body, String field) {
        if (!(body.get(field) instanceof String s) || s.isBlank()) throw new IllegalArgumentException(field + " is required");
        if (s.length() > MAX_PLACE_LENGTH) throw new IllegalArgumentException(field + " is too long");
        return s.trim();
    }

    @GetMapping("/history/{userId}")
    public Object history(@PathVariable Integer userId,
                          @RequestAttribute(AuthConfig.AUTH_USER_ID) Integer authUserId) {
        if (!userId.equals(authUserId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return routeService.getUserRoutes(userId);
    }
}
package com.ecorouteoptimizer.demo.service;

import com.ecorouteoptimizer.demo.exception.ExternalApiException;
import com.ecorouteoptimizer.demo.model.*;
import com.ecorouteoptimizer.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class RouteService {

    @Autowired private RouteRepository      routeRepo;
    @Autowired private UserRepository       userRepo;
    @Autowired private VehicleRepository    vehicleRepo;
    @Autowired private WaypointRepository   waypointRepo;
    @Autowired private GoogleMapsService    mapsService;
    @Autowired private ClimatiqService      climatiqService;
    @Autowired private OpenAiService        openAiService;

    public Map<String, Object> calculateRoute(Integer userId, Integer vehicleId,
                                              String origin, String destination) {
        User    user    = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new NoSuchElementException("Vehicle not found: " + vehicleId));

        // 1. Get distance from Google Maps
        double distanceKm = mapsService.getDistanceKm(origin, destination);

        // 2. Get emission factor from Climatiq
        double kgCo2PerKm = climatiqService.getEmissionFactor(vehicle.getFuelType());
        double totalCo2   = distanceKm * kgCo2PerKm;

        // 3. Get AI recommendation from OpenAI (best-effort — don't block the core
        // distance/CO2 result if the AI provider is unavailable or out of quota)
        String recommendation;
        try {
            recommendation = openAiService.getEcoRecommendation(
                    origin, destination, vehicle.getFuelType(), distanceKm, totalCo2
            );
        } catch (ExternalApiException e) {
            recommendation = "Eco recommendation unavailable right now.";
        }

        // 4. Save route to DB
        Route route = new Route();
        route.setUser(user);
        route.setOrigin(origin);
        route.setDestination(destination);
        route.setCo2Emitted(totalCo2);
        routeRepo.save(route);

        // 5. Build response
        Map<String, Object> result = new HashMap<>();
        result.put("origin",         origin);
        result.put("destination",    destination);
        result.put("distanceKm",     distanceKm);
        result.put("co2EmittedKg",   totalCo2);
        result.put("fuelType",       vehicle.getFuelType());
        result.put("recommendation", recommendation);
        result.put("routeId",        route.getRouteId());
        return result;
    }

    public List<Route> getUserRoutes(Integer userId) {
        return routeRepo.findByUserUserId(userId);
    }
}
package com.ecorouteoptimizer.demo.service;

import com.ecorouteoptimizer.demo.exception.ExternalApiException;
import com.ecorouteoptimizer.demo.model.*;
import com.ecorouteoptimizer.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Service
public class RouteService {

    @Autowired private RouteRepository      routeRepo;
    @Autowired private UserRepository       userRepo;
    @Autowired private VehicleRepository    vehicleRepo;
    @Autowired private WaypointRepository   waypointRepo;
    @Autowired private MapTilerService      mapsService;
    @Autowired private ClimatiqService      climatiqService;
    @Autowired private OpenAiService        openAiService;

    // Repeated identical requests (refreshes, replays, bots) reuse earlier MapTiler/OSRM, Climatiq
    // and OpenAI results instead of paying for them again. Distances and emission factors don't change.
    private static final long CACHE_TTL_MS = 6 * 3_600_000L;
    private static final int  CACHE_MAX    = 2_000;
    private final Map<String, Object[]> cache = new ConcurrentHashMap<>(); // key -> {expiresAt, value}

    public Map<String, Object> calculateRoute(Integer userId, Integer vehicleId,
                                              String origin, String destination) {
        User    user    = userRepo.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        Vehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new NoSuchElementException("Vehicle not found: " + vehicleId));
        // Other users' vehicles look the same as missing ones
        if (vehicle.getUser() == null || !userId.equals(vehicle.getUser().getUserId()))
            throw new NoSuchElementException("Vehicle not found: " + vehicleId);

        // 1. Get driving distance (MapTiler geocoding + OSRM routing)
        String trip = origin.toLowerCase(Locale.ROOT) + "|" + destination.toLowerCase(Locale.ROOT);
        double distanceKm = cached("dist:" + trip, () -> mapsService.getDistanceKm(origin, destination));

        // 2. Get emission factor from Climatiq
        double kgCo2PerKm = cached("ef:" + vehicle.getFuelType(),
                () -> climatiqService.getEmissionFactor(vehicle.getFuelType()));
        double totalCo2   = distanceKm * kgCo2PerKm;

        // 3. Get AI recommendation from OpenAI (best-effort — don't block the core
        // distance/CO2 result if the AI provider is unavailable or out of quota)
        String recommendation;
        try {
            recommendation = cached("ai:" + trip + "|" + vehicle.getFuelType(),
                    () -> openAiService.getEcoRecommendation(
                            origin, destination, vehicle.getFuelType(), distanceKm, totalCo2));
        } catch (ExternalApiException e) {
            recommendation = "";
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

    // Failures throw, so they are never cached
    @SuppressWarnings("unchecked")
    private <T> T cached(String key, Supplier<T> load) {
        long now = System.currentTimeMillis();
        Object[] hit = cache.get(key);
        if (hit != null && (long) hit[0] > now) return (T) hit[1];
        T value = load.get();
        if (cache.size() >= CACHE_MAX) cache.values().removeIf(e -> (long) e[0] <= now);
        if (cache.size() < CACHE_MAX) cache.put(key, new Object[]{now + CACHE_TTL_MS, value});
        return value;
    }

    public List<Route> getUserRoutes(Integer userId) {
        return routeRepo.findByUserUserId(userId);
    }
}
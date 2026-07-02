package com.ecorouteoptimizer.demo.service;

import com.ecorouteoptimizer.demo.exception.ExternalApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Service
public class GoogleMapsService {

    @Autowired private WebClient webClient;
    @Autowired private ApiConfig apiConfig;

    // The legacy Distance Matrix API is not enabled on this project's Google Cloud key
    // (it returns REQUEST_DENIED telling callers to switch to Routes API), so this calls
    // the Routes API's computeRoutes endpoint instead.
    public double getDistanceKm(String origin, String destination) {
        Map<String, Object> body = Map.of(
                "origin", Map.of("address", origin),
                "destination", Map.of("address", destination),
                "travelMode", "DRIVE"
        );

        Map response;
        try {
            response = webClient.post()
                    .uri("https://routes.googleapis.com/directions/v2:computeRoutes")
                    .header("X-Goog-Api-Key", apiConfig.googleKey)
                    .header("X-Goog-FieldMask", "routes.distanceMeters")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            throw new ExternalApiException("Google Routes API request failed: " + e.getMessage(), e);
        }

        try {
            List routes = (List) response.get("routes");
            if (routes == null || routes.isEmpty()) {
                throw new ExternalApiException(
                        "Could not compute a route between '" + origin + "' and '" + destination + "'");
            }
            Map route = (Map) routes.get(0);
            int meters = ((Number) route.get("distanceMeters")).intValue();
            return meters / 1000.0;
        } catch (ExternalApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalApiException("Google Routes API returned an unexpected response shape: " + e.getMessage(), e);
        }
    }
}
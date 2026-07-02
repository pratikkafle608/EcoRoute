package com.ecorouteoptimizer.demo.service;

import com.ecorouteoptimizer.demo.exception.ExternalApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Map;

@Service
public class ClimatiqService {

    @Autowired private WebClient webClient;
    @Autowired private ApiConfig apiConfig;

    // Returns kg CO2e per km for a given fuel type
    public double getEmissionFactor(String fuelType) {
        // Climatiq activity IDs — map fuel type to their emission factor IDs
        String activityId = switch (fuelType.toLowerCase()) {
            case "diesel"   -> "passenger_vehicle-vehicle_type_car-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na";
            case "electric" -> "passenger_vehicle-vehicle_type_car-fuel_source_bev-engine_size_na-vehicle_age_na-vehicle_weight_na";
            default         -> "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na";
        };

        Map<String, Object> body = Map.of(
                "emission_factor", Map.of(
                        "activity_id", activityId,
                        "data_version", "^34",
                        "source",      "BEIS",
                        "region",      "GB",
                        "year",        2024,
                        "source_lca_activity", "fuel_combustion"
                ),
                "parameters", Map.of("distance", 1, "distance_unit", "km")
        );

        Map response;
        try {
            response = webClient.post()
                    .uri("https://api.climatiq.io/data/v1/estimate")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiConfig.climatiqKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            throw new ExternalApiException("Climatiq API request failed: " + e.getMessage(), e);
        }

        Object co2e = response == null ? null : response.get("co2e");
        if (!(co2e instanceof Number)) {
            throw new ExternalApiException("Climatiq API returned an unexpected response: " + response);
        }
        return ((Number) co2e).doubleValue();
    }
}
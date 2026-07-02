package com.ecorouteoptimizer.demo.service;

import com.ecorouteoptimizer.demo.exception.ExternalApiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    @Autowired private WebClient webClient;
    @Autowired private ApiConfig apiConfig;

    public String getEcoRecommendation(String origin, String destination,
                                       String fuelType, double distanceKm, double co2Kg) {
        String prompt = String.format(
                "You are an eco-routing assistant. A %s vehicle is traveling from %s to %s, " +
                        "a distance of %.1f km, emitting %.2f kg CO2. " +
                        "Provide a brief recommendation on how to reduce emissions for this trip " +
                        "(e.g. route tips, speed advice, alternative transport). Keep it under 3 sentences.",
                fuelType, origin, destination, distanceKm, co2Kg
        );

        Map<String, Object> body = Map.of(
                "model", apiConfig.openaiModel,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", 150
        );

        Map response;
        try {
            response = webClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiConfig.openaiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            throw new ExternalApiException("OpenAI API request failed: " + e.getMessage(), e);
        }

        try {
            var choices = (List) response.get("choices");
            var message = (Map) ((Map) choices.get(0)).get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            throw new ExternalApiException("OpenAI API returned an unexpected response: " + response);
        }
    }
}
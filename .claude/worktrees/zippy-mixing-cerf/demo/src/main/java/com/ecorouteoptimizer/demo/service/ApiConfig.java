package com.ecorouteoptimizer.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ApiConfig {
    @Value("${google.maps.api.key}")
    public String googleKey;

    @Value("${climatiq.api.key}")
    public String climatiqKey;

    @Value("${spring.ai.openai.api-key}")
    public String openaiKey;

    @Value("${spring.ai.openai.chat.options.model:gpt-4o-mini}")
    public String openaiModel;

    @Bean public WebClient webClient() {
        return WebClient.builder().build();
    }
}
package com.ecorouteoptimizer.demo; // Change package name to match your project structure

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    // Vite dev server (port varies if 5173 is taken) plus the public Tailscale Funnel site. Funnel serves
    // https but the backend sees http, so Spring treats those requests as cross-origin and needs them listed.
    @Value("${cors.allowed-origins:http://localhost:*,https://*.tail3e22ba.ts.net}")
    private String[] allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allows all endpoints (/api/users, /api/routes, etc.)
                        .allowedOriginPatterns(allowedOrigins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
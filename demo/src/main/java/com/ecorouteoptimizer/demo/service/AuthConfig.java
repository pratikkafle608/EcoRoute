package com.ecorouteoptimizer.demo.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Every /api endpoint except login and signup needs "Authorization: Bearer <token>".
// The verified user id is exposed to controllers as the AUTH_USER_ID request attribute;
// controllers must use it instead of any user id sent by the client.
@Configuration
public class AuthConfig implements WebMvcConfigurer {

    public static final String AUTH_USER_ID = "authUserId";

    @Autowired private AuthTokens tokens;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
                if ("OPTIONS".equals(req.getMethod())) return true; // CORS preflight carries no token
                String header = req.getHeader("Authorization");
                Integer userId = header != null && header.startsWith("Bearer ")
                        ? tokens.verify(header.substring(7)) : null;
                if (userId != null) {
                    req.setAttribute(AUTH_USER_ID, userId);
                    return true;
                }
                res.setStatus(401);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Please log in again.\"}");
                return false;
            }
        }).addPathPatterns("/api/**").excludePathPatterns("/api/login", "/api/signup");
    }
}

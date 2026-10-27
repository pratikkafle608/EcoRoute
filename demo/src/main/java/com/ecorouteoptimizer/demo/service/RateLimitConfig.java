package com.ecorouteoptimizer.demo.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// In-memory fixed-window rate limits. /api/routes/calculate spends paid OpenAI/Climatiq calls,
// and /api/login + /api/signup are brute-force targets, so all three are capped per client.
// Calculate is also capped per logged-in user (one account can't flood from many IPs) and
// site-wide per hour and per day, so even a spread-out botnet can't run up the API bill.
// Runs after AuthConfig, so requests without a valid token are rejected before reaching here.
@Configuration
public class RateLimitConfig implements WebMvcConfigurer {

    private static final long MINUTE = 60_000, HOUR = 3_600_000, DAY = 86_400_000;

    @Value("${ratelimit.calculate.per-client-per-minute:10}") int calculatePerClient;
    @Value("${ratelimit.calculate.per-user-per-hour:30}")     int calculatePerUser;
    @Value("${ratelimit.calculate.global-per-hour:100}")      int calculateGlobal;
    @Value("${ratelimit.calculate.global-per-day:500}")       int calculateGlobalDaily;
    @Value("${ratelimit.auth.per-client-per-minute:20}")      int authPerClient;

    private final Map<String, long[]> windows = new ConcurrentHashMap<>(); // key -> {windowStart, count}

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
                if ("OPTIONS".equals(req.getMethod())) return true; // CORS preflight
                String path = req.getRequestURI();
                String client = clientIp(req);

                boolean ok = path.startsWith("/api/routes/calculate")
                        ? allow("calc:" + client, calculatePerClient, MINUTE)
                            && allow("calc-user:" + req.getAttribute(AuthConfig.AUTH_USER_ID), calculatePerUser, HOUR)
                            && allow("calc:*", calculateGlobal, HOUR)
                            && allow("calc:*day", calculateGlobalDaily, DAY)
                        : allow("auth:" + client, authPerClient, MINUTE);
                if (ok) return true;

                res.setStatus(429);
                res.setHeader("Retry-After", "60");
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Too many requests. Please wait a minute and try again.\"}");
                return false;
            }
        }).addPathPatterns("/api/routes/calculate", "/api/login", "/api/signup").order(1);
    }

    private boolean allow(String key, int limit, long windowMs) {
        long now = System.currentTimeMillis();
        if (windows.size() > 10_000) windows.values().removeIf(w -> now - w[0] >= DAY); // drop stale clients
        long[] w = windows.compute(key, (k, cur) ->
                cur == null || now - cur[0] >= windowMs ? new long[]{now, 1} : new long[]{cur[0], cur[1] + 1});
        return w[1] <= limit;
    }

    // nginx overwrites X-Real-IP with the real client address (resolved from Funnel's X-Forwarded-For),
    // and the backend isn't published directly, so clients can't set it themselves
    private static String clientIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Real-IP");
        return ip != null && !ip.isBlank() ? ip : req.getRemoteAddr();
    }
}

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
// Calculate also has a site-wide cap: behind Tailscale Funnel every visitor can share one IP,
// so the per-client limit alone wouldn't bound the API bill.
@Configuration
public class RateLimitConfig implements WebMvcConfigurer {

    private static final long MINUTE = 60_000, HOUR = 3_600_000;

    @Value("${ratelimit.calculate.per-client-per-minute:10}") int calculatePerClient;
    @Value("${ratelimit.calculate.global-per-hour:100}")      int calculateGlobal;
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
                        ? allow("calc:" + client, calculatePerClient, MINUTE) && allow("calc:*", calculateGlobal, HOUR)
                        : allow("auth:" + client, authPerClient, MINUTE);
                if (ok) return true;

                res.setStatus(429);
                res.setHeader("Retry-After", "60");
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Too many requests. Please wait a minute and try again.\"}");
                return false;
            }
        }).addPathPatterns("/api/routes/calculate", "/api/login", "/api/signup");
    }

    private boolean allow(String key, int limit, long windowMs) {
        long now = System.currentTimeMillis();
        if (windows.size() > 10_000) windows.values().removeIf(w -> now - w[0] >= HOUR); // drop stale clients
        long[] w = windows.compute(key, (k, cur) ->
                cur == null || now - cur[0] >= windowMs ? new long[]{now, 1} : new long[]{cur[0], cur[1] + 1});
        return w[1] <= limit;
    }

    // nginx overwrites X-Real-IP with the real peer address, and the backend isn't published directly
    private static String clientIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Real-IP");
        return ip != null && !ip.isBlank() ? ip : req.getRemoteAddr();
    }
}

package com.ecorouteoptimizer.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Per-account brute-force guard: after too many failed logins for one email, that email is locked
// for a while no matter which IP the attempts come from (the per-IP limits can't catch a botnet
// spraying one account). Unknown emails count too, so they can't be probed endlessly either.
@Service
public class LoginThrottle {

    @Value("${login.max-failures:5}")  int maxFailures;
    @Value("${login.lock-minutes:15}") long lockMinutes;

    private final Map<String, long[]> failures = new ConcurrentHashMap<>(); // email -> {firstFailure, count}

    public boolean isLocked(String email) {
        long[] f = failures.get(key(email));
        if (f == null) return false;
        if (expired(f)) {
            failures.remove(key(email), f);
            return false;
        }
        return f[1] >= maxFailures;
    }

    public void recordFailure(String email) {
        long now = System.currentTimeMillis();
        if (failures.size() > 10_000) failures.values().removeIf(this::expired);
        failures.compute(key(email), (k, cur) ->
                cur == null || expired(cur) ? new long[]{now, 1} : new long[]{cur[0], cur[1] + 1});
    }

    public void recordSuccess(String email) {
        failures.remove(key(email));
    }

    private boolean expired(long[] f) {
        return System.currentTimeMillis() - f[0] >= lockMinutes * 60_000;
    }

    private static String key(String email) {
        return email.toLowerCase(Locale.ROOT);
    }
}

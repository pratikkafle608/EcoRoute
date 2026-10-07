package com.ecorouteoptimizer.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

// Stateless signed login tokens: base64url("<userId>:<expiryEpochSeconds>") + "." + base64url(HMAC-SHA256).
// Every backend instance that should accept the same tokens needs the same AUTH_TOKEN_SECRET.
@Service
public class AuthTokens {

    private static final Logger log = LoggerFactory.getLogger(AuthTokens.class);
    private static final Duration TTL = Duration.ofDays(7);
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();

    private final byte[] secret;

    public AuthTokens(@Value("${auth.token-secret:}") String configured) {
        if (configured.isBlank()) {
            // Still secure, but every restart logs everyone out - set AUTH_TOKEN_SECRET to avoid that
            secret = new byte[32];
            new SecureRandom().nextBytes(secret);
            log.warn("AUTH_TOKEN_SECRET is not set; using a random key, so logins reset on every restart");
        } else {
            secret = configured.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String issue(Integer userId) {
        String payload = B64.encodeToString(
                (userId + ":" + Instant.now().plus(TTL).getEpochSecond()).getBytes(StandardCharsets.UTF_8));
        return payload + "." + sign(payload);
    }

    /** Returns the user id, or null if the token is missing, forged, malformed or expired. */
    public Integer verify(String token) {
        if (token == null) return null;
        int dot = token.indexOf('.');
        if (dot <= 0) return null;
        String payload = token.substring(0, dot);
        byte[] expected = sign(payload).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, token.substring(dot + 1).getBytes(StandardCharsets.UTF_8))) return null;
        try {
            String[] parts = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8).split(":");
            if (Instant.now().getEpochSecond() > Long.parseLong(parts[1])) return null;
            return Integer.valueOf(parts[0]);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return B64.encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 unavailable", e);
        }
    }
}

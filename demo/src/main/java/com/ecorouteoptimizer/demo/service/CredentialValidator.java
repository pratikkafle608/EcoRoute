package com.ecorouteoptimizer.demo.service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Pattern;

// Validates login/signup input before it reaches the database. SQL injection itself is already
// blocked because every query is parameterized (Spring Data derived queries, JdbcTemplate "?"
// placeholders); this rejects malformed, oversized or non-string input up front as a second layer.
// Passwords are never pattern-restricted: they are only ever BCrypt-hashed, never put in SQL, and
// banning characters like ' or ; would just weaken them.
public final class CredentialValidator {

    private static final int EMAIL_MAX = 254;
    private static final int NAME_MAX = 100;
    private static final int PASSWORD_MIN = 8;
    private static final int PASSWORD_MAX_BYTES = 72; // BCrypt ignores everything past 72 bytes
    private static final int LOGIN_PASSWORD_MAX = 1024; // just bounds the work; BCrypt only reads 72 bytes

    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$");
    // Letters (any language), spaces, apostrophes, hyphens and periods, starting with a letter
    private static final Pattern NAME = Pattern.compile("^\\p{L}[\\p{L} .'-]*$");
    private static final Pattern CONTROL_CHARS = Pattern.compile("\\p{Cntrl}");

    private CredentialValidator() {}

    // Returns the field as a trimmed string, or throws if it is missing or not a JSON string
    public static String text(Map<String, Object> body, String field) {
        return raw(body, field).trim();
    }

    // Same, but untrimmed - for passwords, where leading/trailing spaces are part of the secret
    public static String raw(Map<String, Object> body, String field) {
        Object v = body == null ? null : body.get(field);
        if (!(v instanceof String s) || s.isBlank()) throw new IllegalArgumentException(field + " is required");
        return s;
    }

    public static String email(String email) {
        if (email.length() > EMAIL_MAX || !EMAIL.matcher(email).matches()) {
            throw new IllegalArgumentException("Enter a valid email address");
        }
        return email;
    }

    // Login: only a length bound, no format check - accounts created before the signup rules existed
    // may have emails the strict pattern rejects, and they must still be able to log in
    public static String loginEmail(String email) {
        if (email.length() > EMAIL_MAX) throw new IllegalArgumentException("Enter a valid email address");
        return email;
    }

    public static String name(String name) {
        if (name.length() > NAME_MAX || !NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("Name may only contain letters, spaces, apostrophes, hyphens and periods (max " + NAME_MAX + ")");
        }
        return name;
    }

    // Login: only a generous length bound. Older passwords may be over 72 bytes or contain control
    // characters (they were hashed before these rules existed) and must keep working
    public static String loginPassword(String password) {
        if (password.length() > LOGIN_PASSWORD_MAX) throw new IllegalArgumentException("Invalid password");
        return password;
    }

    public static String newPassword(String password) {
        if (password.length() < PASSWORD_MIN) {
            throw new IllegalArgumentException("Password must be at least " + PASSWORD_MIN + " characters");
        }
        if (bytes(password) > PASSWORD_MAX_BYTES) {
            throw new IllegalArgumentException("Password must be at most " + PASSWORD_MAX_BYTES + " bytes");
        }
        if (CONTROL_CHARS.matcher(password).find()) {
            throw new IllegalArgumentException("Password contains invalid characters");
        }
        return password;
    }

    private static int bytes(String s) {
        return s.getBytes(StandardCharsets.UTF_8).length;
    }
}

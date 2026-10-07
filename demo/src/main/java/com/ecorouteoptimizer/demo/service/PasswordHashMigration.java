package com.ecorouteoptimizer.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

// Passwords used to be stored in plain text in a varchar(50) column. On startup this widens the
// column to fit BCrypt hashes (ddl-auto=update never alters lengths) and hashes any plain-text rows.
// Idempotent: already-hashed rows ($2a$/$2b$/$2y$ prefix) are skipped, so it is safe on every boot.
@Configuration
public class PasswordHashMigration {

    private static final Logger log = LoggerFactory.getLogger(PasswordHashMigration.class);

    @Bean public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean ApplicationRunner hashPlainTextPasswords(JdbcTemplate jdbc, PasswordEncoder encoder) {
        return (ApplicationArguments args) -> {
            List<Integer> len = jdbc.queryForList(
                    "select character_maximum_length from information_schema.columns "
                            + "where table_name = 'passwords' and column_name = 'password'", Integer.class);
            if (!len.isEmpty() && len.get(0) != null && len.get(0) < 100) {
                jdbc.execute("alter table passwords alter column \"password\" type varchar(100)");
                log.info("Widened passwords.password to varchar(100) for BCrypt hashes");
            }

            List<Map<String, Object>> plain = jdbc.queryForList(
                    "select password_id, \"password\" from passwords where \"password\" not like '$2_$%'");
            for (Map<String, Object> row : plain) {
                String pw = (String) row.get("password");
                // match on the old value too, so a concurrent instance doing the same can't double-hash
                jdbc.update("update passwords set \"password\" = ? where password_id = ? and \"password\" = ?",
                        encoder.encode(pw), row.get("password_id"), pw);
            }
            if (!plain.isEmpty()) log.info("Hashed {} plain-text password(s) with BCrypt", plain.size());
        };
    }
}

package com.ecorouteoptimizer.demo.repository;

import com.ecorouteoptimizer.demo.model.Password;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordRepository extends JpaRepository<Password, Integer> {
    Optional<Password> findByUserUserId(Integer userId);
}

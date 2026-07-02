package com.ecorouteoptimizer.demo.repository;
import com.ecorouteoptimizer.demo.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    List<Vehicle> findByUserUserId(Integer userId);
}
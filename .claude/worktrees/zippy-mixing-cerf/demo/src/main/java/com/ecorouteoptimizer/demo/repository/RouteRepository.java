package com.ecorouteoptimizer.demo.repository;
import com.ecorouteoptimizer.demo.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RouteRepository extends JpaRepository<Route, Integer> {
    List<Route> findByUserUserId(Integer userId);
}

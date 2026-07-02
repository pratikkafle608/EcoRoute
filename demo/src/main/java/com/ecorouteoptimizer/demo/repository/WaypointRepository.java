package com.ecorouteoptimizer.demo.repository;
import com.ecorouteoptimizer.demo.model.Waypoint;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WaypointRepository extends JpaRepository<Waypoint, Integer> {}

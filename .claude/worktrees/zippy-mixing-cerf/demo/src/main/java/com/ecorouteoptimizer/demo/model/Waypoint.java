package com.ecorouteoptimizer.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity @Table(name = "waypoints") @Data
public class Waypoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer waypointsId;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;

    private Double latitude;
    private Double longitude;
    private Integer sequence;
}

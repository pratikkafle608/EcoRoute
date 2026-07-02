package com.ecorouteoptimizer.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity @Table(name = "routes") @Data
public class Route {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer routeId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String origin;
    private String destination;
    private Double co2Emitted;
}
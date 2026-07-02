package com.ecorouteoptimizer.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "passwords")
@Data
public class Password {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "password_id")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "`password`", nullable = false)
    private String password;
}

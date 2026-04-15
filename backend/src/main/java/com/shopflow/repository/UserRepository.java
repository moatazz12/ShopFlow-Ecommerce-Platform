package com.shopflow.repository;

import com.shopflow.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Indispensable pour la future sécurité JWT
    Optional<User> findByEmail(String email);
}
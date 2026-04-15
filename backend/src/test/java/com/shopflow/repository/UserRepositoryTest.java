package com.shopflow.repository;

import com.shopflow.BackendApplication;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ContextConfiguration;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ContextConfiguration(classes = BackendApplication.class)
@SuppressWarnings("null")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByEmailReturnsPersistedUser() {
        User user = User.builder()
                .email("repo-user@shopflow.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .actif(true)
                .build();
        userRepository.save(user);

        Optional<User> result = userRepository.findByEmail("repo-user@shopflow.com");

        assertTrue(result.isPresent());
    }
}

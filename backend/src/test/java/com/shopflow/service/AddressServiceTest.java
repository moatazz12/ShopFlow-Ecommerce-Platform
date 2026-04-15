package com.shopflow.service;

import com.shopflow.dto.AddressDTO;
import com.shopflow.dto.AddressRequest;
import com.shopflow.entities.Address;
import com.shopflow.entities.ShippingAddress;
import com.shopflow.entities.User;
import com.shopflow.repository.AddressRepository;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AddressServiceImpl addressService;

    private User user;
    private ShippingAddress address;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("customer@test.com");

        address = new ShippingAddress();
        address.setId(10L);
        address.setRue("Rue 1");
        address.setVille("Tunis");
        address.setCodePostal("1000");
        address.setPays("TN");
        address.setPrincipal(true);
        address.setUser(user);
    }

    @Test
    void addAddressCreatesShippingAddress() {
        AddressRequest request = new AddressRequest();
        request.setRue("Rue 1");
        request.setVille("Tunis");
        request.setCodePostal("1000");
        request.setPays("TN");
        request.setPrincipal(true);
        request.setType("SHIPPING");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(addressRepository.findByUserEmail(user.getEmail())).thenReturn(List.of());
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        AddressDTO result = addressService.addAddress(user.getEmail(), request);

        assertEquals("SHIPPING", result.getType());
        assertEquals(true, result.isPrincipal());
    }

    @Test
    void setDefaultAddressMarksAddressAsPrincipal() {
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));
        when(addressRepository.findByUserEmail(user.getEmail())).thenReturn(List.of(address));
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddressDTO result = addressService.setDefaultAddress(user.getEmail(), 10L);

        assertEquals(true, result.isPrincipal());
    }

    @Test
    void deleteAddressFailsForAnotherUser() {
        User other = new User();
        other.setEmail("other@test.com");
        address.setUser(other);
        when(addressRepository.findById(10L)).thenReturn(Optional.of(address));

        assertThrows(ResponseStatusException.class, () -> addressService.deleteAddress(user.getEmail(), 10L));
    }

    @Test
    void getMyAddressesReturnsDtos() {
        when(addressRepository.findByUserEmail(user.getEmail())).thenReturn(List.of(address));

        List<AddressDTO> result = addressService.getMyAddresses(user.getEmail());

        assertEquals(1, result.size());
        verify(addressRepository).findByUserEmail(user.getEmail());
    }
}

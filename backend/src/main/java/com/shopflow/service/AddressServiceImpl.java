package com.shopflow.service;

import com.shopflow.dto.AddressDTO;
import com.shopflow.dto.AddressRequest;
import com.shopflow.entities.Address;
import com.shopflow.entities.BillingAddress;
import com.shopflow.entities.ShippingAddress;
import com.shopflow.entities.User;
import com.shopflow.repository.AddressRepository;
import com.shopflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AddressDTO> getMyAddresses(String userEmail) {
        return addressRepository.findByUserEmail(userEmail).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public AddressDTO addAddress(String userEmail, AddressRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur non trouve"));

        Address address = createAddressByType(request.getType());
        address.setRue(request.getRue());
        address.setVille(request.getVille());
        address.setCodePostal(request.getCodePostal());
        address.setPays(request.getPays());
        address.setPrincipal(Boolean.TRUE.equals(request.getPrincipal()));
        address.setUser(user);

        if (address.isPrincipal()) {
            addressRepository.findByUserEmail(userEmail).forEach(existing -> existing.setPrincipal(false));
        }

        return toDto(addressRepository.save(address));
    }

    @Override
    public void deleteAddress(String userEmail, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Adresse non trouvee"));
        if (address.getUser() == null || !userEmail.equals(address.getUser().getEmail())) {
            throw new ResponseStatusException(BAD_REQUEST, "Adresse invalide pour cet utilisateur");
        }

        // Au lieu de supprimer physiquement (ce qui casserait les commandes liees),
        // on desassocie l'adresse de l'utilisateur pour qu'elle n'apparaisse plus dans
        // son profil.
        address.setUser(null);
        address.setPrincipal(false);
        addressRepository.save(address);
    }

    @Override
    public AddressDTO setDefaultAddress(String userEmail, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Adresse non trouvee"));
        if (address.getUser() == null || !userEmail.equals(address.getUser().getEmail())) {
            throw new ResponseStatusException(BAD_REQUEST, "Adresse invalide pour cet utilisateur");
        }

        addressRepository.findByUserEmail(userEmail).forEach(existing -> existing.setPrincipal(false));
        address.setPrincipal(true);
        return toDto(addressRepository.save(address));
    }

    private Address createAddressByType(String type) {
        if ("SHIPPING".equalsIgnoreCase(type)) {
            return new ShippingAddress();
        }
        if ("BILLING".equalsIgnoreCase(type)) {
            return new BillingAddress();
        }
        throw new ResponseStatusException(BAD_REQUEST, "Type d'adresse invalide");
    }

    private AddressDTO toDto(Address address) {
        return AddressDTO.builder()
                .id(address.getId())
                .rue(address.getRue())
                .ville(address.getVille())
                .codePostal(address.getCodePostal())
                .pays(address.getPays())
                .principal(address.isPrincipal())
                .type(address.getClass().getSimpleName().replace("Address", "").toUpperCase())
                .build();
    }
}

package com.shopflow.controller;

import com.shopflow.dto.AddressDTO;
import com.shopflow.dto.AddressRequest;
import com.shopflow.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@Tag(name = "Addresses", description = "APIs de gestion des adresses utilisateur")
@PreAuthorize("isAuthenticated()")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "Afficher les adresses de l'utilisateur connecte")
    @ApiResponse(responseCode = "200", description = "Liste des adresses")
    public ResponseEntity<List<AddressDTO>> getMyAddresses(Authentication authentication) {
        return ResponseEntity.ok(addressService.getMyAddresses(authentication.getName()));
    }

    @PostMapping
    @Operation(summary = "Ajouter une adresse")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Adresse creee"),
            @ApiResponse(responseCode = "400", description = "Type ou donnees invalides"),
            @ApiResponse(responseCode = "401", description = "Authentification requise")
    })
    public ResponseEntity<AddressDTO> addAddress(Authentication authentication,
                                                 @Valid @RequestBody AddressRequest request) {
        AddressDTO createdAddress = addressService.addAddress(authentication.getName(), request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdAddress.getId())
                .toUri();
        return ResponseEntity.created(location).body(createdAddress);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une adresse de l'utilisateur connecte")
    @ApiResponse(responseCode = "204", description = "Adresse supprimee")
    public ResponseEntity<Void> deleteAddress(Authentication authentication, @PathVariable Long id) {
        addressService.deleteAddress(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Definir une adresse par defaut")
    @ApiResponse(responseCode = "200", description = "Adresse par defaut mise a jour")
    public ResponseEntity<AddressDTO> setDefaultAddress(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(addressService.setDefaultAddress(authentication.getName(), id));
    }
}

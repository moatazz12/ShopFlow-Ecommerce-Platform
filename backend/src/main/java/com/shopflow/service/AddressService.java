package com.shopflow.service;

import com.shopflow.dto.AddressDTO;
import com.shopflow.dto.AddressRequest;

import java.util.List;

public interface AddressService {
    List<AddressDTO> getMyAddresses(String userEmail);

    AddressDTO addAddress(String userEmail, AddressRequest request);

    void deleteAddress(String userEmail, Long addressId);

    AddressDTO setDefaultAddress(String userEmail, Long addressId);
}

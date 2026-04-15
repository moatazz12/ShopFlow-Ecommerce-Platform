package com.shopflow.mapper;

import com.shopflow.dto.UserDTO;
import com.shopflow.entities.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @org.mapstruct.Mapping(target = "shopName", expression = "java(user.getSellerProfile() != null ? user.getSellerProfile().getNomBoutique() : user.getShopName())")
    @org.mapstruct.Mapping(target = "shopDescription", expression = "java(user.getSellerProfile() != null ? user.getSellerProfile().getDescription() : user.getShopDescription())")
    @org.mapstruct.Mapping(target = "shopLogo", expression = "java(user.getSellerProfile() != null ? user.getSellerProfile().getLogo() : user.getShopLogo())")
    UserDTO toDto(User user);

    @org.mapstruct.Mapping(target = "addresses", ignore = true)
    @org.mapstruct.Mapping(target = "dateCreation", ignore = true)
    @org.mapstruct.Mapping(target = "password", ignore = true)
    @org.mapstruct.Mapping(target = "products", ignore = true)
    @org.mapstruct.Mapping(target = "sellerProfile", ignore = true)
    User toEntity(UserDTO userDto);
}

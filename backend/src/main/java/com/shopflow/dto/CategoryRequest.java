package com.shopflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    private String nom;

    private String description;

    private Long parentId;
}

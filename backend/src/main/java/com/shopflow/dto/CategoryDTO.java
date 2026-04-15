package com.shopflow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CategoryDTO {
    private Long id;
    private String nom;
    private String description;
    private Long parentId;
    private List<CategoryDTO> subCategories;
}

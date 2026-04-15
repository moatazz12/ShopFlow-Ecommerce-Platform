package com.shopflow.service;

import com.shopflow.dto.CategoryDTO;
import com.shopflow.dto.CategoryRequest;

import java.util.List;

public interface CategoryService {
    List<CategoryDTO> getCategoryTree();

    List<CategoryDTO> getAllCategories();

    CategoryDTO createCategory(CategoryRequest request);

    CategoryDTO updateCategory(Long id, CategoryRequest request);

    void deleteCategory(Long id);
}

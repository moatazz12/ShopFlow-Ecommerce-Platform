package com.shopflow.service;

import com.shopflow.dto.CategoryDTO;
import com.shopflow.dto.CategoryRequest;
import com.shopflow.entities.Category;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category parent;
    private Category child;

    @BeforeEach
    void setUp() {
        parent = Category.builder()
                .id(1L)
                .nom("SPORT")
                .description("Sport")
                .subCategories(new ArrayList<>())
                .build();

        child = Category.builder()
                .id(2L)
                .nom("CHAUSSURES")
                .description("Chaussures")
                .parent(parent)
                .subCategories(new ArrayList<>())
                .build();
        parent.getSubCategories().add(child);
    }

    @Test
    void getCategoryTreeReturnsNestedTree() {
        when(categoryRepository.findByParentIsNull()).thenReturn(List.of(parent));

        List<CategoryDTO> result = categoryService.getCategoryTree();

        assertEquals(1, result.size());
        assertEquals("SPORT", result.get(0).getNom());
        assertEquals(1, result.get(0).getSubCategories().size());
    }

    @Test
    void createCategoryWithParentSucceeds() {
        CategoryRequest request = new CategoryRequest();
        request.setNom("ACCESSOIRES");
        request.setDescription("Accessoires");
        request.setParentId(1L);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(parent));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            saved.setId(3L);
            return saved;
        });

        CategoryDTO result = categoryService.createCategory(request);

        assertEquals("ACCESSOIRES", result.getNom());
        assertEquals(1L, result.getParentId());
    }

    @Test
    void updateCategoryWithoutParentRemovesParent() {
        CategoryRequest request = new CategoryRequest();
        request.setNom("CHAUSSURES MAJ");
        request.setDescription("Maj");

        when(categoryRepository.findById(2L)).thenReturn(Optional.of(child));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryDTO result = categoryService.updateCategory(2L, request);

        assertEquals("CHAUSSURES MAJ", result.getNom());
        assertEquals(null, result.getParentId());
    }

    @Test
    void deleteCategoryThrowsWhenMissing() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.deleteCategory(99L));
    }

    @Test
    void getAllCategoriesReturnsFlatDtos() {
        when(categoryRepository.findAll(any(Sort.class))).thenReturn(List.of(parent, child));

        List<CategoryDTO> result = categoryService.getAllCategories();

        assertEquals(2, result.size());
        assertEquals(0, result.get(0).getSubCategories().size());
        verify(categoryRepository).findAll(any(Sort.class));
    }
}

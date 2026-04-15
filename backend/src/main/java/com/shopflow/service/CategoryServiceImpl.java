package com.shopflow.service;

import com.shopflow.dto.CategoryDTO;
import com.shopflow.dto.CategoryRequest;
import com.shopflow.entities.Category;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getCategoryTree() {
        return categoryRepository.findByParentIsNull().stream()
                .sorted(java.util.Comparator.comparing(Category::getId))
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll(org.springframework.data.domain.Sort.by("id")).stream()
                .map(this::toFlatDto)
                .toList();
    }

    @Override
    public CategoryDTO createCategory(CategoryRequest request) {
        Category category = Category.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .build();

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie parente non trouvee"));
            category.setParent(parent);
        }

        return toFlatDto(categoryRepository.save(category));
    }

    @Override
    public CategoryDTO updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categorie non trouvee"));
        category.setNom(request.getNom());
        category.setDescription(request.getDescription());
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categorie parente non trouvee"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        return toFlatDto(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categorie non trouvee"));

        // Supprimer explicitement les associations dans la table de jointure pour
        // éviter les erreurs de clé étrangère
        categoryRepository.deleteAssociationsInProductCategory(id);

        categoryRepository.delete(category);
    }

    private CategoryDTO toDto(Category category) {
        List<CategoryDTO> children = category.getSubCategories() == null
                ? List.of()
                : category.getSubCategories().stream().map(this::toDto).toList();

        return CategoryDTO.builder()
                .id(category.getId())
                .nom(category.getNom())
                .description(category.getDescription())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .subCategories(children)
                .build();
    }

    private CategoryDTO toFlatDto(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .nom(category.getNom())
                .description(category.getDescription())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .subCategories(List.of())
                .build();
    }
}

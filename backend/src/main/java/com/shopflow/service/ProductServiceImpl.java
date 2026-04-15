package com.shopflow.service;

import com.shopflow.dto.ProductDTO;
import com.shopflow.dto.ReviewDTO;
import com.shopflow.entities.Category;
import com.shopflow.entities.Product;
import com.shopflow.entities.ProductVariant;
import com.shopflow.entities.User;
import com.shopflow.exception.BadRequestException;
import com.shopflow.exception.ResourceNotFoundException;
import com.shopflow.mapper.ProductMapper;
import com.shopflow.repository.CategoryRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.ReviewRepository;
import com.shopflow.repository.UserRepository;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopflow.repository.CustomerOrderRepository;
import org.springframework.data.domain.PageImpl;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final ReviewRepository reviewRepository;
    private final CustomerOrderRepository customerOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        return productRepository.findByActifTrue(pageable)
                .map(this::toProductDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String q, String category, Double minPrice, Double maxPrice,
            Boolean promotionOnly, String sortBy, Long sellerId, Pageable pageable) {
        if ("popularity".equalsIgnoreCase(sortBy)
                && q == null && category == null && minPrice == null && maxPrice == null && sellerId == null
                && (promotionOnly == null || !promotionOnly)) {
            List<Product> all = productRepository.findPopularActiveProductsNative();
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), all.size());
            List<Product> paged = start >= all.size() ? List.of() : all.subList(start, end);
            List<ProductDTO> dtos = paged.stream().map(this::toProductDto).toList();
            return new PageImpl<>(dtos, pageable, all.size());
        }

        Pageable sortedPageable = withSort(pageable, sortBy);
        Specification<Product> spec = (root, query, cb) -> {
            if (sellerId != null) {
                // Si on cherche les produits d'un vendeur, on affiche TOUT (actif et inactif)
                return cb.conjunction();
            }
            // Sinon (vue client), on ne montre que les produits actifs
            return cb.isTrue(root.get("actif"));
        };

        if (q != null && !q.isBlank()) {
            spec = spec.and((root, query, cb) -> {
                String like = "%" + q.toLowerCase() + "%";
                return cb.or(
                        cb.like(cb.lower(root.get("nom")), like),
                        cb.like(cb.lower(root.get("description")), like));
            });
        }

        if (category != null && !category.isBlank()) {
            Category parentCat = categoryRepository.findByNomIgnoreCase(category).orElse(null);
            if (parentCat != null) {
                List<String> catNames = new java.util.ArrayList<>();
                catNames.add(parentCat.getNom().toLowerCase());
                if (parentCat.getSubCategories() != null) {
                    for (Category sub : parentCat.getSubCategories()) {
                        catNames.add(sub.getNom().toLowerCase());
                    }
                }
                spec = spec.and((root, query, cb) -> {
                    if (query != null) query.distinct(true);
                    var join = root.join("categories", JoinType.LEFT);
                    return cb.lower(join.get("nom")).in(catNames);
                });
            } else {
                spec = spec.and((root, query, cb) -> {
                    if (query != null) query.distinct(true);
                    var join = root.join("categories", JoinType.LEFT);
                    return cb.equal(cb.lower(join.get("nom")), category.toLowerCase());
                });
            }
        }

        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("prix"), minPrice));
        }

        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("prix"), maxPrice));
        }

        if (sellerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.join("seller").get("id"), sellerId));
        }

        if (promotionOnly != null && promotionOnly) {
            spec = spec.and((root, query, cb) -> cb.isNotNull(root.get("prixPromo")));
        }

        return productRepository.findAll(spec, sortedPageable).map(this::toProductDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getPromotionProducts(Pageable pageable) {
        return productRepository.findByActifTrueAndPrixPromoIsNotNull(withSort(pageable, "newest"))
                .map(this::toProductDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDTO> getTopSellingProducts(Pageable pageable) {
        List<Product> all = productRepository.findPopularActiveProductsNative();
        int limit = Math.min(pageable.getPageSize(), 10);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + limit, all.size());
        List<Product> paged = start >= all.size() ? List.of() : all.subList(start, end);
        List<ProductDTO> dtos = paged.stream().map(this::toProductDto).toList();
        return new PageImpl<>(dtos, pageable, all.size());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouve"));
        return toProductDto(product);
    }

    @Override
    public ProductDTO saveProduct(ProductDTO productDTO, Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur non trouve"));

        Product product = productMapper.toEntity(productDTO);
        product.setSeller(seller);
        product.setActif(productDTO.isActif());
        applyProductData(product, productDTO);

        Product savedProduct = productRepository.save(product);
        return toProductDto(savedProduct);
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductDTO productDTO, Long sellerId) {
        System.out.println("DEBUG: Début modification produit ID: " + id + " pour vendeur ID: " + sellerId);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouve"));

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendeur non trouve"));

        try {
            product.setSeller(seller);
            product.setNom(productDTO.getNom());
            product.setDescription(productDTO.getDescription());
            product.setPrix(productDTO.getPrix());
            product.setPrixPromo(productDTO.getPrixPromo());
            product.setStock(productDTO.getStock());
            product.setActif(productDTO.isActif());

            System.out.println("DEBUG: Application des données DTO vers Entité...");
            applyProductData(product, productDTO);

            System.out.println("DEBUG: Sauvegarde en base de données...");
            Product savedProduct = productRepository.save(product);

            System.out.println("DEBUG: Modification réussie !");
            return toProductDto(savedProduct);
        } catch (Exception e) {
            System.err.println("ERREUR MODIFICATION PRODUIT: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit non trouve"));
        
        // 1. Vérifier si le produit est présent dans des commandes
        boolean inOrders = customerOrderRepository.isProductInAnyOrder(id);

        if (inOrders) {
            // S'il est dans des commandes, on ne peut pas le supprimer physiquement.
            // On le détache du vendeur et on le masque pour qu'il disparaisse de son inventaire.
            System.out.println("DEBUG: Produit lié à une commande. Détachement du vendeur ID: " + (product.getSeller() != null ? product.getSeller().getId() : "null"));
            product.setSeller(null);
            product.setActif(false);
            productRepository.save(product);
        } else {
            // Sinon, on peut le supprimer physiquement sans crainte.
            System.out.println("DEBUG: Produit sans commandes. Suppression physique...");
            
            // Nettoyer les catégories (table de jointure)
            if (product.getCategories() != null) {
                product.getCategories().clear();
            }

            // Supprimer les avis
            List<com.shopflow.entities.Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(id);
            if (reviews != null && !reviews.isEmpty()) {
                reviewRepository.deleteAll(reviews);
            }

            productRepository.delete(product);
            System.out.println("DEBUG: Produit ID " + id + " supprimé définitivement.");
        }
    }

    private void applyProductData(Product product, ProductDTO productDTO) {
        // Initialisation forcée pour éviter NPE si le mapper n'a pas initialisé les listes
        if (product.getCategories() == null) product.setCategories(new java.util.ArrayList<>());
        if (product.getImages() == null) product.setImages(new java.util.ArrayList<>());
        if (product.getVariants() == null) product.setVariants(new java.util.ArrayList<>());

        // 1. Gestion des Catégories
        product.getCategories().clear();
        if (productDTO.getCategoryNames() != null && !productDTO.getCategoryNames().isEmpty()) {
            List<String> distinctNames = productDTO.getCategoryNames().stream().distinct().toList();
            List<Category> categories = categoryRepository.findByNomIn(distinctNames);
            if (categories.size() != distinctNames.size()) {
                System.err.println("ERREUR: Catégories manquantes en BDD");
                throw new BadRequestException("Une ou plusieurs categories sont introuvables");
            }
            product.getCategories().addAll(categories);
        }

        // 2. Gestion des Images
        product.getImages().clear();
        if (productDTO.getImages() != null) {
            product.getImages().addAll(productDTO.getImages());
        }

        // 3. Gestion des Variantes
        product.getVariants().clear();
        if (productDTO.getVariants() != null) {
            List<ProductVariant> newVariants = productDTO.getVariants().stream()
                    .map(productMapper::toEntity)
                    .peek(variant -> variant.setProduct(product))
                    .toList();
            product.getVariants().addAll(newVariants);
        }
    }

    private Pageable withSort(Pageable pageable, String sortBy) {
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.unsorted();
        if (sortBy == null || sortBy.isBlank()) {
            return pageable;
        }
        switch (sortBy.toLowerCase()) {
            case "priceasc" -> sort = Sort.by("prix").ascending();
            case "pricedesc" -> sort = Sort.by("prix").descending();
            case "newest" -> sort = Sort.by("dateCreation").descending();
            default -> {
                return pageable;
            }
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    private ProductDTO toProductDto(Product product) {
        ProductDTO dto = productMapper.toDto(product);
        List<com.shopflow.entities.Review> reviews = reviewRepository
                .findByProductIdAndApprovedTrueOrderByCreatedAtDesc(product.getId());
        dto.setReviewCount((long) reviews.size());
        dto.setAverageRating(reviews.isEmpty()
                ? 0.0
                : reviews.stream().mapToInt(com.shopflow.entities.Review::getRating).average().orElse(0.0));
        dto.setReviews(reviews.stream()
                .map(review -> ReviewDTO.builder()
                        .id(review.getId())
                        .productId(product.getId())
                        .productName(product.getNom())
                        .customerEmail(review.getCustomer() != null ? review.getCustomer().getEmail() : "Anonyme")
                        .rating(review.getRating())
                        .comment(review.getComment())
                        .approved(review.isApproved())
                        .createdAt(review.getCreatedAt())
                        .build())
                .toList());
        return dto;
    }
}

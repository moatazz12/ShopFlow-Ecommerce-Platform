package com.shopflow.mapper;

import com.shopflow.dto.ProductDTO;
import com.shopflow.dto.ProductVariantDTO;
import com.shopflow.entities.Category;
import com.shopflow.entities.Product;
import com.shopflow.entities.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;



@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "sellerName", expression = "java(product.getSeller() != null ? (product.getSeller().getSellerProfile() != null && product.getSeller().getSellerProfile().getNomBoutique() != null ? product.getSeller().getSellerProfile().getNomBoutique() : (product.getSeller().getShopName() != null ? product.getSeller().getShopName() : product.getSeller().getNom())) : null)")
    @Mapping(target = "categoryNames", source = "categories")
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "reviewCount", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    ProductDTO toDto(Product product);

    @Mapping(target = "seller", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "actif", ignore = true)
    @Mapping(target = "dateCreation", ignore = true)
    Product toEntity(ProductDTO productDto);

    ProductVariantDTO toDto(ProductVariant variant);

    @Mapping(target = "product", ignore = true)
    ProductVariant toEntity(ProductVariantDTO variantDto);

    default List<String> mapCategories(List<Category> categories) {
        if (categories == null) {
            return null;
        }
        return categories.stream()
                .map(Category::getNom)
                .distinct()
                .toList();
    }
}

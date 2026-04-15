package com.shopflow.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopflow.BackendApplication;
import com.shopflow.dto.AddressRequest;
import com.shopflow.dto.AuthLoginRequest;
import com.shopflow.dto.CartItemRequest;
import com.shopflow.dto.CheckoutRequest;
import com.shopflow.entities.Category;
import com.shopflow.entities.Product;
import com.shopflow.entities.User;
import com.shopflow.repository.CategoryRepository;
import com.shopflow.repository.ProductRepository;
import com.shopflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BackendApplication.class)
@AutoConfigureMockMvc
@SuppressWarnings("null")
class AuthOrderFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Product product;

    @BeforeEach
    void setUp() {
        User seller = userRepository.findByEmail("seller@shopflow.com").orElseThrow();
        Category category = categoryRepository.findByParentIsNull().stream()
                .findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .nom("TEST")
                        .description("Categorie test")
                        .build()));

        product = Product.builder()
                .nom("Produit Integration " + UUID.randomUUID())
                .description("Produit pour test complet")
                .prix(100.0)
                .prixPromo(80.0)
                .stock(10)
                .actif(true)
                .seller(seller)
                .categories(List.of(category))
                .build();

        product = productRepository.save(product);
    }

    @Test
    void customerCanLoginAddToCartAndCheckout() throws Exception {
        AuthLoginRequest customerLogin = new AuthLoginRequest();
        customerLogin.setEmail("customer@shopflow.com");
        customerLogin.setPassword("admin123");

        String customerToken = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();
        customerToken = objectMapper.readTree(customerToken).get("access_token").asText();

        AddressRequest addressRequest = new AddressRequest();
        addressRequest.setRue("Rue 1");
        addressRequest.setVille("Tunis");
        addressRequest.setCodePostal("1000");
        addressRequest.setPays("TN");
        addressRequest.setPrincipal(true);
        addressRequest.setType("SHIPPING");

        String addressResponse = mockMvc.perform(post("/api/addresses")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addressRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long shippingAddressId = objectMapper.readTree(addressResponse).get("id").asLong();

        CartItemRequest cartItemRequest = new CartItemRequest();
        cartItemRequest.setProductId(product.getId());
        cartItemRequest.setQuantity(2);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(2)))
                .andExpect(jsonPath("$.subtotalAmount", is(160.0)))
                .andExpect(jsonPath("$.taxAmount", is(32.0)))
                .andExpect(jsonPath("$.totalAmount", is(192.0)));

        CheckoutRequest checkoutRequest = new CheckoutRequest();
        checkoutRequest.setPaymentSuccess(true);
        checkoutRequest.setShippingAddressId(shippingAddressId);

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus", is("PAID")))
                .andExpect(jsonPath("$.status", is("PAID")))
                .andExpect(jsonPath("$.subtotalAmount", is(160.0)))
                .andExpect(jsonPath("$.taxAmount", is(32.0)))
                .andExpect(jsonPath("$.totalAmount", is(192.0)));

        mockMvc.perform(get("/api/orders/my")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status", is("PAID")));

        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(0)));

        AuthLoginRequest sellerLogin = new AuthLoginRequest();
        sellerLogin.setEmail("seller@shopflow.com");
        sellerLogin.setPassword("admin123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sellerLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token", notNullValue()));

        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(8, updatedProduct.getStock());
    }

    @Test
    void protectedCartEndpointRejectsAnonymousUser() throws Exception {
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isForbidden());
    }
}

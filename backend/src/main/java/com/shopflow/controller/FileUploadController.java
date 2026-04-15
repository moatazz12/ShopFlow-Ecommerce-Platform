package com.shopflow.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Value("${app.upload.dir:uploads/products}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        System.out.println("DEBUG: Début de l'upload - Nom: " + file.getOriginalFilename() + " - Taille: " + file.getSize());
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Fichier vide");
        }

        try {
            // Créer le dossier s'il n'existe pas
            Path path = Paths.get(uploadDir);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                System.out.println("DEBUG: Dossier créé: " + path.toAbsolutePath());
            }

            // Générer un nom unique
            String extension = getFileExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID().toString() + extension;
            
            // Sauvegarder le fichier
            Path filePath = path.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/products/" + fileName;
            System.out.println("DEBUG: Upload réussi ! URL: " + fileUrl);
            
            return ResponseEntity.ok(Map.of("url", fileUrl));

        } catch (IOException e) {
            System.err.println("ERREUR CRITIQUE UPLOAD: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erreur serveur: " + e.getMessage());
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return ".jpg";
        int lastIndex = fileName.lastIndexOf(".");
        return (lastIndex == -1) ? ".jpg" : fileName.substring(lastIndex);
    }
}

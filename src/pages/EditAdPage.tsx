import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  IconButton,
  Grid,
} from "@mui/material";
import { CloudUpload, Delete } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import apiClient from "../api/client";
import { AdDto, CategoryDto } from "../types/types";

interface EditAdRequest {
  title: string;
  description: string;
  category: {
    id: number;
  };
}

const EditAdPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  // Состояния для изображений
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState<EditAdRequest>({
    title: "",
    description: "",
    category: { id: 0 },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      setNewFiles((prev) => {
        const updatedFiles = [...prev, ...acceptedFiles];
        return updatedFiles.slice(0, 10 - existingImages.length);
      });

      const newPreviews = acceptedFiles.map((file) =>
        URL.createObjectURL(file),
      );
      setPreviews((prev) =>
        [...prev, ...newPreviews].slice(0, 10 - existingImages.length),
      );
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем данные объявления
        const adResponse = await apiClient.get<AdDto>(`/ad-service/ads/${id}`);
        setFormData({
          title: adResponse.data.title,
          description: adResponse.data.description,
          category: { id: adResponse.data.category.id },
        });

        // Загружаем существующие изображения
        setExistingImages(adResponse.data.images.map((img) => img.url));

        // Загружаем категории
        const categoriesResponse = await apiClient.get<CategoryDto[]>(
          "/ad-service/categories",
        );
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError("Ошибка загрузки данных");
        console.error("Error fetching data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category.id) {
      setError("Пожалуйста, выберите категорию");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Обновляем основные данные объявления
      await apiClient.put(`/ad-service/ads/${id}`, formData);

      // Удаляем отмеченные изображения
      if (filesToDelete.length > 0) {
        await apiClient.delete(`/ad-service/ads/${id}/images`, {
          data: { imageUrls: filesToDelete },
        });
      }

      // Загружаем новые изображения
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => formData.append("files", file));

        await apiClient.post(`/ad-service/ads/${id}/images`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      navigate("/profile");
    } catch (err) {
      setError("Ошибка при обновлении объявления");
      console.error("Error updating ad:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setFilesToDelete((prev) => [...prev, url]);
  };

  const handleRemoveNewFile = (index: number) => {
    const updatedFiles = [...newFiles];
    const updatedPreviews = [...previews];

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setNewFiles(updatedFiles);
    setPreviews(updatedPreviews);
    URL.revokeObjectURL(previews[index]);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (value: number) => {
    setFormData({
      ...formData,
      category: { id: value },
    });
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Редактировать объявление
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Заголовок"
          name="title"
          value={formData.title}
          onChange={handleChange}
          margin="normal"
          required
          inputProps={{ maxLength: 100 }}
        />

        <TextField
          fullWidth
          label="Описание"
          name="description"
          value={formData.description}
          onChange={handleChange}
          margin="normal"
          required
          multiline
          rows={4}
          inputProps={{ maxLength: 1000 }}
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel id="category-label">Категория</InputLabel>
          <Select
            labelId="category-label"
            label="Категория"
            value={formData.category.id}
            onChange={(e) => handleCategoryChange(Number(e.target.value))}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Изображения (максимум 10)
          </Typography>

          {/* Существующие изображения */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {existingImages.map((url, index) => (
              <Grid item xs={6} sm={4} md={3} key={url}>
                <Box sx={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Existing ${index}`}
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveExistingImage(url)}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.7)",
                      },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Область для загрузки новых изображений */}
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              mt: 2,
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: "action.hover",
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload fontSize="large" sx={{ mb: 1 }} />
            <Typography>
              Перетащите сюда новые изображения или кликните для выбора
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Поддерживаемые форматы: JPEG, PNG (макс. 5MB каждый)
            </Typography>
          </Box>

          {/* Превью новых изображений */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {previews.map((preview, index) => (
              <Grid item xs={6} sm={4} md={3} key={preview}>
                <Box sx={{ position: "relative" }}>
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveNewFile(index)}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.7)",
                      },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>

          {(existingImages.length > 0 || newFiles.length > 0) && (
            <Chip
              label={`Всего изображений: ${existingImages.length + newFiles.length}`}
              sx={{ mt: 2 }}
            />
          )}
        </Box>

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/profile")}
          >
            Отмена
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default EditAdPage;

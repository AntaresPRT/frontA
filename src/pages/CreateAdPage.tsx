import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
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
// Обязательно _до_ любых ссылок на ymaps
declare global {
  interface Window {
    ymaps: any;
  }
}

interface CreateAdRequest {
  title: string;
  price: number;
  description: string;
  category: {
    id: number;
  };
  address: string;
}

const CreateAdPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateAdRequest>({
    title: "",
    price: 0,
    description: "",
    category: { id: 0 },
    address: "",
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
    },
    maxFiles: 10,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      setFiles((prev) => {
        const updatedFiles = [...prev, ...acceptedFiles];
        return updatedFiles.slice(0, 10);
      });

      const newPreviews = acceptedFiles.map((file) =>
        URL.createObjectURL(file),
      );
      setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/ad-service/categories");
        setCategories(response.data);
        if (response.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            category: { id: response.data[0].id },
          }));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, []);

  const mapRef = useRef<any>(null); // Добавляем ref для хранения экземпляра карты
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.ymaps) return;
    const ymapsAny = window.ymaps as any;

    ymapsAny.ready(() => {
      if (mapRef.current) return;
      const map = new ymapsAny.Map("map", {
        center: [55.75, 37.57],
        zoom: 10,
        controls: ["zoomControl"],
      });

      mapRef.current = map;

      const suggestView = new ymapsAny.SuggestView(addressInputRef.current);

      suggestView.events.add("select", (e: any) => {
        const text: string = e.get("item").value;
        setFormData((prev) => ({ ...prev, address: text }));

        ymapsAny.geocode(text).then((res: any) => {
          const first = res.geoObjects.get(0);
          if (!first) return;

          const coords: number[] = first.geometry.getCoordinates();
          map.geoObjects.removeAll();
          const placemark = new ymapsAny.Placemark(
            coords,
            {},
            { draggable: true },
          );
          map.geoObjects.add(placemark);
          map.setCenter(coords, 15);

          placemark.events.add("dragend", () => {
            const newCoords: number[] = placemark.geometry!.getCoordinates();
            ymapsAny
              .geocode(newCoords as [number, number])
              .then((res2: any) => {
                const addr2: string = res2.geoObjects
                  .get(0)
                  .properties.get("text");
                setFormData((prev) => ({ ...prev, address: addr2 }));
              });
          });
        });
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category.id) {
      setError("Пожалуйста, выберите категорию");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Создаем объявление
      const adResponse = await apiClient.post<AdDto>(
        "/ad-service/ads",
        formData,
      );

      // Загружаем изображения
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        await apiClient.post(
          `/ad-service/ads/${adResponse.data.id}/images`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      navigate("/profile");
    } catch (err) {
      setError("Ошибка при создании объявления");
      console.error("Error creating ad:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setFiles(newFiles);
    setPreviews(newPreviews);
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

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Создать новое объявление
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
            disabled={loadingCategories}
          >
            {loadingCategories ? (
              <MenuItem disabled>
                <CircularProgress size={24} />
              </MenuItem>
            ) : (
              categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Цена"
          name="price"
          value={formData.price}
          onChange={handleChange}
          margin="normal"
          required
          inputProps={{ maxLength: 100 }}
        />

        {/* 1) Поле автодополнения */}
        <TextField
          fullWidth
          label="Адрес"
          inputRef={addressInputRef}
          margin="normal"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />

        <Box
          id="map"
          sx={{
            width: "100%",
            height: 300,
            mt: 2,
            borderRadius: 2,
            border: "1px solid #ccc",
          }}
        />

        {/* 3) Показ выбранного адреса */}
        {formData.address && (
          <Alert severity="info" sx={{ my: 2 }}>
            Выбранный адрес: {formData.address}
          </Alert>
        )}

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Изображения (максимум 10)
          </Typography>

          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: "action.hover",
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload fontSize="large" sx={{ mb: 1 }} />
            <Typography>
              Перетащите сюда изображения или кликните для выбора
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Поддерживаемые форматы: JPEG, PNG (макс. 5MB каждый)
            </Typography>
          </Box>

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
                    onClick={() => handleRemoveFile(index)}
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

          {files.length > 0 && (
            <Chip label={`Выбрано файлов: ${files.length}`} sx={{ mt: 2 }} />
          )}
        </Box>

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading || loadingCategories}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Отправка..." : "Опубликовать"}
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

export default CreateAdPage;

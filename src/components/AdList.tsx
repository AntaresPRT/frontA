import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { AdDto, CategoryDto } from "../types/types";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Button,
  CircularProgress,
  CardMedia,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Divider,
} from "@mui/material";
import { Link } from "react-router-dom";
import { styled } from "@mui/system";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

const StyledCard = styled(Card)({
  marginBottom: "20px",
  transition: "transform 0.2s",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  "&:hover": {
    transform: "scale(1.02)",
  },
});

const ImageContainer = styled(Box)({
  position: "relative",
  paddingTop: "56.25%",
  backgroundColor: "#f5f5f5",
});

const AdList = () => {
  const [ads, setAds] = useState<AdDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adsResponse, categoriesResponse] = await Promise.all([
          apiClient.get("/ad-service/ads", {
            params: {
              q: searchQuery,
              category: selectedCategory,
              minPrice,
              maxPrice,
            },
          }),
          apiClient.get("/ad-service/categories"),
        ]);

        setAds(adsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [searchQuery, selectedCategory, minPrice, maxPrice]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handlePriceFilter = (type: "min" | "max", value: string) => {
    if (/^\d*$/.test(value)) {
      type === "min" ? setMinPrice(value) : setMaxPrice(value);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Лента объявлений
        </Typography>

        {/* Панель фильтров */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <TextField
            variant="outlined"
            placeholder="Поиск по объявлениям..."
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Категория</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              label="Категория"
              disabled={loadingCategories}
            >
              <MenuItem value="">Все категории</MenuItem>
              {loadingCategories ? (
                <MenuItem disabled>Загрузка...</MenuItem>
              ) : (
                categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              label="Мин. цена"
              variant="outlined"
              value={minPrice}
              onChange={(e) => handlePriceFilter("min", e.target.value)}
              sx={{ width: 120 }}
            />
            <Typography>-</Typography>
            <TextField
              label="Макс. цена"
              variant="outlined"
              value={maxPrice}
              onChange={(e) => handlePriceFilter("max", e.target.value)}
              sx={{ width: 120 }}
            />
          </Box>

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={clearFilters}
          >
            Сбросить
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Чипы активных фильтров */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {selectedCategory && (
            <Chip
              label={`Категория: ${categories.find((c) => c.id === Number(selectedCategory))?.name}`}
              onDelete={() => setSelectedCategory("")}
            />
          )}
          {minPrice && (
            <Chip
              label={`Мин. цена: ${minPrice}₽`}
              onDelete={() => setMinPrice("")}
            />
          )}
          {maxPrice && (
            <Chip
              label={`Макс. цена: ${maxPrice}₽`}
              onDelete={() => setMaxPrice("")}
            />
          )}
        </Box>
      </Box>

      {ads.length === 0 ? (
        <Typography variant="body1">
          Объявлений по вашему запросу не найдено
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {ads.map((ad) => (
            <Grid item xs={12} sm={6} md={4} key={ad.id}>
              <StyledCard>
                <ImageContainer>
                  {ad.images?.[0]?.url ? (
                    <CardMedia
                      component="img"
                      image={ad.images[0].url}
                      title={ad.title}
                      loading="lazy"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      color="text.secondary"
                    >
                      <PhotoCameraIcon fontSize="large" />
                    </Box>
                  )}
                </ImageContainer>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                      {ad.author?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6">{ad.author?.username}</Typography>
                  </Box>

                  <Typography variant="h5" component="h2" gutterBottom>
                    {ad.title}
                  </Typography>

                  {ad.price ? (
                    <Typography
                      variant="h6"
                      color="primary"
                      gutterBottom
                      sx={{
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {new Intl.NumberFormat("ru-RU", {
                        style: "currency",
                        currency: "RUB",
                        maximumFractionDigits: 0,
                      }).format(ad.price)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Цена не указана
                    </Typography>
                  )}

                  <Typography
                    variant="body1"
                    color="textSecondary"
                    gutterBottom
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ad.description}
                  </Typography>

                  <Box mt={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      to={`/ads/${ad.id}`}
                      fullWidth
                    >
                      Подробнее
                    </Button>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default AdList;

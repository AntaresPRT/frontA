import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { UserDto } from "../types/types";
import { AdDto } from "../types/types";
import {
  Button,
  TextField,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  Box,
  Link,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [ads, setAds] = useState<AdDto[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userResponse = await apiClient.get("/user-service/users/profile");
        setUser(userResponse.data);
        setFormData({
          username: userResponse.data.username,
          email: userResponse.data.email,
        });

        const adsResponse = await apiClient.get(
          `/ad-service/ads?authorId=${userResponse.data.id}`,
        );
        setAds(adsResponse.data);
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = async () => {
    try {
      const response = await apiClient.put(
        "/user-service/users/profile",
        formData,
      );
      setUser(response.data);
      setEditMode(false);
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
    }
  };

  const handleDeleteAd = async (adId: number) => {
    try {
      await apiClient.delete(`/ad-service/ads/${adId}`);
      setAds(ads.filter((ad) => ad.id !== adId));
    } catch (error) {
      console.error("Ошибка удаления объявления:", error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Профиль
      </Typography>

      {user && (
        <Box mb={4}>
          {editMode ? (
            <Box>
              <TextField
                label="Имя пользователя"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                fullWidth
                margin="normal"
              />
              <TextField
                label="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                fullWidth
                margin="normal"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleEdit}
                sx={{ mr: 2 }}
              >
                Сохранить
              </Button>
              <Button variant="outlined" onClick={() => setEditMode(false)}>
                Отмена
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Имя пользователя: {user.username}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Email: {user.email}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setEditMode(true)}
                sx={{ mr: 2 }}
              >
                Редактировать
              </Button>
              <Button
                variant="contained"
                color="secondary"
                component={RouterLink}
                to="/create-ad"
              >
                Разместить объявление
              </Button>
            </Box>
          )}
        </Box>
      )}

      <Typography variant="h5" gutterBottom>
        Мои объявления
      </Typography>

      <List>
        {ads.map((ad) => (
          <ListItem key={ad.id}>
            <ListItemText primary={ad.title} />
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDeleteAd(ad.id)}
              sx={{ ml: 2 }}
            >
              Удалить
            </Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default Profile;

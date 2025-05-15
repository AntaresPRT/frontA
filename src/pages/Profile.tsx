import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { UserDto, AdDto, ChatDto } from "../types/types";
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
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import "moment/locale/ru";

const Profile = () => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [ads, setAds] = useState<AdDto[]>([]);
  const [chats, setChats] = useState<ChatDto[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Загрузка данных пользователя и объявлений
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

        // Загрузка чатов
        const chatsResponse = await apiClient.get("/discussion-service/chats");
        setChats(chatsResponse.data);
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
      } finally {
        setLoadingChats(false);
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
              color="primary"
              //onClick={() => handleDeleteAd(ad.id)}
              sx={{ ml: 2 }}
            >
              Редактировать
            </Button>
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
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Чаты
      </Typography>

      {loadingChats ? (
        <CircularProgress />
      ) : chats.length === 0 ? (
        <Typography variant="body1">У вас пока нет активных чатов</Typography>
      ) : (
        <List>
          {chats.map((chat) => (
            <ListItem
              key={chat.id}
              component={RouterLink}
              to={`/ads/${chat.adId}?openChat=true&senderId=${chat.participant.id}`}
              sx={{
                "&:hover": {
                  backgroundColor: "action.hover",
                  cursor: "pointer",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar>{chat.participant.username[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">
                      {chat.participant.username}
                    </Typography>
                    {chat.unreadCount > 0 && (
                      <Chip
                        label={chat.unreadCount}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {chat.lastMessage}
                    </Typography>
                    <Typography variant="caption">
                      {moment(chat.updatedAt).format("LLL")}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default Profile;

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Card,
  CardMedia,
  Chip,
  Grid,
  IconButton,
  Stack,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SendIcon from "@mui/icons-material/Send";
import apiClient from "../api/client";
import { AdDto, UserDto, CommentDto } from "../types/types";
import moment from "moment";
import "moment/locale/ru";

declare global {
  interface Window {
    ymaps: any;
  }
}

const AdPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ad, setAd] = useState<AdDto | null>(null);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const loadComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await apiClient.get(
          `/discussion-service/api/ads/${id}/comments`,
        );
        setComments(response.data);
      } catch (err) {
        setCommentError("Не удалось загрузить комментарии");
      } finally {
        setCommentsLoading(false);
      }
    };

    if (ad) loadComments();
  }, [id, ad]);

  const handleReplySubmit = async (parentCommentId: number) => {
    if (!replyText.trim()) return;

    setCommentsLoading(true);
    try {
      const response = await apiClient.post(
        `/discussion-service/api/ads/${id}/comments`,
        {
          text: replyText,
          parentCommentId: parentCommentId,
        },
      );

      // Обновляем комментарии
      const updatedComments = addReplyToComment(
        comments,
        parentCommentId,
        response.data,
      );
      setComments(updatedComments);
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Ошибка отправки ответа:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const addReplyToComment = (
    comments: CommentDto[],
    parentId: number,
    newReply: CommentDto,
  ): CommentDto[] => {
    return comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      } else if (comment.replies?.length) {
        return {
          ...comment,
          replies: addReplyToComment(comment.replies, parentId, newReply),
        };
      }
      return comment;
    });
  };

  // Рендер кнопки ответа и формы
  const renderReplySection = (commentId: number) => {
    if (replyingTo !== commentId) return null;

    return (
      <Box sx={{ ml: 4, mt: 1 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          label="Ваш ответ"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={() => handleReplySubmit(commentId)}
          disabled={commentsLoading}
        >
          Отправить ответ
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setReplyingTo(null)}
          sx={{ ml: 1 }}
        >
          Отмена
        </Button>
      </Box>
    );
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await apiClient.post(
        `/discussion-service/api/ads/${id}/comments`,
        {
          text: newComment,
        },
      );

      setComments([...comments, response.data]);
      setNewComment("");
    } catch (err) {
      setCommentError("Ошибка при отправке комментария");
    }
  };

  // Рендер комментариев с вложенностью
  const renderComments = (comments: CommentDto[], level = 0) => (
    <List
      sx={{
        pl: level === 0 ? 0 : 4,
        borderLeft: level > 0 ? "1px solid #ddd" : "none",
      }}
    >
      {comments.map((comment) => (
        <div key={comment.id}>
          <ListItem alignItems="flex-start">
            <ListItemAvatar>
              <Avatar>{comment.author.username.charAt(0)}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">
                      {comment.author.username}
                    </Typography>
                    {level > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        отвечает{" "}
                        {comment.parentCommentId
                          ? "на комментарий"
                          : "на объявление"}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {moment(comment.createdAt).format("LLL")}
                  </Typography>
                </>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {comment.text}
                </Typography>
              }
            />
            {currentUser && (
              <Button
                size="small"
                onClick={() => setReplyingTo(comment.id)}
                sx={{ alignSelf: "flex-start" }}
              >
                Ответить
              </Button>
            )}
          </ListItem>

          {renderReplySection(comment.id)}

          {comment.replies && renderComments(comment.replies, level + 1)}
          <Divider variant="inset" component="li" />
        </div>
      ))}
    </List>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Параллельная загрузка объявления и пользователя
        const [adResponse, userResponse] = await Promise.all([
          apiClient.get(`/ad-service/ads/${id}`),
          apiClient.get("/user-service/users/profile"),
        ]);

        setAd(adResponse.data);
        setCurrentUser(userResponse.data);
      } catch (err) {
        setError("Объявление не найдено или проблемы с авторизацией");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!ad?.address || !window.ymaps) return;

    window.ymaps.ready(() => {
      // Уничтожаем предыдущую карту и метку
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      if (placemarkRef.current) {
        placemarkRef.current = null;
      }

      // Геокодирование адреса
      window.ymaps.geocode(ad.address).then((res: any) => {
        const first = res.geoObjects.get(0);
        if (!first || !mapContainerRef.current) return;

        const coords: [number, number] = first.geometry.getCoordinates();

        // Создаем новую карту
        mapRef.current = new window.ymaps.Map(mapContainerRef.current, {
          center: coords,
          zoom: 15,
          controls: ["zoomControl"],
        });

        // Создаем новую метку
        placemarkRef.current = new window.ymaps.Placemark(coords);
        mapRef.current.geoObjects.add(placemarkRef.current);
      });
    });

    // Cleanup функция
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      placemarkRef.current = null;
    };
  }, [ad?.address]);

  const handleNextImage = () => {
    setActiveImageIndex((prev) =>
      prev < (ad?.images?.length || 1) - 1 ? prev + 1 : 0,
    );
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) =>
      prev > 0 ? prev - 1 : (ad?.images?.length || 1) - 1,
    );
  };

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
  };

  const handleDeleteAd = async (adId: number) => {
    try {
      await apiClient.delete(`/ad-service/ads/${adId}`);
      navigate("/profile");
    } catch (err) {
      console.error("Ошибка удаления объявления:", err);
      setError("Не удалось удалить объявление");
    }
  };

  const isAuthor = currentUser?.id === ad?.author?.id;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ad || error) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h4" gutterBottom>
          {error || "Объявление не найдено"}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Вернуться назад
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", p: 3 }}>
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBackIcon fontSize="large" />
      </IconButton>

      {isAuthor && (
        <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/ads/${ad.id}/edit`}
          >
            Редактировать
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleDeleteAd(ad.id)}
          >
            Удалить
          </Button>
        </Box>
      )}

      <Typography variant="h3" component="h1" gutterBottom>
        {ad.title}
      </Typography>

      <Typography
        variant="h4"
        color="primary"
        gutterBottom
        sx={{
          mt: 1,
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

      <Grid container spacing={4}>
        {/* Блок с фотографиями */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: "relative", mb: 2 }}>
            <Card sx={{ position: "relative" }}>
              {ad.images?.length > 0 ? (
                <>
                  <CardMedia
                    component="img"
                    image={ad.images[activeImageIndex].url}
                    alt={ad.title}
                    sx={{
                      maxHeight: 500,
                      objectFit: "contain",
                      width: "100%",
                    }}
                  />

                  {/* Кнопки навигации */}
                  {ad.images.length > 1 && (
                    <>
                      <IconButton
                        onClick={handlePrevImage}
                        sx={{
                          position: "absolute",
                          left: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": {
                            bgcolor: "rgba(0,0,0,0.7)",
                          },
                        }}
                      >
                        <ChevronLeftIcon fontSize="large" />
                      </IconButton>

                      <IconButton
                        onClick={handleNextImage}
                        sx={{
                          position: "absolute",
                          right: 16,
                          top: "50%",
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.5)",
                          color: "white",
                          "&:hover": {
                            bgcolor: "rgba(0,0,0,0.7)",
                          },
                        }}
                      >
                        <ChevronRightIcon fontSize="large" />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <Box
                  height={300}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="grey.100"
                >
                  <Typography variant="h6" color="text.secondary">
                    Нет изображения
                  </Typography>
                </Box>
              )}
            </Card>

            {/* Индикаторы */}
            {ad.images?.length > 1 && (
              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                sx={{ mt: 2 }}
              >
                {ad.images.map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor:
                        activeImageIndex === index
                          ? "primary.main"
                          : "grey.400",
                      cursor: "pointer",
                      transition: "background-color 0.3s",
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* Превью изображений */}
          {ad.images?.length > 1 && (
            <Box display="flex" gap={2} flexWrap="wrap">
              {ad.images.map((image, index) => (
                <Card
                  key={index}
                  sx={{
                    width: 100,
                    height: 100,
                    cursor: "pointer",
                    border:
                      activeImageIndex === index
                        ? "2px solid primary.main"
                        : "none",
                    opacity: activeImageIndex === index ? 1 : 0.7,
                    transition: "all 0.3s",
                  }}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <CardMedia
                    component="img"
                    image={image.url}
                    alt={`Фото ${index + 1}`}
                    sx={{ height: "100%", objectFit: "cover" }}
                  />
                </Card>
              ))}
            </Box>
          )}
        </Grid>

        {/* Информация об объявлении */}
        <Grid item xs={12} md={6}>
          <Box mb={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  bgcolor: "primary.main",
                  fontSize: "1.5rem",
                }}
              >
                {ad.author?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{ad.author?.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  На сайте с {moment(ad.author?.createdAt).format("LL")}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={ad.category?.name}
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Описание
            </Typography>
            <Typography
              variant="body1"
              whiteSpace="pre-wrap"
              sx={{
                lineHeight: 1.6,
                fontSize: "1.1rem",
              }}
            >
              {ad.description}
            </Typography>
          </Box>

          {ad.address && (
            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Адрес
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                {ad.address}
              </Typography>
              <Box
                ref={mapContainerRef}
                sx={{
                  width: "100%",
                  height: 300,
                  borderRadius: 2,
                  border: "1px solid #ccc",
                }}
              />
            </Box>
          )}

          <Box borderTop={1} borderColor="divider" pt={2}>
            <Typography variant="body2" color="text.secondary">
              Опубликовано: {moment(ad.createdAt).format("LLL")}
            </Typography>
            {ad.updatedAt && (
              <Typography variant="body2" color="text.secondary">
                Обновлено: {moment(ad.updatedAt).format("LLL")}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Секция комментариев */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom>
          Комментарии ({comments.length})
        </Typography>

        {currentUser ? (
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              label="Написать комментарий"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleCommentSubmit}
              disabled={commentsLoading || !newComment.trim()}
            >
              {commentsLoading ? <CircularProgress size={24} /> : "Отправить"}
            </Button>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            <Link to="/login">Войдите</Link>, чтобы оставить комментарий
          </Typography>
        )}

        {comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <Typography variant="body1" color="text.secondary">
            Комментариев пока нет. Будьте первым!
          </Typography>
        )}
      </Box>

      {commentError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {commentError}
        </Typography>
      )}
    </Box>
  );
};

export default AdPage;

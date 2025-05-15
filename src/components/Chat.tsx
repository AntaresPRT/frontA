import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
} from "@mui/material";
import apiClient from "../api/client";
import { UserDto } from "../types/types";

interface Message {
  id: number;
  text: string;
  senderId: number;
  createdAt: string;
}

interface ChatProps {
  adId: number;
  recipient: UserDto;
  currentUser: UserDto;
}

const Chat = ({ adId, recipient, currentUser }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await apiClient.get(
          `/discussion-service/chats/${adId}?participantId=${recipient.id}`,
        );
        setMessages(response.data);
      } catch (err) {
        setError("Ошибка загрузки сообщений");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [adId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await apiClient.post(
        `/discussion-service/chats/${adId}`,
        {
          buyerId: recipient.id,
          text: newMessage,
        },
      );

      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (err) {
      setError("Ошибка отправки сообщения");
    }
    await sendNotification();
  };

  const sendNotification = async () => {
    try {
      await apiClient.post("/discussion-service/notifications", {
        recipientId: recipient.id,
        message: `Новое сообщение от ${currentUser.username}`,
        relatedAdId: adId,
        senderUsername: currentUser.username,
      });
    } catch (err) {
      console.error("Ошибка отправки уведомления:", err);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (recipient.id === currentUser.id) {
    return (
      <Box p={2} textAlign="center">
        <Typography color="error">Нельзя начать чат с самим собой</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "70vh", display: "flex", flexDirection: "column" }}>
      <Box display="flex" alignItems="center" p={2} bgcolor="background.paper">
        <Avatar sx={{ mr: 2 }}>{recipient.username[0]}</Avatar>
        <Typography variant="h6">{recipient.username}</Typography>
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {messages.map((message) => (
          <ListItem
            key={message.id}
            sx={{
              justifyContent:
                message.senderId === currentUser.id ? "flex-end" : "flex-start",
            }}
          >
            <Box
              sx={{
                maxWidth: "70%",
                bgcolor:
                  message.senderId === currentUser.id
                    ? "primary.main"
                    : "grey.100",
                color:
                  message.senderId === currentUser.id
                    ? "common.white"
                    : "text.primary",
                p: 2,
                borderRadius: 4,
              }}
            >
              <Typography variant="body1">{message.text}</Typography>
              <Typography
                variant="caption"
                color={
                  message.senderId === currentUser.id
                    ? "grey.300"
                    : "text.secondary"
                }
                display="block"
                textAlign="right"
                mt={1}
              >
                {new Date(message.createdAt).toLocaleTimeString()}
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишите сообщение..."
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Отправить
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;

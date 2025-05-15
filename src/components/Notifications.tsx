// components/Notifications.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemButton,
  styled,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import apiClient from "../api/client";

const StyledMenuItem = styled(MenuItem)({
  padding: 0,
  "&:hover": {
    backgroundColor: "transparent",
  },
});

const Notifications = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await apiClient.get(
          "/discussion-service/notifications",
        );
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: any) => !n.isRead).length);
      } catch (err) {
        console.error("Ошибка загрузки уведомлений:", err);
      }
    };
    loadNotifications();
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      await apiClient.put(
        `/discussion-service/notifications/${notification.id}/read`,
      );
      navigate(
        `/ads/${notification.relatedAdId}?openChat=true&senderId=${notification.senderId}`,
      );
    } catch (err) {
      console.error("Ошибка отметки уведомления:", err);
    }
    handleClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 350 } }}
      >
        <List>
          {notifications.map((notification) => (
            <StyledMenuItem key={notification.id} disableRipple>
              <ListItemButton
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.isRead ? "inherit" : "action.hover",
                  "&:hover": {
                    backgroundColor: "action.selected",
                  },
                }}
              >
                <ListItemText
                  primary={notification.message}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  }
                />
              </ListItemButton>
            </StyledMenuItem>
          ))}
        </List>
      </Menu>
    </>
  );
};

export default Notifications;

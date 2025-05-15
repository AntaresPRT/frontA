// src/components/Header.tsx
import { AppBar, Toolbar, Typography, Button, Container } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Notifications from "./Notifications";

const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/">
              Главная
            </Button>
          </Typography>

          <Notifications />

          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/profile">
                Профиль
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Войти
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;

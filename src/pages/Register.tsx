import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Alert,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { styled } from "@mui/system";
import React, { useCallback } from "react";

const StyledContainer = styled(Container)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
});

const StyledForm = styled("form")({
  width: "100%",
  maxWidth: "400px",
  marginTop: "20px",
});

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [numberError, setNumberError] = useState("");
  const navigate = useNavigate();

  const isValidPhoneNumber = (phone: string) => {
    const regex = /^(\+7|8)[0-9]{10}$/;
    return regex.test(phone.replace(/[\s-]/g, ""));
  };

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) return;
    try {
      const res = await apiClient.get("/user-service/users/check-username", {
        params: { username: value },
      });
      if (res.data) {
        setUsernameError("Имя пользователя уже занято");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Ошибка проверки имени:", error);
    }
  }, []);

  // Проверка уникальности email
  const checkEmail = useCallback(async (value: string) => {
    if (!isValidEmail(value)) return;
    try {
      const res = await apiClient.get("/user-service/users/check-email", {
        params: { email: value },
      });
      if (res.data) {
        setEmailError("Email уже зарегистрирован");
      } else {
        setEmailError("");
      }
    } catch (error) {
      console.error("Ошибка проверки email:", error);
    }
  }, []);

  const checkNumber = useCallback(async (value: string) => {
    if (!isValidPhoneNumber(value)) return;
    try {
      const res = await apiClient.get("/user-service/users/check-number", {
        params: { number: value },
      });
      if (res.data) {
        setNumberError("Номер телефона уже зарегистрирован");
      } else {
        setNumberError("");
      }
    } catch (error) {
      console.error("Ошибка проверки номера телефона:", error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password || !email || !number) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Некорректный формат email.");
      return;
    }

    if (!isValidPhoneNumber(number)) {
      setError(
        "Некорректный номер телефона. Используйте формат +7XXX или 8XXX.",
      );
      return;
    }

    try {
      await apiClient.post("/user-service/users/register", {
        username,
        password,
        email,
        number,
      });
      navigate("/login");
    } catch (error) {
      setError("Неверное имя пользователя или пароль.");
      console.error("Ошибка входа:", error);
    }
  };

  return (
    <StyledContainer>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <LockOutlinedIcon sx={{ fontSize: 50, color: "primary.main" }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Регистрация
        </Typography>
      </Box>

      <StyledForm onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Имя пользователя"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            checkUsername(e.target.value);
          }}
          fullWidth
          margin="normal"
          error={!!usernameError}
          helperText={usernameError}
          onBlur={() => checkUsername(username)}
        />

        <TextField
          label="Почта"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            checkEmail(e.target.value);
          }}
          fullWidth
          margin="normal"
          error={!!emailError}
          helperText={emailError}
          onBlur={() => checkEmail(email)}
        />

        <TextField
          label="Номер телефона"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            checkNumber(e.target.value);
          }}
          fullWidth
          margin="normal"
          error={!!numberError}
          helperText={numberError}
          onBlur={() => checkNumber(number)}
        />

        <TextField
          label="Пароль"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 2 }}
        >
          Зарегистрироваться
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Уже зарегистрированы? <a href="/login">Войдите</a>
        </Typography>
      </StyledForm>
    </StyledContainer>
  );
};

export default Register;

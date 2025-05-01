import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Button, TextField, Typography, Container, Box, Alert } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { styled } from '@mui/system';

const StyledContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
});

const StyledForm = styled('form')({
  width: '100%',
  maxWidth: '400px',
  marginTop: '20px',
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }

    try {
      const response = await apiClient.post('/user-service/users/login', { username, password });
      localStorage.setItem('token', response.data);
      navigate('/');
    } catch (error) {
      setError('Неверное имя пользователя или пароль.');
      console.error('Ошибка входа:', error);
    }
  };

  return (
    <StyledContainer>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <LockOutlinedIcon sx={{ fontSize: 50, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Вход
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
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
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
          Войти
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Нет аккаунта? <a href="/register">Зарегистрируйтесь</a>
        </Typography>
      </StyledForm>
    </StyledContainer>
  );
};

export default Login;
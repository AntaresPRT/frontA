// src/App.tsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdList from "./components/AdList";
import Profile from "./pages/Profile";
import CreateAdPage from "./pages/CreateAdPage";
import Layout from "./components/Layout";
import AdPage from "./pages/AdPage";
import EditAdPage from "./pages/EditAdPage";

const App = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout>
                <AdList />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Layout>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/create-ad"
          element={
            isAuthenticated ? (
              <Layout>
                <CreateAdPage />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/ads/:id"
          element={
            <Layout>
              <AdPage />
            </Layout>
          }
        />

        <Route
          path="/ads/:id/edit"
          element={
            <Layout>
              <EditAdPage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

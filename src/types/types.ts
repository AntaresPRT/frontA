// src/types.ts

// Тип для пользователя
export interface UserDto {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

export interface ImageDto {
  id: number;
  url: string;
  fileName: string;
}

// Тип для объявления
export interface AdDto {
  id: number;
  title: string;
  price: number;
  description: string;
  author: UserDto;
  category: CategoryDto;
  images: ImageDto[];
  createdAt: Date;
  updatedAt: Date;
  address?: string;
}

// Тип для категории
export interface CategoryDto {
  id: number;
  name: string;
}

export interface CommentDto {
  id: number;
  text: string;
  author: UserDto;
  createdAt: Date;
  replies: CommentDto[];
  parentCommentId?: number;
}

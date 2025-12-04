import { Child } from './child.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterTutorRequest {
  nombre: string;
  email: string;
  password: string;
  tipo: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  tipo: string;
}

export interface Tutor extends User {
  hijos?: Child[];
}

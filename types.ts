export interface Slide {
  id: string;
  imageData: string; // Base64 string
  title: string;
  description: string;
  order?: number;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  GUEST = 'GUEST',
  UNSELECTED = 'UNSELECTED'
}

export interface AIResponse {
  title?: string;
  description?: string;
}
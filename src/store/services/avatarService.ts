import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/api';

// Interface pour la réponse d'upload d'avatar
interface AvatarUploadResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string;
    };
    avatarUrl: string;
    publicId: string;
    uploadInfo?: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
  };
}

// Interface pour l'upload en base64
interface AvatarUploadRequest {
  imageData: string; // Image en base64 avec prefix
  filename?: string;
}

export const avatarApi = createApi({
  reducerPath: 'avatarApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/users`,
    prepareHeaders: (headers, { getState }) => {
      // Récupérer le token depuis le store Redux
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Avatar'],
  endpoints: (builder) => ({
    // Upload d'avatar en base64 (pour mobile)
    uploadAvatarBase64: builder.mutation<AvatarUploadResponse, AvatarUploadRequest>({
      query: (avatarData) => ({
        url: '/upload-avatar-base64',
        method: 'POST',
        body: avatarData,
      }),
      invalidatesTags: ['Avatar'],
    }),

    // Upload d'avatar avec FormData (si nécessaire)
    uploadAvatarFile: builder.mutation<AvatarUploadResponse, FormData>({
      query: (formData) => ({
        url: '/upload-avatar',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Avatar'],
    }),
  }),
});

// Export des hooks générés automatiquement
export const {
  useUploadAvatarBase64Mutation,
  useUploadAvatarFileMutation,
} = avatarApi;

export default avatarApi; 
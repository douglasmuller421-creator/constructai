"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { AuthResponse, User } from "@/types";

export function useLogin() {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data),
    onSuccess: (response) => {
      const { token, user } = response.data.data as AuthResponse;
      login(token, user as User);
      router.push("/projects");
    },
  });
}

export function useRegister() {
  const { login } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      authApi.register(data),
    onSuccess: (response) => {
      const { token, user } = response.data.data as AuthResponse;
      login(token, user as User);
      router.push("/projects");
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authApi.getProfile(),
    select: (response) => response.data.data as User,
  });
}
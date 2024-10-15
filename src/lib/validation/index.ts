import { z } from "zod";


export const SignupValidation = z.object({
    name: z.string().min(2,{message:'Too short'}).max(50),
    username: z.string().min(2,{message:'have a unique username'}).max(50),
    email: z.string().email(),
    password: z.string().min(8,{message:'Looks like you want a weak password'}),
  });

  export const SigninValidation = z.object({
    email: z.string().email(),
    password: z.string().min(8,{message:'Looks like you want a weak password'}),
  });
  export const PostValidation = z.object({
    caption:z.string().min(5).max(2000),
    file:z.custom<File[]>(),
    location:z.string().min(2).max(100),
    tags:z.string(),
  });
  export const ProfileValidation = z.object({
    file: z.custom<File[]>(),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    username: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email(),
    bio: z.string(),
  });
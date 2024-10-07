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
import crypto from "crypto";
import { getEnv } from "../utils/validateEnv";
import { EmailService } from "./emailService";
import { Database } from "../database/db";
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from "~/utils/appError";
import { User } from "@prisma/client";
import { generateVerificationCode } from "../utils/generateverificationcode";
import { comparePassword, hashPassword } from "~/utils/password";

interface registerData {
  id: string;
  age: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  image?: string;
}

interface loginData {
  email: string;
  password: string;
}

interface ali {
  name: string;
  id: number;
}

export class AuthServices {
  private emailService = new EmailService();
  private db = new Database();

  async register(user: registerData) {

    const {id, firstname, lastname,  username, email, password, age, image} = user;
    const founduser = await this.db.getUserByEmail(email);
    console.log(age);
    console.log(typeof age);
    
    if (typeof age !== 'number' || isNaN(age)) {
      throw new AppError("Age must be a valid number", 400);
    }
    // check if the user already exists
    if (founduser) {
      throw new AppError("User already exists", 409);
    }
    // hash the password
    const hashpassword = await hashPassword(password);

    const verificationCode = generateVerificationCode();
    const verificationCodeExpiers = new Date(Date.now() + 30 * 60 * 1000);//30min
    // create the user
    const create_user = await this.db.createUser({
      id,
      firstname,
      lastname,
      username,
      verificationCode,
      verificationCodeExpiers,
      email,
      password: hashpassword,
      age,
      image
    });
    // send the token to the user email
    await this.emailService.sendVerificationEmail({
      token: verificationCode,
      email: user.email
    });

    return {
      ...create_user,
      verificationCode,
      verificationCodeExpiers,
      message:
        "Registration successful. Please check your email to verify your account."
    };
}

  async login(user: loginData): Promise<[Partial<User>, string, string]> {
    // communicate with the database
    const {email,password} = user

    const founduser = await this.db.getUserByEmail(email);
    if (!founduser || !founduser.isVerified) {
      throw new AppError("Invalid credentials or email not verified", 401 );
    }
    const isPasswordValid = await comparePassword(password, founduser.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const { ACCESS_TOKEN_SECRET ,Refresh_TOKEN_SECRET,ACCESS_TOKEN_EXPIRES,REFRESH_TOKEN_EXPIRES} = getEnv();
    // Ensure ACCESS_TOKEN_SECRET is defined before using it
    if (!ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables");
    }
    if (!Refresh_TOKEN_SECRET) {
      throw new Error("Refresh_TOKEN_SECRET is not defined in environment variables");
    }
    if (!ACCESS_TOKEN_EXPIRES) {
      throw new Error("ACCESS_TOKEN_EXPIRES is not defined in environment variables");
    }
    if (!REFRESH_TOKEN_EXPIRES) {
      throw new Error("REFRESH_TOKEN_EXPIRES is not defined in environment variables");
    }
    
    const access_token = jwt.sign({
        id:founduser.id,
        role:founduser.role 
    }, ACCESS_TOKEN_SECRET as string, 
    {expiresIn: ACCESS_TOKEN_EXPIRES } as SignOptions);

    const refresh_token = jwt.sign(
      {
      id:founduser.id,
      role:founduser.role},
    Refresh_TOKEN_SECRET as string, 
    {expiresIn: REFRESH_TOKEN_EXPIRES} as SignOptions);

    return [{id:founduser.id,role:founduser.role,firstname:founduser.firstname,lastname:founduser.lastname,email:founduser.email,age:founduser.age,username:founduser.username}, access_token, refresh_token];
  }

   async refresh(refreshToken:string){
    const{Refresh_TOKEN_SECRET,ACCESS_TOKEN_SECRET,ACCESS_TOKEN_EXPIRES}=getEnv();
    if (!Refresh_TOKEN_SECRET) {
      throw new Error("Refresh_TOKEN_SECRET is not defined in environment variables");
    } if (!ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables");
    }

    jwt.verify(refreshToken,Refresh_TOKEN_SECRET,async(error,decoded:any)=>{
      if(error){
        throw new Error("forbiden");
      } 
      const founduser = await this.db.getUserById(decoded?.id);
      if (!founduser) {
        throw new Error("User not found");
      }
      const access_token = jwt.sign({
          id:founduser.id,
          role:founduser.role 
        }, ACCESS_TOKEN_SECRET, 
      {expiresIn: ACCESS_TOKEN_EXPIRES} as SignOptions);
      return {access_token};
    });
   }

  async ali(user: ali) {
    if (user.name.toLowerCase() != "ali") {
      // Throw an error with a status code property
      const error = new Error("Invalid name or id") as any;
      error.statusCode = 400; // Bad request
      throw error;
    }
    return { ...user };
  }

  async verifyEmail(token: string) {
    const foundUser = await this.db.getUserByVerificationCode(token);
    //  founduser in database
    if (!foundUser) {
      throw new AppError("User not found", 404);
    }
    // user already verified
    if(foundUser.isVerified){
      throw new AppError("User already verified", 400);
    }

    // Check if verification code has expired
    const currentDate = new Date();
    if (foundUser.verificationCodeExpiers < currentDate) {
      const verificationCode = generateVerificationCode();
      const verificationCodeExpiers = new Date(Date.now() + 30 * 60 * 1000);//30min
      await this.db.updateUser(foundUser.id, {verificationCode,verificationCodeExpiers});   
      await this.emailService.sendVerificationEmail({
        token,
        email:foundUser.email
      });
      throw new AppError("Verification code has expired we sent another email with new verification code please check your email and approve it within 30 min from now", 400);
    }

    // Mark user as verified
    await this.db.updateUser(foundUser.id, {isVerified:true,verificationCode:undefined,verificationCodeExpiers:undefined});

    return { email:foundUser.email};
  }
}

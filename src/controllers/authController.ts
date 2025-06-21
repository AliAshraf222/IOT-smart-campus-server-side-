import { Request, Response, NextFunction } from "express";
import { AuthServices } from "../services/authServices";

export class AuthController {
  private authServices: AuthServices = new AuthServices();

  // create a new user
  register = async (req: Request, res: Response) => {
    const user = req.body;
    console.log(user);
    const registerduser = await this.authServices.register(user);
    res.status(200).json({
      message: "User registered successfully",
      data: { ...registerduser }
    });
  };


  // login a user
  login = async (req: Request, res: Response) => {
      const user = req.body;
      console.log(user);
      const [foundUser, accessToken, refreshToken] = await this.authServices.login(user);
      res.cookie("jwt", refreshToken, {
        httpOnly: true, // web server only
        secure: process.env.NODE_ENV === 'production',//https
        sameSite: "none",// cross site
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.status(200).json({
        message: "User logged in successfully",
        data: { user: foundUser, access_token: accessToken,refresh_token:refreshToken}
      });
  };

  // refresh token
  refresh = async (req: Request, res: Response) => {

      const refreshToken = req.cookies.jwt;
      
      if(!refreshToken) { res.status(401).json({ message: "Unauthorized" })};

      const access_token = await this.authServices.refresh(refreshToken);
      res.status(200).json({ access_token,refreshToken });

  };

  ali = async (req: Request, res: Response) => {

      const user = req.body;
      const ali = await this.authServices.ali(user);
      console.log(user);
      res.status(200).json({
        message: "ali",
        data: { ...ali }
      });

  };


  verifyEmail = async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const user = await this.authServices.verifyEmail(token);
    res.status(200).json({
      message: "user verified successfully",
      data: { ...user }
    });
  };
}
// 401 Unauthorized  
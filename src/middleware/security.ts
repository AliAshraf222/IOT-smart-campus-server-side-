import { RequestHandler } from "express";

//cors configration middleware
export const corsConfig: RequestHandler = (req, res, next): void => {
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? ["https://tset.com", "https://example.com"]
      : ["http://localhost:30000"];

  const origin: string | undefined = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", [
      "GET",
      "PUT",
      "POST",
      "PATCH",
      "DELETE"
    ]);
    res.setHeader("Access-Control-Allow-Headers", [
      "Content-Type",
      "Authorization"
    ]);
  }

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};
// production => ['tset.com','example.com']
// develpemt => ['localhost:30000']

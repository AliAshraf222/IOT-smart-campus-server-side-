# IOT Smart Campus Server Side

This is a robust backend service built with Node.js, Express, and TypeScript with MVCS architecture.
It provides a comprehensive set of features including user authentication, database management with Prisma, file uploads, and integration with Python scripts. This project is designed to be a scalable and secure foundation for a modern web application
this project is for a full robust attendance management system  
smart garage system (license plate recognition)
interact with microcontrollers like (esp32).

## Features

- **User Authentication**: Secure user registration and login using JWT and bcrypt.
- **Database Management**: Utilizes Prisma ORM for efficient and type-safe database operations with PostgreSQL.
- **File Uploads**: Handles file uploads using Multer, with support for image processing.
- **integration with microcontroller**: send and recive data from esp32 microcontroller.
- **API Security**: Implements Helmet for securing HTTP headers and rate limiting to prevent abuse.
- **Python Integration**: Seamlessly runs Python scripts from the Node.js environment.
- **Email Service**: Integrated with Nodemailer for sending emails.
- **Data Validation**: Uses Zod for robust and type-safe data validation.
- **Excel File Handling**: Capabilities to read and write Excel files.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL, Prisma (ORM)
- **Authentication**: JSON Web Tokens (JWT), bcrypt
- **API**: REST
- **File Handling**: Multer
- **Linting & Formatting**: ESLint, Prettier

  ```

## Project Structure

```
/src
|-- controllers         # Request handlers
|-- database            # Database connection and setup
|-- middleware          # Express middleware
|-- models              # Data models (if not using Prisma client directly)
|-- routes              # API routes
|-- schema              # Zod schemas for validation
|-- services            # Business logic
|-- utils               # Utility functions
`-- index.ts            # Application entry point
```

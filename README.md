# My 2nd Project
Develop by Harsh gupta 
A Node.js web application built with Express.js and MongoDB.

## Features

- User authentication and authorization
- Role-based access control (Admin, HOD, Teacher, Student)
- File upload functionality
- Email notifications
- Session management
- Database integration with MongoDB

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcrypt, express-session
- **File Upload**: Multer
- **Email**: Nodemailer
- **Template Engine**: EJS

## Installation

1. Clone the repository:
```bash
git clone https://github.com/HARSHGUPTA10100/my2nd-project-.git
cd my2nd-project-
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your configuration:
```
MONGODB_URI=your_mongodb_connection_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
SESSION_SECRET=your_session_secret
```

4. Start the development server:
```bash
npm start
```

The application will be running on `http://localhost:3000`

## Project Structure

```
├── admin/          # Admin panel routes and views
├── hod/            # HOD panel routes and views
├── teacher/        # Teacher panel routes and views
├── student/        # Student panel routes and views
├── config/         # Configuration files
├── public/         # Static assets (CSS, JS, images)
├── video/          # Video files
├── Internal-answer/ # Internal answer files
├── External-answer/ # External answer files
├── server.js       # Main server file
└── package.json    # Project dependencies
```

## Usage

1. Access the application through your web browser
2. Register or login with appropriate credentials
3. Navigate through different panels based on your role
4. Upload and manage files as needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License. 
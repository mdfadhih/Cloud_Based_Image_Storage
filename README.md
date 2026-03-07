# Serverless Image Storage System

![React](https://img.shields.io/badge/Frontend-React-blue)
![AWS](https://img.shields.io/badge/Cloud-AWS-orange)
![Serverless](https://img.shields.io/badge/Architecture-Serverless-green)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black)

A **cloud-native serverless image management platform** that allows users to upload images, automatically detect objects using YOLO, generate thumbnails, and search images by tags.

The system combines **React + Vite on the frontend** with **AWS serverless services** including S3, Lambda, API Gateway, and DynamoDB to create a scalable and event-driven architecture.

Users can upload images, search by detected objects, edit tags, and manage stored images through a modern web interface.

---

# Live Demo

https://serverless-image-storage.vercel.app

---

# Project Screenshots

## ServerlessCover Image

<img src="screenshots/serverless_cover.png" width="700" />

## Search by Tags

![Search Screenshot](screenshots/search.png)

## Edit Tags

![Edit Screenshot](screenshots/edit-tags.png)

## Delete Image

![Delete Screenshot](screenshots/delete.png)

---

# AWS Architecture Diagram

![Architecture Diagram](architecture/serverless-architecture.png)

---

# System Architecture

The application follows a **serverless event-driven architecture**.

User
↓
React Frontend (Vercel)
↓
API Gateway
↓
AWS Lambda Functions
↓
Amazon S3 + DynamoDB
↓
YOLO Object Detection

---

# Architecture Workflow

## Image Upload Flow

User uploads image
↓
React frontend sends request to API Gateway
↓
Lambda generates pre-signed upload URL
↓
Image uploaded to S3
↓
S3 event triggers Lambda
↓
Lambda generates thumbnail and runs YOLO detection
↓
Metadata + tags stored in DynamoDB

---

# Key Features

## Image Upload

Users can upload images through the web interface. Images are stored securely in **Amazon S3**.

## Automatic Thumbnail Generation

A Lambda function generates thumbnails for faster gallery loading.

## Object Detection with YOLO

Images are processed with a **YOLO object detection model**, automatically generating searchable tags.

Example detected tags:

person
car
dog
bicycle

## Search Images by Tags

Users can search for images based on detected objects.

Example queries:

person
car
person + dog

## Edit Tags

Users can modify detected tags to improve search accuracy.

## Delete Images

Images and their metadata can be removed from **S3 and DynamoDB**.

## Full Size Image Access

Users can retrieve the original high-resolution image stored in S3.

## Search by Image

Users can upload an image and search for other images with similar detected objects.

---

# Technology Stack

## Frontend

React
Vite
AWS Amplify UI
Axios

## Cloud Infrastructure

AWS Lambda
Amazon S3
Amazon DynamoDB
API Gateway

## Machine Learning

YOLO object detection model

## Deployment

Vercel (Frontend)
AWS Serverless backend

---

# Project Structure

```
serverless-image-storage
│
├── src
│   ├── components
│   ├── pages
│   ├── data
│   └── assets
│
├── lambda
│   ├── createThumbnail
│   ├── detectObjects
│   ├── searchByTags
│   ├── editTags
│   └── deleteImage
│
├── screenshots
│   ├── upload.png
│   ├── search.png
│   ├── edit-tags.png
│   └── delete.png
│
├── architecture
│   └── serverless-architecture.png
│
├── package.json
└── README.md
```

---

# Environment Variables

Create a `.env` file in the project root.

```
VITE_UPLOAD_URL=
VITE_SEARCH_URL=
VITE_EDIT_TAGS_URL=
VITE_DELETE_URL=
VITE_BUCKET=
```

These variables connect the frontend to AWS API Gateway and S3.

---

# Running the Project Locally

Install dependencies:

```
npm install
```

Start development server:

```
npm run dev
```

Open:

```
http://localhost:5173
```

---

# Deployment

## Frontend Deployment

Frontend is deployed using **Vercel**.

Build command:

```
npm run build
```

Output directory:

```
dist
```

## Backend Deployment

AWS services used:

Amazon S3
AWS Lambda
API Gateway
DynamoDB

---

# Security Considerations

IAM roles control Lambda permissions
S3 bucket policies restrict access
CORS configured for frontend domain
Environment variables stored securely

---

# Future Improvements

User authentication using AWS Cognito
Pagination for large image collections
CloudFront CDN for faster image delivery
Image similarity search using embeddings
Admin dashboard for moderation

---

# Skills Demonstrated

Serverless architecture design
Cloud infrastructure on AWS
Event-driven systems
Machine learning integration
Full-stack development
REST API design

---

# License

MIT License

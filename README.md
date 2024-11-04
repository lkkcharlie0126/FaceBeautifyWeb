# Face Beautifier

This project is a web application that allows users to upload images and apply a face beautification process. The application consists of a frontend built with React and a backend service that manages AWS EC2 instances to perform the image processing.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Features

- Upload images for processing.
- Start and stop AWS EC2 instances remotely.
- Check the status of the EC2 instance.
- Beautify faces in uploaded images using a remote service.

## Architecture

The project consists of two main components:

1. **Frontend**: A React application that provides the user interface for uploading images and displaying results.
2. **Backend**: A FastAPI application that manages AWS EC2 instances and handles image processing requests.

## Installation

### Prerequisites

- Docker and Docker Compose installed on your machine.
- AWS account with access to EC2 services.

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/face-beautifier.git
   cd face-beautifier
   ```

2. Create a `.env` file in the `remote_controller` directory with your AWS credentials and instance details:

   ```plaintext
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   INSTANCE_ID=your_instance_id
   REGION_NAME=your_region_name
   ```

3. Build and start the services using Docker Compose:

   ```bash
   docker-compose up --build
   ```

4. Access the application at `http://localhost:3000`.

## Usage

- **Start Remote Instance**: Click the "Start Remote Instance" button to start the EC2 instance.
- **Upload Image**: Use the image uploader to select and upload an image for processing.
- **View Results**: Once processing is complete, view the beautified image.

## Environment Variables

The following environment variables need to be set in the `.env` file for the backend service:

- `AWS_ACCESS_KEY_ID`: Your AWS access key ID.
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key.
- `INSTANCE_ID`: The ID of the EC2 instance to be managed.
- `REGION_NAME`: The AWS region where the EC2 instance is located.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.



# How does it work?

![process](process.png)

### 1. Latent space encoding

First, the image is encoded into latent space. A latent vector is found that closely represents out input image. The encoder used is based on [StyleGan2 Encoder](https://github.com/robertluxemburg/stylegan2encoder.git).



### 2. Latent vector optimisation

Now to the fun part. Using a neural network that judges attractiveness of latent vectors, that face is optimized by the neural network. 

Using a gradient ascent approach, the latent vector is slightly changed in the direction of steepest ascent, meaning we "make our face pretty".

We'll get a new latent vector that generates a "prettier" version of the original face.



### 3. Generate output image

The new latent vector is now converted back into an image by StyleGan2. The generated image is then stiched back into the original image.

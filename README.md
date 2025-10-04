# Impactor

## Repository Structure

This repository contains the core files and configuration for the **Impactor** project, developed as part of the NASA Space Apps Challenge. Below is an overview of the key files and directories:

- **app/** : Contains the application source code (controllers, models, views, helpers, jobs, mailers).
- **bin/** : Executable scripts for application setup and server startup.
- **config/** : Application configuration, including environment settings and routes.
- **db/** : Database migrations and seeds for initializing and managing schema changes.
- **lib/** : Custom modules, tasks, and reusable components.
- **public/** : Public static files served by the application (e.g., error pages, assets).
- **Gemfile** : Defines gem dependencies for the project.
- **Gemfile.lock** : Locked versions of the gem dependencies.
- **Rakefile** : Defines available Rake tasks.
- **config.ru** : Rack configuration file used to start the application.
- **Dockerfile** : Provides containerization setup for running the application with Docker.
- **Procfile.dev** : Defines process types for development environment.

---

## Getting Started

To run the project locally:

1. Install required dependencies with Bundler:  
   ```bash bundle install

2. Set up the database:   
rails db:create
rails db:migrate
rails db:seed

3. Start the development server:
rails server

4. Open your browser at:
http://localhost:3000

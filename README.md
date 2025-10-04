# Impactor

## Repository Structure

This repository contains the core files and configuration for the **Impactor** project, developed as part of the NASA Space Apps Challenge. Below is an overview of the key files and directories:

- **app/** : Contains the application source code (controllers, models, views, helpers, jobs, mailers, services).
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

## 1. Install Ruby on Linux (WSL2)

Update system packages:
sudo apt update && sudo apt upgrade -y

Install dependencies:

sudo apt install -y gnupg2 curl autoconf bison build-essential libssl-dev libyaml-dev \
  libreadline6-dev zlib1g-dev libncurses5-dev libffi-dev libgdbm-dev git

Install RVM (Ruby Version Manager) and load it:

gpg2 --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys \
  409B6B1796C275462A1703113804BB82D39DC0E3 \
  7D2BAF1CF37B13E2069D6956105BD0E739499BDB

\curl -sSL https://get.rvm.io | bash -s stable
echo 'source ~/.rvm/scripts/rvm' >> ~/.bashrc
source ~/.bashrc

Install Ruby (version 3.3.0):

rvm install 3.3.0
rvm use 3.3.0 --default

Verify:

ruby -v

2. Install PostgreSQL

Install PostgreSQL and development headers:

sudo apt install -y postgresql postgresql-contrib libpq-dev


Start PostgreSQL:

sudo systemctl enable postgresql
sudo systemctl start postgresql


Create a role matching your Linux user (replace maryseas if needed):

sudo -u postgres psql -c "CREATE ROLE (write your user) WITH LOGIN SUPERUSER;"


Create the development database:

createdb -O (write your user) impactor_development

To run the project locally:

1. Install required dependencies with Bundler:
   bundle install

2. Set up the database:   
rails db:create
rails db:migrate
rails db:seed

3. Start the development server:
rails server

4. Open your browser at:
http://localhost:3000

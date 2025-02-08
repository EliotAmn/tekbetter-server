# TekBetter - A better intranet for Epitech

# Table of contents

#### Setup guide:

- [Environement variables](#environment-variables)
- [Run in development mode](#run-in-development-mode)

## Description

TekBetter is a project that aims to create a better interface who rassemble all the tools that Epitech students use in
their daily life.

## Environment variables

### Backend (`/.env`)

| Variable                     | Description                                                                | Default value |
|------------------------------|----------------------------------------------------------------------------|---------------|
| PORT                         | Port where the server will listen                                          | 8080          |
| MONGO_HOST                   | The mongodb database hostname.                                             | mongo         |
| MONGO_PORT                   | The mongodb database port.                                                 | 27017         |
| MONGO_DB                     | The mongodb database name.                                                 | tekbetter     |
| MONGO_USER                   | The mongodb root username.                                                 |               |
| MONGO_PASSWORD               | The mongodb root password.                                                 |               |
| REDIS_HOST                   | The redis database hostname.                                               | redis         |
| REDIS_PORT                   | The redis database port.                                                   | 6379          |
| REDIS_PASSWORD               | The redis database password.                                               |               |
| REDIS_DB                     | The redis database number.                                                 | 0             |
| JWT_SECRET                   | The secret key used to sign the JWT token.                                 |               |
| AES_KEY                      | The key used to encrypt sensible data in database. 64 bytes long required. |               |
| SCRAPERS_CONFIG_FILE         | The path to the scrapers configuration file. Optional                      | scrapers.json |
| APP_URL                      | The app url used to send register links by email.                          |               |
| ENABLE_MAILER                | Enable the mailer service.                                                 | false         |
| BYPASS_CACHE_RELOAD          | This bypass the cache reload when the server is started.                   | false         |

### Frontend (`/web/.env`)

| Variable          | Description             | Default value               |
|-------------------|-------------------------|-----------------------------|
| REACT_APP_API_URL | The backend server url. | Auto detect the current url |

## Run in development mode

### Setup environment variables

You can find the front-end react app in the `web/` directory.
You need to define an environment variable `REACT_APP_API_URL` to point to the backend server.

```dotenv
# web/.env
REACT_APP_API_URL=http://localhost:8080
```

For the backend, you can create a `.env` file in the root directory of the project.
You can find a `/docker-compose.yml` file that will start a mongodb and a redis server.
Create a `scrapers.json` file in the root directory of the project to configure the scrapers, and add the following
content :

```json
[]
```

This is an example `.env` file for the backend with docker-compose usage :

```dotenv
APP_URL=http://localhost:8080
JWT_SECRET=my_jwt_secret
AES_KEY=a9421fce83c42eeab1a958c24b516943ccda3e2c4cf6ee3ada4cc78315d228d2
MONGO_HOST=localhost
MONGO_USER=your_mongo_username
MONGO_PASSWORD=your_mongo_password
REDIS_HOST=localhost
REDIS_PASSWORD=123456
DATA_PATH=./data

ENABLE_MAILER=false
```

### Run the frontend

Please check that you have `npm` and a recent version of `node` installed on your machine.
Navigate to the `web/` directory and run the following commands :

```bash
npm install -f
npm start
```

### Run the backend

Please check that you have `python3` and `pip` installed on your machine.
Go back to the root directory of the project and run the following commands :

```bash
pip install -r requirements.txt
PYTHONPATH=$(pwd) python3 app/main.py
```

#### Happy coding !

## How to configure internal (public) scrapers

An internal scraper is a scraper that will be controlled by the backend.
To configure a scraper, you need to create a `scrapers.json` file in the root directory of the project.

Here is an example of a scraper configuration :

```json
[
  {
    "id": "paris-01",
    "label": "PARIS-01",
    "access_token": "choose_a_random_string"
  },
  {
    "id": "paris-02",
    "label": "PARIS-02",
    "access_token": "choose_a_random_string"
  }
]
```

`id` is the unique identifier of the scraper.

`label` is the name of the scraper.

`access_token` is a random string that will be used to authenticate the scraper. This access token will be set in the
scraper environment variable `SCRAPER_ACCESS_TOKEN`.
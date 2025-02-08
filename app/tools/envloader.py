import os
import time

from dotenv import load_dotenv

from app.tools.teklogger import log_debug, log_warning, log_success

default_values = {
    "PORT": "8080",
    "MONGO_HOST": "mongo",
    "MONGO_PORT": "27017",
    "MONGO_DB": "tekbetter",
    "REDIS_HOST": "redis",
    "REDIS_PORT": "6379",
    "REDIS_DB": "0",
    "REDIS_PASSWORD": None,
    "APP_URL": None,
    "JWT_SECRET": None,
    "AES_KEY": None,
    "DATA_PATH": "./data",
    "ENABLE_MAILER": "false",
}


def displ_deprecated(message):
    log_warning(f"=============================================")
    log_warning("= DEPRECATION WARNING")
    log_warning(f"= -> {message}")
    log_warning("= This feature is deprecated and will be removed in the future. Please refer to the documentation.")
    log_warning(
        "= The program will continue to work for now, but you should update your configuration. Please wait 15 seconds.")
    log_warning(f"=============================================")
    time.sleep(15)


def load_env():
    """
    Load environment variables from the .env file
    Raises an exception if a required environment variable is missing
    """

    log_debug("Loading environment variables")
    load_dotenv()

    smtp_vars = ["SMTP_SERVER", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"]
    if os.getenv("ENABLE_MAILER") == "true":
        for var in smtp_vars:
            if os.getenv(var) is None:
                raise Exception(f"ENABLE_MAILER is true, so {var} must be set")

    for key, value in default_values.items():
        if os.getenv(key, None) is None:
            if value is not None and value not in smtp_vars:
                log_warning(
                    f"Missing environment variable {key}, using default value: {value}")
                os.environ[key] = value
            else:
                raise Exception(f"Missing environment variable {key}")

    if os.getenv("MONGO_USER") and os.getenv("MONGO_PASSWORD"):
        log_debug("MongoDB authentication enabled")
    else:
        log_warning("MongoDB authentication not enabled, proceeding without authentication")

    if "SCRAPERS_CONFIG_FILE" in os.environ:
        displ_deprecated(
            "SCRAPERS_CONFIG_FILE is deprecated. Please use DATA_PATH instead as a folder, and place a scrapers.json file into.")
        os.environ["SCRAPER_CONFIG_FILE"] = os.environ["SCRAPERS_CONFIG_FILE"]

    if len(os.getenv("AES_KEY")) != 64:
        raise Exception("AES_KEY must be 64 characters long")

    init_data_path(os.getenv("DATA_PATH"))


def init_data_path(path):
    if not os.path.exists(path):
        try:
            os.makedirs(path)
            log_success(f"Created data directory at path: {path}")
        except Exception as e:
            raise Exception(f"Could not create data directory at {path}: {e}")
    # Check read and write permissions
    if not os.access(path, os.R_OK):
        raise Exception(f"{path} is not readable")
    if not os.access(path, os.W_OK):
        raise Exception(f"{path} is not writable")
    # Check if the "student_pictures" directory exists
    student_pictures_path = os.path.join(path, "student_pictures")
    if not os.path.exists(student_pictures_path):
        try:
            os.makedirs(student_pictures_path)
            log_success(f"Created student_pictures directory at path: {student_pictures_path}")
        except Exception as e:
            raise Exception(f"Could not create student_pictures directory at {student_pictures_path}: {e}")
    # Check read and write permissions
    if not os.access(student_pictures_path, os.R_OK):
        raise Exception(f"{student_pictures_path} is not readable")
    if not os.access(student_pictures_path, os.W_OK):
        raise Exception(f"{student_pictures_path} is not writable")

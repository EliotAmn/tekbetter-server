import os
import threading
import pymongo
from flask import Flask, send_from_directory, render_template
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

from app.api.routes.auth_routes import load_auth_routes
from app.api.routes.calendar_routes import load_calendar_routes
from app.api.routes.global_routes import load_global_routes
from app.api.routes.modules_routes import load_module_routes
from app.api.routes.mouli_routes import load_mouli_routes
from app.api.routes.project_routes import load_project_routes
from app.api.routes.scrapers_routes import load_scrapers_routes
from app.api.routes.settings_routes import load_settings_routes
from app.api.routes.sync_routes import load_sync_routes
from app.globals import Globals
from app.services.module_service import ModuleService
from app.services.mouli_service import MouliService
from app.services.publicscraper_service import PublicScraperService
from app.tools.envloader import load_env
from app.tools.teklogger import log_info, log_debug, log_error, log_success, log_warning
from app.services.redis_service import RedisService
import flask_monitoringdashboard as flask_monitoring
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from app.metrics_updater import update_metrics

_is_initialized = False

os.chdir(os.path.join(os.path.dirname(__file__), ".."))


def init_services():
    """Initialize database connections and services"""
    global _is_initialized

    if _is_initialized:
        return

    try:
        load_env()
    except Exception as e:
        log_error(str(e))
        exit(1)

    # Setup Sentry if DSN is provided
    if os.getenv("SENTRY_DSN") != "":
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=os.getenv("SENTRY_DSN"),
                send_default_pii=True,
                traces_sample_rate=1.0,
                _experiments={
                    "continuous_profiling_auto_start": True,
                },
            )
            log_success("Initialized Sentry")
        except Exception as e:
            log_error(f"Failed to initialize Sentry: {e}")

    # Connect to MongoDB
    mongo_url = f"mongodb://{os.getenv('MONGO_HOST')}:{os.getenv('MONGO_PORT')}?directConnection=true"
    log_info("Connecting to MongoDB...")
    Globals.database = pymongo.MongoClient(mongo_url)[os.getenv('MONGO_DB')]

    try:
        Globals.database.list_collection_names()
    except Exception as e:
        log_error(f"Failed to connect to MongoDB server at {mongo_url}: {e}")
        raise

    log_success("Connected to MongoDB")

    # Connect to Redis
    log_info("Connecting to Redis...")
    RedisService.connect(
        host=os.getenv("REDIS_HOST"),
        port=os.getenv("REDIS_PORT"),
        db=os.getenv("REDIS_DB"),
        password=os.getenv("REDIS_PASSWORD")
    )
    log_success("Connected to Redis")

    # Load scrapers from config file
    if os.getenv("SCRAPERS_CONFIG_FILE") != "":
        PublicScraperService.load_scrapers_from_config()
        PublicScraperService.reassign_scrapers()

    _is_initialized = True


def create_app():
    """Create and configure the Flask application"""
    log_info("Welcome to TekBetter server !")
    log_debug("Debug mode enabled")

    init_services()

    flask_app = Flask(__name__, static_folder=os.getenv("DASHBOARD_BUILD_PATH", "../web/build"))
    if os.path.exists(os.path.join(os.getenv("DATA_PATH"), "monitoring.cfg")):
        flask_monitoring.config.init_from(file=os.path.join(os.getenv("DATA_PATH"), "monitoring.cfg"))
        flask_monitoring.bind(flask_app)
    else:
        log_warning("FlaskMonitoringDashboard config file not found, monitoring dashboard disabled")

    # Load the routes
    load_scrapers_routes(flask_app)
    load_project_routes(flask_app)
    load_module_routes(flask_app)
    load_mouli_routes(flask_app)
    load_global_routes(flask_app)
    load_calendar_routes(flask_app)
    load_sync_routes(flask_app)
    load_auth_routes(flask_app)
    load_settings_routes(flask_app)

    # Serve React App
    @flask_app.route('/', defaults={'path': ''})
    @flask_app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(flask_app.static_folder + '/' + path):
            return send_from_directory(flask_app.static_folder, path)
        else:
            return send_from_directory(flask_app.static_folder, 'index.html')

    CORS(flask_app)
    ModuleService.purge_nonid_modules()

    # Prometheus metrics
    @flask_app.route('/metrics')
    def metrics():
        return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

    # Scheduler for periodic tasks
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=update_metrics, trigger="interval", seconds=60)
    update_metrics()
    scheduler.start()

    import atexit
    atexit.register(lambda: scheduler.shutdown())

    return flask_app


app = create_app()

if __name__ == "__main__":
    try:
        if os.getenv("BYPASS_CACHE_RELOAD", "false") == "false":
            threading.Thread(target=MouliService.refresh_all_cache).start()
        app.run("0.0.0.0", os.getenv("PORT", 8080), debug=False, use_reloader=False)
    except KeyboardInterrupt:
        # Shutdown services
        log_info("Closing redis connection...")
        RedisService.disconnect()
        log_info("Closing MongoDB connection...")
        if hasattr(Globals, 'database') and Globals.database:
            Globals.database.client.close()

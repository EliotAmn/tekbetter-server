import base64
from datetime import datetime

from flask import request

from app.api.middlewares.scraper_auth_middleware import \
    scraper_auth_middleware, public_scraper_auth_middleware
from app.models.Module import Module
from app.models.NetsoulData import NetSoulData
from app.models.PlanningEvent import PlanningEvent
from app.models.Project import Project
from app.models.PublicScraper import PublicScraper
from app.parsers.module_parser import fill_module_from_intra
from app.parsers.mouli_parser import build_mouli_from_myepitech
from app.parsers.planning_parser import fill_event_from_intra
from app.parsers.project_parser import fill_project_from_intra
from app.parsers.student_parser import fill_student_from_intra
from app.services.module_service import ModuleService
from app.services.mouli_service import MouliService
from app.services.planning_service import PlanningService
from app.services.project_service import ProjectService
from app.services.publicscraper_service import PublicScraperService
from app.services.redis_service import RedisService
from app.services.student_picture_service import StudentPictureService
from app.services.student_service import StudentService
from app.tools.aes_tools import decrypt_token
from app.tools.teklogger import log_warning, log_debug


def load_scrapers_routes(app):
    @app.route("/api/scraper/config", methods=["GET"])
    @public_scraper_auth_middleware()
    def get_publicscraper_config():
        scraper: PublicScraper = request.scraper
        PublicScraperService.reassign_scrapers()
        students = StudentService.get_students_by_public_scraper(scraper.id)

        res = []

        for student in students:
            if not student.microsoft_session:
                student.public_scraper_id = None
                StudentService.update_student(student)
                continue
            res.append({
                "microsoft_session": decrypt_token(student.microsoft_session),
                "tekbetter_token": student.scraper_token,
            })

        return {
            "intervals": {
                "moulinettes": 30,
                "projects": 160,
                "planning": 600,
                "modules": 90,
                "profile": 600,
            },
            "students": res
        }

    @app.route("/api/scraper/infos", methods=["GET"])
    @scraper_auth_middleware()
    def get_all_moulis():
        """
        Return the list of ids of all already scraped moulis
        """
        student = request.student
        moulis_ids = MouliService.get_student_mouliids(student.id)

        netsoul = StudentService.get_netsoul(student.id)
        if netsoul:
            netsoul_reload_interval = 3 # every 3 hours
            last_update = datetime.strptime(netsoul.last_update, "%Y-%m-%d %H:%M:%S")
            need_netsoul = (not netsoul or (datetime.now() - last_update).total_seconds() > netsoul_reload_interval * 3600)
        else:
            need_netsoul = True
        asked_slugs = []
        projects = ProjectService.get_student_projects(student.id)
        for project in projects:
            if project.slug is None:
                asked_slugs.append({
                    "code_acti": project.code_acti,
                    "year": project.scolar_year,
                    "module": project.code_module,
                    "instance": project.code_instance,
                })

        start = datetime.now().replace(year=datetime.now().year - 5)
        end = datetime.now().replace(year=datetime.now().year + 1)

        proj_start = ProjectService.get_latest_date_before_now(student.id)
        plan_start = PlanningService.get_latest_date_before_now(student.id)

        proj_start = datetime.strptime(proj_start, "%Y-%m-%d %H:%M:%S") if proj_start else None
        plan_start = datetime.strptime(plan_start, "%Y-%m-%d %H:%M:%S") if plan_start else None

        if proj_start and plan_start:
            start = proj_start if proj_start < plan_start else plan_start

        return {
            "known_tests": moulis_ids,
            "known_modules": [m.module_id for m in ModuleService.get_recent_fetched_modules(student.id)],
            "asked_slugs": asked_slugs,
            "need_netsoul": need_netsoul,
            "student_login": student.login,
            "need_picture_login": None if StudentPictureService.is_picture_exists(student.login) else student.login,
            "fetch_start": start.strftime("%Y-%m-%d"),
            "fetch_end": end.strftime("%Y-%m-%d")
        }

    @app.route("/api/scraper/status", methods=["POST"])
    @scraper_auth_middleware(only_login=True)
    def update_scraper_status():
        """
        Update the sync status of the scraper
        """

        student_login = request.student_login

        values_whitelist = ["loading", "success", "error"]
        keys_whitelist = ["mouli", "planning", "projects", "slugs", "modules", "avatar", "profile", "auth", "scraping", "netsoul"]

        data = request.json

        for k in keys_whitelist:
            if not k in data:
                continue
            value = data[k]
            if not value in values_whitelist:
                continue
            RedisService.set(f"{student_login}:scraper-status:{k}", value)
            if not k == "scraping" or value == "success":
                RedisService.set(f"{student_login}:scraper-status:{k}:last-update", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            log_debug(f"Updated scraper status for {student_login} : {k} -> {value}")

        return "OK"

    @app.route("/api/scraper/push", methods=["POST"])
    @scraper_auth_middleware()
    def push_data():
        """
        Handle the reception of the new scraped data
        """
        student = request.student
        data = request.json

        required_keys = ["mouli", "modules", "profile", "planning", "projects", "slugs", "picture", "netsoul"]
        for key in required_keys:
            if key not in data:
                log_warning(f"Failed to retrieve data from scraper for user {student.login} : Missing key {key}")
                return {"message": f"Missing key {key}"}, 400

        if data["profile"] is not None:
            fill_student_from_intra(data["profile"], student)
            StudentService.update_student(student)

        if data["projects"] is not None:
            for proj in data["projects"]:
                project = Project()
                fill_project_from_intra(proj, project, student.id)
                project.last_update = datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S")
                ProjectService.upload_project(project)

        if data["planning"] is not None:
            events = []
            for event in data["planning"]:
                e = PlanningEvent()
                events.append(fill_event_from_intra(event, e, student.id))
            PlanningService.sync_events(events, student.id)

        if data["mouli"] is not None:
            for mouli_id, mouli_data in data["mouli"].items():
                mouli = build_mouli_from_myepitech(mouli_id, mouli_data,
                                                   student.id)
                MouliService.upload_mouli(mouli)

        if "netsoul" in data and data["netsoul"] is not None:
            StudentService.upload_netsoul(student.id, data["netsoul"])


        if data["slugs"] is not None:
            for project_id, slug in data["slugs"].items():
                project = ProjectService.get_project_by_code_acti(project_id,
                                                                  student.id)
                if not project:
                    continue
                project.slug = slug if slug else "unknown"
                ProjectService.upload_project(project)

        if data["picture"] is not None:
            StudentPictureService.add_student_picture(student.login, base64.b64decode(data["picture"]))

        if data["modules"] is not None:
            for module_data in data["modules"]:
                module = Module()
                module.student_id = student.id
                if not fill_module_from_intra(module_data, module, student.id):
                    continue
                ModuleService.upload_module(module)

        return {"message": "Data pushed"}

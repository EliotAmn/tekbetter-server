from flask import request, make_response

from app.api.middlewares.student_auth_middleware import student_auth_middleware
from app.services.planning_service import PlanningService
from app.services.project_service import ProjectService
from app.services.redis_service import RedisService
from app.services.student_picture_service import StudentPictureService
from app.services.student_service import StudentService


def load_global_routes(app):
    @app.route("/api/global/sync-status", methods=["GET"])
    @student_auth_middleware()
    def global_sync_status():
        student = request.student

        def forkey(k):
            value = RedisService.get(f"{student.login}:scraper-status:{k}")
            if not value:
                return None
            date = RedisService.get(f"{student.login}:scraper-status:{k}:last-update")
            if not date:
                return None
            return {
                "status": value,
                "last_update": date
            }

        keys = ["mouli", "planning", "projects", "slugs", "modules", "avatar", "profile", "auth", "scraping","netsoul"]
        result = {}

        for k in keys:
            result[k] = forkey(k)

        return {
            "status": result,
            "scraper_id": student.public_scraper_id
        }


    @app.route("/api/student/<string:student_id>", methods=["GET"])
    @student_auth_middleware()
    def get_student(student_id: str):
        student = request.student

        if student_id == "myself":
            stud = student
        else:
            stud = StudentService.get_student_by_id(student_id)
            if not stud:
                return {"message": "Student not found"}, 404
            if not student.is_consent_share or not stud.is_consent_share:
                return {"message": "Student not found"}, 404

        return {
            "login": stud.login,
            "id": stud.id,
            "name": f"{stud.first_name} {stud.last_name}" if stud.first_name and stud.last_name else None,
        }

    @app.route("/api/global/picture/<string:student_login>", methods=["GET"])
   # @student_auth_middleware()
    def global_picture(student_login):
        picture_bytes = StudentPictureService.get_student_picture(student_login)

        if not picture_bytes:
            return {"message": "Student picture not found"}, 404

        response = make_response(picture_bytes)
        response.headers.set('Content-Type', 'image/jpeg')
        response.headers.set(
            'Content-Disposition', 'attachment', filename='%s.jpg' % student_login)
        return response

    @app.route("/api/global/netsoul", methods=["GET"])
    @student_auth_middleware()
    def global_netsoul():
        """
        Get the netsoul data for a student
        """
        student = request.student
        netsoul = StudentService.get_netsoul(student.id)
        if not netsoul:
            return {"data": [], "last_update": None}
        return netsoul.to_api()
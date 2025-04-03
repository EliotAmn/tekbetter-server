from datetime import timezone, timedelta, datetime

from flask import request, Response
from ics import Calendar, Event, DisplayAlarm
from app.api.middlewares.student_auth_middleware import student_auth_middleware
from app.services.planning_service import PlanningService
from app.services.project_service import ProjectService
from app.services.student_service import StudentService


def load_calendar_routes(app):
    @app.route("/api/calendar", methods=["GET"])
    @student_auth_middleware()
    def calendar_token_route():
        student = request.student
        return {
            "token": student.scraper_token,
        }

    @app.route("/api/calendar/regenerate", methods=["POST"])
    @student_auth_middleware()
    def calendar_regenerate_route():
        student = request.student
        new_token = StudentService.regenerate_scraper_token(student)
        return {
            "token": new_token,
        }

    @app.route("/ical/<string:token>/<string:type>.ics", methods=["GET"])
    def calendar_export_route(token, type):
        student = StudentService.get_student_by_scrapetoken(token)
        if not student:
            return "Invalid token", 401
        if type not in ["projects", "activities", "mixed"]:
            return "File not found:" + type + ".ics", 400

        cal = Calendar()

        activities = []
        projects = []

        if type in ["activities", "mixed"]:
            activities = PlanningService.get_student_events(student.id)
        if type in ["projects", "mixed"]:
            projects = ProjectService.get_student_projects(student.id)

        # Define the French timezone (UTC+1)
        french_timezone = timezone(timedelta(hours=1))
        # Check if i'ts summer time
        if datetime.now().astimezone(french_timezone).dst() != timedelta(0):
            french_timezone = timezone(timedelta(hours=2))

        for activity in activities:
            e = Event()
            e.name = activity.title
            e.location = activity.location
            e.alarms = [DisplayAlarm(trigger=timedelta(hours=-1)), DisplayAlarm(trigger=timedelta(minutes=5))]

            bg_date = datetime.strptime(activity.date_start, "%Y-%m-%d %H:%M:%S")
            end_date = datetime.strptime(activity.date_end, "%Y-%m-%d %H:%M:%S")
            e.begin = bg_date.replace(tzinfo=french_timezone)
            e.end = end_date.replace(tzinfo=french_timezone)
            cal.events.add(e)

        for project in projects:
            e = Event()
            e.name = project.title
            bg_date = datetime.strptime(project.date_start, "%Y-%m-%d %H:%M:%S")
            end_date = datetime.strptime(project.date_end, "%Y-%m-%d %H:%M:%S")
            e.begin = bg_date.replace(tzinfo=french_timezone)
            e.end = end_date.replace(tzinfo=french_timezone)
            e.make_all_day()
            cal.events.add(e)

        ics_content = cal.serialize()
        response = Response(ics_content, mimetype="text/calendar")
        response.headers["Content-Disposition"] = f"attachment; filename={type}.ics"

        return response
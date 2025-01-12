import random
import string
import uuid
from datetime import datetime
from app.globals import Globals
from app.models.Student import Student

def _build_student(mongo_output):
    student = Student()
    student._id = mongo_output["_id"]
    student.login = mongo_output["login"]
    student.city = mongo_output["city"]
    student.credits = mongo_output["credits"]
    student.gpa = mongo_output["gpa"]
    student.first_name = mongo_output["first_name"]
    student.last_name = mongo_output["last_name"]
    student.promo_year = mongo_output["promo_year"]
    student.last_update = mongo_output["last_update"]
    student.scraper_token = mongo_output.get("scraper_token", None)
    return student

class StudentService:
    @staticmethod
    def get_student_by_login(login: str) -> Student:
        student = Globals.database["students"].find_one({"login": login})
        return _build_student(student) if student else None

    @staticmethod
    def get_student_by_id(student_id: int) -> Student:
        student = Globals.database["students"].find_one({"_id": student_id})
        return _build_student(student) if student else None

    @staticmethod
    def get_all_students() -> [Student]:
        students = Globals.database["students"].find()
        return [_build_student(student) for student in students]

    @staticmethod
    def add_student(student: Student):
        if StudentService.get_student_by_login(student.login):
            return
        student.last_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        student.internal_id = uuid.uuid4().hex
        Globals.database["students"].insert_one(student.to_dict())
        StudentService.regenerate_scraper_token(student)
        return student

    @staticmethod
    def update_student(student: Student):
        student.last_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        Globals.database["students"].update_one({"_id": student.id}, {"$set": student.to_dict()})

    @staticmethod
    def delete_student(student: Student):
        Globals.database["students"].delete_one({"_id": student.id})

    @staticmethod
    def get_student_by_scrapetoken(token: str) -> Student:
        student = Globals.database["students"].find_one({"scraper_token": token})
        return _build_student(student) if student else None

    @staticmethod
    def regenerate_scraper_token(student: Student):
        token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
        student.scraper_token = f"{student.login.split('@')[0]}_{token}"
        StudentService.update_student(student)
        return student.scraper_token
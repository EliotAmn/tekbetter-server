import os
import random
import string
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.testing.provision import upsert

from app.globals import Globals
from app.models.NetsoulData import NetSoulData, NetSoulDayLog
from app.models.Student import Student
from app.services.mail_service import MailService
from app.services.redis_service import RedisService
from app.tools.jwt_engine import generate_jwt
from app.tools.password_tools import hash_password
from app.tools.teklogger import log_debug, log_warning


class StudentService:
    @staticmethod
    def get_student_by_login(login: str) -> Student:
        student = Globals.database["students"].find_one({"login": login})
        return Student(student) if student else None

    @staticmethod
    def get_student_by_id(student_id: str) -> Student or None:
        student = Globals.database["students"].find_one({"_id": student_id})
        return Student(student) if student else None

    @staticmethod
    def filter_share_consent(student_ids: [str]) -> [str]:
        students = Globals.database["students"].find(
            {"_id": {"$in": [str(sid) for sid in student_ids]}, "is_consent_share": True})

        return [student["_id"] for student in students if student]

    @staticmethod
    def get_netsoul(student_id: str):
        result = Globals.database["netsoul"].find_one({"student_id": student_id})
        if not result:
            return None
        return NetSoulData(result)

    @staticmethod
    def upload_netsoul(student_id: str, from_scraper_series: [dict]):
        out = NetSoulData()
        out.student_id = student_id
        out.last_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for d in from_scraper_series:
           out.data.append(NetSoulDayLog(d["date"], d["student_hours"], d["average_hours"]))

        if not StudentService.get_netsoul(student_id):
            Globals.database["netsoul"].insert_one(out.to_dict())
        else:
            Globals.database["netsoul"].update_one({"student_id": student_id}, {"$set": out.to_dict()})

    @staticmethod
    def get_students_by_public_scraper(scraper_id: str) -> [Student]:
        students = Globals.database["students"].find(
            {"public_scraper_id": scraper_id})
        return [Student(student) for student in students]

    @staticmethod
    def get_all_students() -> [Student]:
        students = Globals.database["students"].find()
        return [Student(student) for student in students]

    @staticmethod
    def get_all_students_count() -> int:
        return Globals.database["students"].count_documents({})

    @staticmethod
    def get_all_students_verified_count() -> int:
        return Globals.database["students"].count_documents({"last_update": {"$ne": None}})

    @staticmethod
    def get_students_count_by_campus_and_promo():
        pipeline = [
            {
                "$group": {
                    "_id": {"city": "$city", "scolaryear_id": "$scolaryear_id"},
                    "count": {"$sum": 1}
                }
            }
        ]
        return list(Globals.database["students"].aggregate(pipeline))

    @staticmethod
    def get_verified_students_count_by_campus_and_promo():
        pipeline = [
            {
                "$match": {
                    "last_update": {"$ne": None},
                    "city": {"$ne": "Epitech"}
                }
            },
            {
                "$group": {
                    "_id": {"city": "$city", "scolaryear_id": "$scolaryear_id"},
                    "count": {"$sum": 1}
                }
            }
        ]
        return list(Globals.database["students"].aggregate(pipeline))

    @staticmethod
    def get_public_scraper_students() -> [Student]:
        students = Globals.database["students"].find(
            {"microsoft_session": {"$ne": None}})
        return [Student(student) for student in students]

    @staticmethod
    def add_student(student: Student):
        if StudentService.get_student_by_login(student.login):
            return
        student._id = str(uuid4()).replace("-", "")
        student.last_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
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
        return Student(student) if student else None

    @staticmethod
    def regenerate_scraper_token(student: Student):
        token = ''.join(
            random.choices(string.ascii_letters + string.digits, k=32))
        student.scraper_token = f"{student.login.split('@')[0]}_{token}"
        StudentService.update_student(student)
        return student.scraper_token

    @staticmethod
    def send_reset_password_email(email: str):
        student = StudentService.get_student_by_login(email)
        if not student:
            return

        redis_key = f"reset_password:{student.id}"
        if RedisService.get(redis_key):
            # Already sent a reset password email, wait 5 minutes
            return
        password = ''.join(random.choices(string.ascii_letters + string.digits + string.punctuation, k=15))
        RedisService.set(redis_key, password, 60 * 5)  # Expires in 5 minutes

        if os.getenv("ENABLE_MAILER") == "true":
            subject = "Reset Your TekBetter Password"
            body = f"""\
            Hello you,
            
            It seems you have requested a password reset for your TekBetter account. To reset your password please enter this password for the next 5 minutes:
            {password}
            
            After you have logged in, this password will erase your last password.
            If you did not request this password reset, you can safely ignore this email.
            
            Best regards,
            The TekBetter Team
            """
            MailService.send_mail(email, subject, body)
        else:
            log_warning(
                f"Mailer is disabled, not sending email. This is the new password for {email}: {password}")

    @staticmethod
    def create_register_ticket(email: str):
        ticket = ''.join(
            random.choices(string.ascii_letters + string.digits, k=64))
        ticket = "tbticket_" + ticket
        ticket_url = f"{os.getenv("APP_URL")}/auth?ticket={ticket}"
        RedisService.set(f"register_ticket_{ticket}", email,
                         60 * 60)  # Expires in 1 hour
        log_debug(f"Register ticket created for {email}: {ticket_url}")
        if os.getenv("ENABLE_MAILER") == "true":
            subject: str = "Confirm Your TekBetter Account"
            body: str = f"""\
            Hello,
    
            Thank you for creating a TekBetter account! To complete your registration, please confirm your email address by clicking the link below:
    
            {ticket_url}
    
            Please note that this link will expire in 1 hour. If you did not request this account, you can safely ignore this email.
    
            Thank you for choosing TekBetter. We’re excited to have you on board!
    
            Best regards,  
            The TekBetter Team
            """
            MailService.send_mail(email, subject, body)
        else:
            log_warning(
                "Mailer is disabled, not sending email. You can use the following link to confirm your account:" + ticket_url)
        return ticket

    @staticmethod
    def get_ticket_email(ticket: str):
        return RedisService.get(f"register_ticket_{ticket}")

    @staticmethod
    def create_student_by_ticket(ticket: str, password: str):
        email = RedisService.get(f"register_ticket_{ticket}")
        if not email:
            return None
        student = Student()
        student.login = email
        student.password_hash = hash_password(password)
        stud = StudentService.add_student(student)
        if not stud:
            return None
        RedisService.delete(f"register_ticket_{ticket}")
        return stud

    @staticmethod
    def generate_jwt_token(student: Student):
        return generate_jwt(student, datetime.utcnow() + timedelta(days=900))

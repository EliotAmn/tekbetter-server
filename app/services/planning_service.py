import random
import string
import uuid
from datetime import datetime
from app.globals import Globals
from app.models.PlanningEvent import PlanningEvent
from app.models.Project import Project
from app.models.Student import Student


class PlanningService:

    @staticmethod
    def get_student_events_code_actis(student_id: int):
        return [int(event["code_acti"]) for event in Globals.database["planning"].find({"student_id": student_id})]

    @staticmethod
    def get_student_events(student_id: int):
        return [PlanningEvent(event) for event in Globals.database["planning"].find({"student_id": student_id})]


    @staticmethod
    def create_event(event: PlanningEvent):
        event.fetch_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        event._id = uuid.uuid4().hex
        Globals.database["planning"].insert_one(event.to_dict())
        return event

    @staticmethod
    def delete_event(event: PlanningEvent):
        Globals.database["planning"].delete_one({"_id": event.mongo_id})

    @staticmethod
    def update_event(event: PlanningEvent):
        Globals.database["planning"].update_one({"_id": event.mongo_id}, {"$set": event.to_dict()})

    @staticmethod
    def sync_events(events: [PlanningEvent], student_id: int):
        current_events = PlanningService.get_student_events(student_id)
        current_code_actis = [event.code_acti for event in current_events]

        for event in events:
            event.fetch_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if event.code_acti in current_code_actis:
                curr = [ev for ev in current_events if ev.code_acti == event.code_acti][0]
                event._id = curr._id
                PlanningService.update_event(event)
            else:
                PlanningService.create_event(event)
        # Delete events that are not in the list
        for event in current_events:
            if event.code_acti not in [e.code_acti for e in events]:
                PlanningService.delete_event(event)
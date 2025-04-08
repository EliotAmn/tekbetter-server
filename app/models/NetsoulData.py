class NetSoulDayLog:
    timestamp: int
    student_hours: int
    average_hours: int

    def __init__(self, timestamp, student_hours, average_hours):
        self.timestamp = timestamp
        self.student_hours = student_hours
        self.average_hours = average_hours

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "student_hours": self.student_hours,
            "average_hours": self.average_hours
        }

class NetSoulData:
    student_id: str
    data: [NetSoulDayLog]
    last_update: str

    def __init__(self, mongo_data=None):
        if mongo_data is None:
            return
        self.student_id = mongo_data["student_id"]
        self.data = [NetSoulDayLog(d["timestamp"], d["student_hours"], d["average_hours"]) for d in mongo_data["data"]]
        self.last_update = mongo_data["last_update"]

    def to_dict(self):
        return {
            "_id": str(self.student_id),
            "student_id": self.student_id,
            "data": [d.to_dict() for d in self.data],
            "last_update": self.last_update
        }

    def to_api(self):
        return {
            "data": [d.to_dict() for d in self.data],
            "last_update": self.last_update
        }

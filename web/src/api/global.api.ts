import api, {vars} from "./api";
import StudentData from "../models/StudentData";

export interface SyncStatusTypeResult {
    status: "error" | "loading" | "success",
    last_update: Date
}

export interface SyncStatusType {
    mouli?: SyncStatusTypeResult,
    planning?: SyncStatusTypeResult,
    projects?: SyncStatusTypeResult,
    slugs?: SyncStatusTypeResult,
    modules?: SyncStatusTypeResult,
    avatar?: SyncStatusTypeResult,
    profile?: SyncStatusTypeResult,
    auth?: SyncStatusTypeResult,
    scraping?: SyncStatusTypeResult,
    netsoul?: SyncStatusTypeResult,
}

export async function getSyncStatus(): Promise<{status: SyncStatusType, scraper_id: string | null} > {
    const res = await api.get(`/global/sync-status`);

    let status: SyncStatusType = {}
    let data_status = res.data.status
    const scraper_id: string | null = res.data.scraper_id

    for (let key in data_status) {
        if (data_status.hasOwnProperty(key)) {
            status[key as keyof SyncStatusType] = data_status[key];
        }
    }

    // Replace dates with Date objects
    for (let key in status) {
        if (status.hasOwnProperty(key) && status[key as keyof SyncStatusType]?.last_update) {
            status[key as keyof SyncStatusType]!.last_update = new Date(status[key as keyof SyncStatusType]!.last_update);
        }
    }

    vars.updateSyncStatus(status);
    return {status: status, scraper_id: scraper_id};
}

export async function getStudentData(id: string): Promise<StudentData> {

    let results = vars.studentsCache.filter(student => student.id === id);

    if (results.length >= 1)
        return results[0];

    const res = await api.get(`/student/${id}`);
    if (res.data === null) {
        throw new Error("Student not found");
    }
    const student = new StudentData(res.data);
    vars.studentsCache.push(student);
    return student;

}

export async function getNetsoul() {
    const res = await api.get(`/global/netsoul`);
    return res.data;
}
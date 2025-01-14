export class EpiProject {
    acti_code: string;
    project_name: string;
    project_slug: string;
    module_code: string;
    module_name: string;
    start_date: Date;
    end_date: Date;
    mouli: {
        test_id: number;
        score: number;
        date: Date;
    } | null;

    constructor(data: any) {
        this.acti_code = data.code_acti;
        this.project_name = data.title;
        this.project_slug = data.slug;
        this.module_code = data.code_module;
        this.module_name = data.title_module;
        this.start_date = data.date_start;
        this.end_date = data.date_end;
        if (data.mouli) {
            this.mouli = {
                test_id: data.mouli.test_id,
                score: data.mouli.score,
                date: data.mouli.date
            }
        } else {
            this.mouli = null;
        }
    }


}
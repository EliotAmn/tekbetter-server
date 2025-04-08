import React, {useEffect} from "react";
import {faCheckCircle, faMinusCircle, faRefresh, faXmarkCircle} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {getSyncStatus, SyncStatusType, SyncStatusTypeResult} from "../../api/global.api";
import LoadingComp from "../../comps/LoadingComp";
import {vars} from "../../api/api";
import {dateToElapsed} from "../../tools/DateString";


function SyncRow(props: { title: string, status?: SyncStatusTypeResult, disable_expire?: boolean }): React.ReactElement {

    const last_update = props.status ? dateToElapsed(props.status.last_update) : "Never";
    let status = props.status ? props.status.status : "never";

    if (!props.disable_expire && props.status && props.status.last_update.getTime() < Date.now() - 3600 * 1000) {
        status = "error";
    }

    return <div className={"flex flex-row gap-2 items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition"}>
        <div className={"flex flex-row gap-2 items-center"}>
            {status === "loading" && <FontAwesomeIcon icon={faRefresh} className={"text-blue-500"} spin={true}/>}
            {status === "error" && <FontAwesomeIcon icon={faXmarkCircle} className={"text-red-500"}/>}
            {status === "never" && <FontAwesomeIcon icon={faMinusCircle} className={"text-gray-400"}/>}
            {status === "success" && <FontAwesomeIcon icon={faCheckCircle} className={"text-green-500"}/>}
            <h3 className={"font-bold"}>{props.title}</h3>
        </div>
        <p className={"text-gray-400"}>{last_update}</p>
    </div>
}

export default function SyncStatusWindow(): React.ReactElement {

    const [syncStatus, setSyncStatus] = React.useState<SyncStatusType | null>(null);
    const [scraper_id, setScraperId] = React.useState<string | null>(null);

    useEffect(() => {
        const onChange = (status: SyncStatusType) => {
            setSyncStatus(status);
        }

        const reloadInterval = setInterval(async () => {
            getSyncStatus()
                .then(({status, scraper_id}) => {
                    setScraperId(scraper_id);
                })
                .catch(() => {});
        }, 3000);


        vars.registerSyncStatusCallback(onChange);

        return () => {
            vars.syncStatusCallbacks = vars.syncStatusCallbacks.filter(callback => callback !== onChange);
            clearInterval(reloadInterval);
        }

    }, []);

    if (syncStatus === null) {
        return <LoadingComp/>
    }

    return <div className={"p-2"}>
        <div>
            <p className={"text-gray-400"}>Last update: {dateToElapsed(new Date())}</p>
            <p className={"text-gray-400"}>Scraper ID: {scraper_id || "Private"}</p>
        </div>

        <div className={"flex flex-col"}>
            <SyncRow title={"Scraper status"} status={syncStatus.scraping} key={"scraping"}/>
            <SyncRow title={"Microsoft Authentication"} status={syncStatus.auth} key={"auth"} disable_expire={true}/>
            <div className={"bg-black opacity-5 h-0.5 mb-5"}/>
            <SyncRow title={"Marvin's tests"} status={syncStatus.mouli} key={"moulinettes"}/>
            <SyncRow title={"Intra Calendar"} status={syncStatus.planning} key={"calendar"}/>
            <SyncRow title={"Presence activity"} status={syncStatus.netsoul} key={"netsoul"}/>
            <SyncRow title={"Projects"} status={syncStatus.projects} key={"projects"}/>
            <SyncRow title={"Links between tests and projects"} status={syncStatus.slugs} key={"slugs"} />
            <SyncRow title={"Modules & RoadBlocks"} status={syncStatus.modules} key={"modules"}/>
            <SyncRow title={"Your avatar"} status={syncStatus.avatar} key={"avatar"} disable_expire={true}/>
            <SyncRow title={"Intra Profile"} status={syncStatus.profile} key={"profile"}/>

        </div>
    </div>
}
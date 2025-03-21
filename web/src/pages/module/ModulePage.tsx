import {BasicBox} from "../../comps/WindowElem";
import React, {useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import EpiCoinFilled from "../../assets/svg/epicoinfilled.svg";

import {
    faBrain,
    faCalendarCheck,
    faCheckCircle, faCoins,
    faHammer, faHourglass,
    faMinusCircle, faPlus, faQuestionCircle,
    faUserGraduate,
    faWarning, faXmarkCircle
} from "@fortawesome/free-solid-svg-icons";
import {EpiModule} from "../../models/Module";
import getModules from "../../api/module.api";
import LoadingComp from "../../comps/LoadingComp";
import Button from "../../comps/Button";
import NoSyncComp from "../../comps/NoSyncComp";


function GradeDisplay(props: { grade: string }) {

    let grade = props.grade;

    if (grade === "Echec")
        grade = "E";
    if (grade === "Acquis")
        grade = "✓";


    const colors: { [key: string]: string } = {
        "A": "text-green-600",
        "B": "text-green-300",
        "C": "text-yellow-500",
        "D": "text-orange-500",
        "E": "text-red-500",
        "✓": "text-green-600"
    }

    if (!Object.keys(colors).includes(grade))
        return null;

    return <div className={"rounded-full bg-white dark:bg-gray-950 shadow w-5 h-5 flex flex-row items-center justify-center"}
                title={`Grade: ${props.grade}`}>
        <p className={`${colors[grade]} font-bold text-xs select-none`}>{grade}</p>
    </div>
}

function RoadBlock(props: {
    children: React.ReactNode,
    title: string,
    url: string | null,
    required_credits: number | null,
    is_registered: boolean,
    current_credits: number,
    confirmed_credits: number,
    icon: any
}) {
    return <div
        className={"flex flex-col border-l-2 border-gray-200 dark:border-gray-600 pl-2 m-1 shadow-sm rounded hover:bg-gray-100 dark:hover:bg-gray-750 transition h-full"}>
        <div className={"flex flex-row items-center justify-between gap-2 p-2"}>

            <div className={"flex flex-row items-center gap-1"}>
                {props.is_registered ? <FontAwesomeIcon icon={props.icon}/> :
                    <div className={"flex flex-row items-center gap-1"}>
                        <FontAwesomeIcon icon={faWarning} className={"text-red-500"}/>
                        <p className={"text-xs text-red-500 italic hidden sm:block"}>Not registered</p>
                    </div>
                }
                {props.url !== null ? <h2 className={"font-bold hover:underline cursor-pointer"}
                                          onClick={() => window.open(props.url!)}>{props.title}</h2>
                    : <h2 className={"font-bold  "}>{props.title}</h2>}
            </div>
            <div className={"flex flex-row items-center gap-1"}>
                {
                    props.current_credits < props.required_credits! ?
                        <FontAwesomeIcon icon={faWarning} className={"text-red-600"}/> :
                        <div className={"w-6 h-6"}>
                            <EpiCoinFilled/>
                        </div>
                }
                {props.required_credits !== null ?
                    <h2 className={"flex flex-row items-center gap-1"}>{props.current_credits}/{props.required_credits}
                        <span
                            className={"hidden sm:block"}>credits</span></h2> :
                    <h2>{props.current_credits} credits</h2>}
            </div>

        </div>
        {props.children}
    </div>
}


function ModuleList(props: { modules: EpiModule[] }) {


    const is_undernoted = (m: EpiModule) => m.student_credits > 0 && m.student_credits !== m.available_credits


    return props.modules.map((m) => (
        <div
            className={"flex flex-row items-center justify-between hover:bg-gray-200 dark:hover:bg-gray-750 transition"}>
            <div className={"flex flex-row items-center gap-2"}>

                {!m.is_failed() && m.student_registered &&
                    <FontAwesomeIcon icon={faCheckCircle}
                                     className={is_undernoted(m) ? "text-orange-300" : "text-green-500"}/>}
                {!m.student_registered &&
                    <FontAwesomeIcon icon={faMinusCircle} className={"text-gray-300"}/>}
                {m.is_failed() &&
                    <FontAwesomeIcon icon={faXmarkCircle} className={"text-red-500"}/>}

                <h2 className={"hover:underline cursor-pointer"} onClick={() => {
                    //open new page
                    //https://intra.epitech.eu/module/2024/G-CUS-400/MPL-4-1/#!/all
                    window.open(`https://intra.epitech.eu/module/${m.school_year}/${m.module_code}/${m.instance_code}`, "_blank")

                }}>{m.module_title}</h2>

                {!m.student_registered &&
                    <p className={"text-xs italic text-gray-300  hidden xl:block"}>Not registered</p>}
                {m.is_failed() &&
                    <p className={"text-xs italic text-red-500"}>Module failed</p>}

                {is_undernoted(m) && <p className={"text-xs italic text-orange-300"}>Credits are missing</p>}


            </div>
            <div className={"flex flex-row items-center gap-2 px-2"}>
                <FontAwesomeIcon icon={faUserGraduate}/>
                <h2 className={(is_undernoted(m) ? "text-orange-300" : "") + " flex flex-row items-center gap-1"}>{m.student_credits}/{m.available_credits}
                    <span className={"hidden sm:block"}>credits</span></h2>
                {
                    m.student_grade !== null && <GradeDisplay grade={m.student_grade}/>
                }
            </div>
        </div>
    ))
}


function TopCard(props: { title: string, icon: any, isOk?: boolean, children: React.ReactNode }) {

    return (
        <div
            className={"flex flex-col w-full border-l-2 border-gray-200 dark:border-gray-600 pl-2 m-1 shadow-sm dark:shadow-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-750 transition"}>
            <div className={"flex flex-row items-center justify-between gap-2 p-2"}>

                <div className={"flex flex-row items-center gap-1 text"}>
                    <FontAwesomeIcon icon={props.icon}/>
                    <h2 className={"font-bold text-nowrap"}>{props.title}</h2>
                </div>
                <div>
                    <FontAwesomeIcon icon={props.isOk ? faCheckCircle : faXmarkCircle}
                                     className={props.isOk ? "text-green-500" : "text-red-500"}/>
                </div>
            </div>
            {props.children}
        </div>
    )
}


export default function ModulePage(): React.ReactElement {

    const [api_data, setApiData] = React.useState<{
        modules: EpiModule[],
        credits: number,
        current_year: number,
        required_credits: number,
        current_year_id: number,
        gpa: number | null
    } | null>(null);

    const [selected_year, setSelectedYear] = React.useState<number>(0);

    const year_modules = api_data?.modules.filter((m) => m.school_year === selected_year);

    useEffect(() => {
        getModules().then((data) => {
            setApiData(data);
            setSelectedYear(data.current_year);
        })
    }, []);

    const getStrategyCredits: () => number = () => {
        let available_credits = 0
        year_modules!
            .filter((m) => m.student_registered)
            .filter((m) => !m.is_failed())
            .forEach((m) => {
                const to_add = (m.student_grade === "N/A" ? m.available_credits : m.student_credits);
                available_credits += to_add;
            })

        return available_credits;
    }

    if (api_data === null || year_modules === undefined)
        return <LoadingComp/>;

    const prev_year_credits = 60 * (api_data?.current_year_id! - 1);
    const strategy_credits = getStrategyCredits();
    const required_credits = api_data?.required_credits;


    const generateRoadBlock = (roadblock: EpiModule) => {


        const sub_modules = year_modules!
            .filter((mod) => roadblock.roadblock_submodules.includes(mod.module_code))
            .sort((a, b) => a.student_registered ? -1 : 1);


        let available_credits = 0
        sub_modules
            .filter((m) => m.student_registered)
            .filter((m) => !m.is_failed())
            .forEach((m) => available_credits += m.student_credits > 0 ? m.student_credits : m.available_credits)


        return (
            <div key={roadblock.module_code}>
                <RoadBlock
                    title={roadblock.module_title}
                    is_registered={roadblock.student_registered}
                    url={`https://intra.epitech.eu/module/${roadblock.school_year}/${roadblock.module_code}/${roadblock.instance_code}`}
                    icon={faHammer}
                    confirmed_credits={0}
                    current_credits={available_credits}
                    required_credits={roadblock.roadblock_required_credits !== null ? roadblock.roadblock_required_credits : 0}
                >

                    <ModuleList modules={sub_modules!}/>
                </RoadBlock>
            </div>
        )
    }

    let roadblock_modules: string[] = [];
    year_modules.forEach((m) => {
        if (m.is_roadblock)
            m.roadblock_submodules.forEach((s) => {
                if (!roadblock_modules.includes(s))
                    roadblock_modules.push(s)
            })
    });

    const other_road_modules = year_modules
        .filter((m) => !m.is_roadblock)
        .filter((m) => !roadblock_modules.includes(m.module_code))
        .sort((a, b) => a.student_registered ? -1 : 1);


    const available_years = api_data.modules.map((m) => m.school_year).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a > b ? 1 : -11);

    if (available_years.length === 0)
        return <NoSyncComp/>

    const secure_credits = prev_year_credits + strategy_credits - required_credits;

    return (
        <div className={"flex flex-col flex-wrap gap-4 p-3"}>

            <div className={"flex flex-col gap-1"}>
                <h1 className={"text-2xl text font-bold"}>My Modules & Roadblocks</h1>

                <div className={"flex flex-row gap-2"}>

                    {available_years.map((year) => (
                        <Button icon={faCalendarCheck} text={`Year ${year}`} onClick={() => setSelectedYear(year)}/>
                    ))}
                </div>

            </div>


            <div className={"flex flex-col gap-4 sm:flex-row"}>

                <TopCard title={"Your GPA"} icon={faUserGraduate} isOk={true}>
                    <div className={"flex flex-row items-center gap-2 text-2xl p-2"}>
                        <div className={"flex flex-row items-center gap-2"}>
                            <FontAwesomeIcon icon={faUserGraduate} className={"text-blue-400"}/>
                            <p className={"text-xl text font-bold"}>{api_data.gpa}</p>
                        </div>
                    </div>
                </TopCard>
                <TopCard title={"Your credits"} icon={faCoins} isOk={true}>
                    <div className={"flex flex-row items-center gap-2 text-2xl"}>
                        <div className={"w-6 h-6"}>
                            <EpiCoinFilled/>
                        </div>
                        <p className={"font-bold text"}>{api_data.credits}</p>
                    </div>
                </TopCard>

                <TopCard title={"Your strategy"} icon={faBrain}
                         isOk={secure_credits >= 0}>
                    <p className={"italic text-xs text"}>To validate your year</p>
                    <div className={"flex flex-row justify-between gap-2 text-2xl"}>

                        <div className={"flex flex-row items-center gap-2"}>
                            <div className={"w-6 h-6"}>
                                <EpiCoinFilled/>
                            </div>
                            <div className={"flex text flex-row items-baseline"}>
                                <p className={"font-bold"}>{prev_year_credits + strategy_credits}</p>
                                <p className={"text-xs"}>/{required_credits} required</p>
                            </div>
                        </div>
                        <div className={"flex flex-row items-center gap-2"}>
                            <div className={"w-6 h-6"}>
                                <EpiCoinFilled/>
                            </div>
                            <div className={"flex text flex-row items-baseline gap-1"}>
                                <p className={"font-bold " + (secure_credits >= 0 ? "text-green-500" : "text-red-500")}>{secure_credits >= 0 && "+"}{secure_credits}</p>
                                <p className={"text-xs"}>{secure_credits >= 0 ? "security" : "missing"}</p>
                            </div>
                        </div>

                    </div>

                </TopCard>

                <TopCard title={"Missing credits"} icon={faHourglass}
                         isOk={api_data.required_credits - api_data.credits <= 0}>
                    <div className={"flex flex-row items-center gap-2"}>
                        <FontAwesomeIcon icon={faPlus} className={"text-yellow-500"}/>
                        <p className={"text-xl text font-bold"}>{(api_data.required_credits - api_data.credits < 0 ? 0 : api_data.required_credits - api_data.credits)}</p>
                    </div>
                </TopCard>
            </div>

            <BasicBox className={"flex-grow"}>
                <div className={"flex flex-col gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-3"}>

                    {year_modules
                        .filter((m) => m.is_roadblock).map((m) => generateRoadBlock(m))}

                    <RoadBlock
                        title={"Modules without roadblocks"}
                        url={null}
                        is_registered={true}
                        icon={faQuestionCircle}
                        confirmed_credits={0}
                        current_credits={other_road_modules.filter((m) => m.student_registered).reduce((acc, m) => acc + m.available_credits, 0)}
                        required_credits={null}
                    >
                        <ModuleList modules={other_road_modules}/>
                    </RoadBlock>
                </div>


            </BasicBox>
        </div>
    );
}
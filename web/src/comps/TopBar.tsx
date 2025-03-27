import {useNavigate} from "react-router";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBars,
    faCalendarCheck, faCheckCircle, faGears,
    faGraduationCap, faMoon, faPowerOff, faShareNodes, faSun, faUser,
    faWarning, faXmark
} from "@fortawesome/free-solid-svg-icons";
import {dateToElapsed} from "../tools/DateString";
import {useEffect, useState} from "react";
import {getStudentData, SyncStatusType} from "../api/global.api";
import StudentData from "../models/StudentData";
import {vars} from "../api/api";

function NavElement(props: { text: string, icon: any, link: string, close?: () => void }) {
    const navigate = useNavigate();
    const is_active = window.location.pathname.startsWith(props.link);

    return (
        <div
            className={"flex flex-col rounded-2xl items-start h-11 justify-center cursor-pointer px-5 transition hover:bg-blue-800 hover:text-white " + (is_active ? "bg-blue-800 text-white font-bold" : "")}
            onClick={() => {
                navigate(props.link);
                if (props.close) props.close();
            }}>
            <div className={"flex flex-row items-center justify-center"}>
                <div>
                    <FontAwesomeIcon icon={props.icon}/>
                </div>
                <p className={"ml-2"}>{props.text}</p>
            </div>

        </div>
    );
}


function GlobalSyncStatus(props: { className?: string }) {

    const [last_sync, setLastSync] = useState<Date | null>(null);

    useEffect(() => {
        const update = (status: SyncStatusType) => {
            if (status.scraping) {
                setLastSync(status.scraping.last_update);
            } else {
                setLastSync(null);
            }
        }
        vars.registerSyncStatusCallback(update);

        return () => {
            vars.syncStatusCallbacks = vars.syncStatusCallbacks.filter(callback => callback !== update);
        }
    }, []);


    const gen_visual = (color: string, icon: any, text: string) => (
        <div className={"flex px-1.5 flex-row items-center rounded-full bg-blue-300 bg-opacity-20 " + props.className}>
            <FontAwesomeIcon icon={icon} className={color} fontSize={"13px"}/>
            <p className={"text text-xs my-1 ml-1 text-nowrap"}>Sync: {text}</p>
        </div>
    );


    const total_minutes = (date: Date) => {
        const diff = new Date().getTime() - date.getTime();
        return Math.floor(diff / 60000);
    }

    if (last_sync === null)
        return gen_visual("text-red-500", faWarning, "Never Synced");

    if (total_minutes(last_sync) > 60)
        return gen_visual("text-red-500", faWarning, dateToElapsed(last_sync));
    else
        return gen_visual("text-green-500", faCheckCircle, dateToElapsed(last_sync));
}

function UserComp(props: {isDarkMode: boolean, setDarkMode: (mode: boolean) => void}) {
    const [user, setUser] = useState<StudentData | null>(null);

    useEffect(() => {
        getStudentData("myself").then((data) => {
            setUser(data);
        }).catch(() => {
        });
    }, []);

    if (user === null) return null;

    const user_name = user.name === null ? "New user" : user.name;

    return <div className={"flex flex-row h-full items-center px-3 rounded-2xl"}>
        <img
            src={`${vars.backend_url}/api/global/picture/${user.login}`}
            alt={"Epitech"}
            className={"w-10 h-10 ml-1 shadow rounded-full object-cover"}
        />
        <div className={"flex flex-col ml-2 items-start justify-center w-fit"}>
            <p className={"font-bold text-nowrap hidden xl:block"}>{user_name}</p>
            <p className={"font-bold text-nowrap xl:hidden"}>{user_name}</p>

            <GlobalSyncStatus className={"hidden sm:flex"}/>
        </div>

        <div title={"Logout"}
             className={"text-center bg-black bg-opacity-0 hover:bg-gray-200 p-2 w-10 ml-2 h-10 rounded-full cursor-pointer transition"}
             onClick={() => {
                 if (window.confirm("Are you sure you want to log out?")) {
                     localStorage.removeItem("auth");
                     window.location.reload();
                 }
             }}>
            <FontAwesomeIcon icon={faPowerOff} className={"text-red-500 cursor-pointer"} title={"Logout"}/>
        </div>
        <div title={"Toggle light/dark mode"}
             className={"text-center bg-black bg-opacity-0  p-2 w-10 ml-2 h-10 rounded-full cursor-pointer transition"}
             onClick={() => props.setDarkMode(!props.isDarkMode)}>
            <FontAwesomeIcon icon={props.isDarkMode ? faSun : faMoon} className={"cursor-pointer"} title={"Logout"}/>
        </div>
        {/*<SyncStatus/>*/}
    </div>

    // <div className={"flex flex-row items-center gap-2"}>
    //        <div className={"flex flex-row items-center mr-2"}>
    //            <img
    //                src={`${vars.backend_url}/api/global/picture/${user.login}`}
    //                alt={"Profile Picture"}
    //                className={"w-8 h-8 rounded-full object-cover mr-2"}
    //            />
    //
    //            <p className={"text-white text-nowrap"}>{user?.name}</p>
    //        </div>
    //        <div title={"Logout"}
    //             className={"text-center bg-black bg-opacity-0 hover:bg-opacity-20 h-full w-10 p-2 cursor-pointer transition"}
    //             onClick={() => {
    //                 if (window.confirm("Are you sure you want to log out?")) {
    //                     localStorage.removeItem("auth");
    //                     window.location.reload();
    //                 }
    //             }}>
    //            <FontAwesomeIcon icon={faPowerOff} className={"text-red-500"}/>
    //        </div>
    //    </div>
}

function PhoneBar(props: {
    className: string,
    routes: { text: string, link: string, icon: any }[],
    close?: () => void
}) {
    return (
        <div className={"flex flex-col gap-1 p-5 " + props.className}>
            <div className={"mb-2"}>
                <GlobalSyncStatus/>
            </div>
            {props.routes.map((route, key) => <NavElement key={key} text={route.text} link={route.link}
                                                          icon={route.icon} close={props.close}/>)}
        </div>
    );
}


export default function TopBar(props: {
    setDarkMode: (mode: boolean) => void,
    isDarkMode: boolean
}): React.ReactElement {

    const [phoneBarOpen, setPhoneBarOpen] = useState<boolean>(false);

    const routes = [
        {text: "Moulinettes", link: "/moulinettes", icon: faGraduationCap},
        {text: "Modules", link: "/modules", icon: faShareNodes},
        {text: "Calendar", link: "/calendar", icon: faCalendarCheck},
        {text: "Synchronisation", link: "/sync", icon: faCheckCircle},
        {text: "Profile", link: "/profile", icon: faUser},
        {text: "Settings", link: "/settings", icon: faGears}

    ]

    // If we are on the /auth page, we don't want to display navigation items

    const show_nav = !window.location.pathname.startsWith("/auth");

    return (
        <div>
            <div
                className={"flex flex-row justify-between min-h-20 items-center py-2 overflow-x-auto scroll-container px-3"}>
                <div className={"flex flex-row items-center"}>

                    <div
                        className={"lg:hidden flex flex-row items-center mr-1 hover:bg-gray-200 p-2 rounded-full cursor-pointer"}
                        onClick={() => setPhoneBarOpen(!phoneBarOpen)}>
                        <FontAwesomeIcon icon={phoneBarOpen ? faXmark : faBars} className={"text-lg"}/>
                    </div>


                    <div className={"flex flex-row items-center"}>
                        <img
                            className={"w-9 ml-1 shadow rounded-full"}
                            src={require("../assets/tblogo.png")}
                            alt={"TekBetter Logo"}
                        />
                        <p className={"ml-1 mr-2 font-bold"}>TekBetter</p>
                    </div>

                </div>

                <div className={"hidden lg:flex flex-row gap-0.5 rounded-2xl justify-start ml-2 shadow-lg"}>
                    {routes
                        .filter(route => show_nav)
                        .map((route) => <NavElement text={route.text} link={route.link} icon={route.icon}/>)}
                </div>

                <UserComp setDarkMode={props.setDarkMode} isDarkMode={props.isDarkMode}/>
            </div>

            <PhoneBar className={phoneBarOpen ? "" : "hidden"} routes={routes} close={() => setPhoneBarOpen(false)}/>
        </div>

    );
}
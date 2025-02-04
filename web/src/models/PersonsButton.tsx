import {faCheckCircle, faChevronDown, faUserCheck, faUserXmark} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {getStudentData} from "../api/global.api";
import StudentData from "./StudentData";
import LoadingComp from "../comps/LoadingComp";
import {vars} from "../api/api";

function PersonsModal(props: { students_ids: string[], mouseX: number, mouseY: number }) {
    const [students, setStudents] = React.useState<StudentData[] | null>(null);

    useEffect(() => {
        let students = props.students_ids.map(id => getStudentData(id));
        Promise.all(students).then((data) => {
            setStudents(data);
        });
    }, []);

    return (
        <div className={"absolute bg-white p-4 rounded-lg w-96"} style={{left: props.mouseX - 390, top: props.mouseY - 110}}>
            <div className={"flex flex-row items-center gap-2 text-lg"}>
                <FontAwesomeIcon icon={faCheckCircle} className={"text-green-500"}/>
                <h1 className={"text-xl font-bold"}>Validated students</h1>
            </div>

            {
                students === null ? <LoadingComp/> :

                    <div className={"grid grid-cols-2 gap-2 z-50"}>
                        {students.map((stud, index) => {

                            return <div key={index}
                                        className={"flex flex-row items-center bg-gray-100 pr-3 p-1  rounded text-gray-600"}>
                                <img
                                    src={`${vars.backend_url}/api/global/picture/${stud.login}`}
                                    alt={stud.name}
                                    className={"rounded-full mr-2 object-cover w-10 h-10"}
                                />
                                <p className={"text-sm break-words whitespace-normal"}>{stud.name}</p>
                            </div>
                        })}
                    </div>}
        </div>
    )
}

export default function PersonsButton(props: { students_ids: string[] }) {

    const [isOpen, setIsOpen] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({x: 0, y: 0});

    return <div title={"Show validated students"}
                className={"flex flex-row w-10 items-center rounded text-gray-600 px-1 h-6 text-xs py-1 gap-1 hover:bg-gray-300 cursor-pointer " + (props.students_ids.length === 0 ? "bg-gray-100 opacity-40" : " bg-green-200")}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onMouseMove={(e) => setMousePosition({x: e.clientX, y: e.clientY})}
    >
        <FontAwesomeIcon icon={ props.students_ids.length > 0 ? faUserCheck : faUserXmark} className={"text-xs"}/>
        <p className={"m-0 mt-0.5"}>{props.students_ids.length}</p>

        {isOpen && props.students_ids.length > 0 &&
            <PersonsModal students_ids={props.students_ids} mouseX={mousePosition.x}
                          mouseY={mousePosition.y}/>}

    </div>

}
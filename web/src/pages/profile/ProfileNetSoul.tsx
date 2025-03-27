import {useState} from "react";
import ReactApexChart from "react-apexcharts";
import Button from "../../comps/Button";
import {faCalendar} from "@fortawesome/free-solid-svg-icons";

class NetSoulDayStat {
    date: Date;
    minutes: number;
    average: number;

    constructor(date: Date, minutes: number, average: number) {
        this.date = date;
        this.minutes = minutes;
        this.average = average;
    }

}

export default function ProfileNetSoul() {
    const [stats, setStats] = useState<NetSoulDayStat[]>([
        new NetSoulDayStat(new Date("2025-03-11"), 10, 15),
        new NetSoulDayStat(new Date("2025-03-12"), 10, 15),
        new NetSoulDayStat(new Date("2025-03-13"), 10, 15),
        new NetSoulDayStat(new Date("2025-03-14"), 10, 15),
        new NetSoulDayStat(new Date("2025-03-15"), 10, 15),
        new NetSoulDayStat(new Date("2025-03-16"), 20, 25),
        new NetSoulDayStat(new Date("2025-03-17"), 47, 199),
        new NetSoulDayStat(new Date("2025-03-18"), 200, 152),
        new NetSoulDayStat(new Date("2025-03-19"), 100, 100),
    ]);

    const [filterStart, setFilterStart] = useState<Date>(new Date("2020-03-15"));
    const [filterEnd, setFilterEnd] = useState<Date>(new Date());

    const filter_metrics = () => {
        return stats.filter((stat) => stat.date >= filterStart && stat.date <= filterEnd);
    }

    const to_hours = (minutes: number) => {
        // round to 2 decimals
        return parseFloat((minutes / 60).toFixed(2));
    }

    console.log(filter_metrics());

    return <div>

        <div className={"flex flex-row gap-1"}>
            <Button icon={faCalendar} text={"1w"} onClick={() => {
                // set now - 7 days
                setFilterStart(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7));
                setFilterEnd(new Date());
            }}/>

            <Button icon={faCalendar} text={"1m"} onClick={() => {
                // set now - 30 days
                setFilterStart(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30));
                setFilterEnd(new Date());
            }}/>

            <Button icon={faCalendar} text={"6m"} onClick={() => {
                // set now - 180 days
                setFilterStart(new Date(Date.now() - 1000 * 60 * 60 * 24 * 180));
                setFilterEnd(new Date());
            }}/>

            <Button icon={faCalendar} text={"1y"} onClick={() => {
                // set now - 365 days
                setFilterStart(new Date(Date.now() - 1000 * 60 * 60 * 24 * 365));
                setFilterEnd(new Date());
            }}/>

            <Button icon={faCalendar} text={"All"} onClick={() => {
                // set now - 365 days
                setFilterStart(new Date("2019-03-15"));
                setFilterEnd(new Date());
            }}/>


        </div>

        <div>

            <ReactApexChart
                options={{
                    chart: {
                        id: "basic-bar",
                        toolbar: {
                            show: false,
                        },
                        zoom: {
                            enabled: false,
                        },
                        selection: {
                            enabled: false,
                        }
                    },


                    xaxis: {
                        type: "datetime",

                    },
                    stroke: {
                        show: true,
                        width: 2,
                    }
                }}
                series={[
                    {
                        name: "Campus time spent",
                        data: filter_metrics().map((stat) => [stat.date.getTime(), to_hours(stat.minutes)]),
                        color: "#64db1e",
                    },
                    {
                        name: "Class average",
                        data: filter_metrics().map((stat) => [stat.date.getTime(), to_hours(stat.average)]),
                        color: "#0077ff",
                    },
                ]}
                type="area"
                width="500"
                height="300"
            />
        </div>

    </div>


}
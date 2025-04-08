import {useEffect, useState} from "react";
import ReactApexChart from "react-apexcharts";
import Button from "../../comps/Button";
import {faCalendar} from "@fortawesome/free-solid-svg-icons";
import {getNetsoul} from "../../api/global.api";

class NetSoulDayStat {
    date: Date;
    hours: number;
    average: number;

    constructor(date: Date, hours: number, average: number) {
        this.date = date;
        this.hours = hours;
        this.average = average;
    }

}

export default function ProfileNetSoul() {
    const [stats, setStats] = useState<NetSoulDayStat[]>([
        // new NetSoulDayStat(new Date("2025-03-11"), 10, 15),
        // new NetSoulDayStat(new Date("2025-03-12"), 10, 15),
        // new NetSoulDayStat(new Date("2025-03-13"), 10, 15),
        // new NetSoulDayStat(new Date("2025-03-14"), 10, 15),
        // new NetSoulDayStat(new Date("2025-03-15"), 10, 15),
        // new NetSoulDayStat(new Date("2025-03-16"), 20, 25),
        // new NetSoulDayStat(new Date("2025-03-17"), 47, 199),
        // new NetSoulDayStat(new Date("2025-03-18"), 200, 152),
        // new NetSoulDayStat(new Date("2025-03-19"), 100, 100),
    ]);


    const [filterStart, setFilterStart] = useState<Date>(new Date("2020-03-15"));
    const [filterEnd, setFilterEnd] = useState<Date>(new Date());

    const filter_metrics = () => {
        return stats.filter((stat) => stat.date >= filterStart);
    }

    useEffect(() => {
        getNetsoul().then((data) => {
            let stats: NetSoulDayStat[] = [];
            data.data.forEach((stat: { timestamp: number, student_hours: number, average_hours: number }) => {
                const date = new Date(stat.timestamp * 1000);
                date.setHours(0, 0, 0, 0);
                stats.push(new NetSoulDayStat(date, stat.student_hours, stat.average_hours));
            });
            setStats(stats);
        })
    }, []);

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
                        foreColor: '#ffffff',
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
                    tooltip: {
                        theme: 'dark'
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    xaxis: {
                        type: "datetime",
                        labels: {
                            datetimeUTC: true,
                            formatter(value: string, timestamp?: number, opts?: any): string | string[] {
                                const date = new Date(parseInt(value));
                                return date.toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                });
                            }
                        },
                    },
                    stroke: {
                        show: true,
                        width: 2,
                    }
                }}
                series={[
                    {
                        name: "Time active",
                        // round to 2 decimals
                        data: filter_metrics().map((stat) => [stat.date.getTime(), parseFloat(stat.hours.toFixed(2))]),
                        color: "#1e89db",
                    },
                    {
                        name: "Promo average",
                        data: filter_metrics().map((stat) => [stat.date.getTime(), parseFloat(stat.average.toFixed(2))]),
                        color: "rgba(255,95,0,0.8)",
                    },
                ]}
                type="area"
                height="300"
            />
        </div>

    </div>


}
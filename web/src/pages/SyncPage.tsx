import React, {useEffect} from "react";
import TopBar from "../comps/TopBar";
import WindowElem, {BasicBox} from "../comps/WindowElem";
import {getCalendarToken, regenCalendarToken} from "../api/calendar.api";
import {deleteMicrosoftToken, putMicrosoftToken} from "../api/sync.api";

function CopyUrl(props: { cal_name: string, token: string }) {

    const url = `${document.location.origin}/ical/${props.token}/${props.cal_name}.ics`;

    const copy = () => {
        navigator.clipboard.writeText(url).then(() => {
            alert("Copied to clipboard !");
        }, () => {
            alert("Failed to copy to clipboard !");
        });
    }


    return <div className={"flex flex-row items-center gap-2 w-full"}>
        <button onClick={copy} className={"ml-2 h-8 bg-blue-500 text-white px-2 rounded"}>Copy</button>

        <div
            className={"bg-gray-100 border-gray-300 border text-gray-500 shadow flex flex-row items-center rounded px-2 py-1 flex-grow"}
        >
            <p>{url}</p>
        </div>
    </div>
}

export default function SyncPage(): React.ReactElement {

    const [token, setToken] = React.useState<string | null>(null);
    const [microToken, setMicroToken] = React.useState<string | null>(null);

    useEffect(() => {
        getCalendarToken().then((token: string) => {
            setToken(token);
        });
    }, []);

    if (token === null)
        return <div>Loading...</div>

    return (
        <div className={"flex flex-row gap-4"}>
            <WindowElem title={<h1 className={"text-2xl"}>Use an internal scraper</h1>}>
                <div className={"p-3"}>
                    <h2 className={"font-bold"}>How it's works ?</h2>
                    <p className={"text-gray-500"}>You provide a Microsoft session cookie below. It will stored on a
                        private and secured database with encryptation methods. There are multiple scrapers services,
                        and your Intra & MyEpitech data will be scraper by one of they. Recommanded if you can't host
                        your own scraper.</p>

                    <p>
                        <span className={"font-bold text-red-500"}>Warning:</span> This service is not affiliated with
                        Epitech, and
                        the
                        data is stored on a private server. Use it at your own risk.
                    </p>
                    <p>
                        <span className={"font-bold text-blue-500"}>How can i get my Microsoft cookie ?</span>
                        You can follow
                        <a
                            href={"https://github.com/EliotAmn/tekbetter-server/blob/main/MicrosoftSessionTutorial.md"}
                            className={"text-blue-500 mx-1"}
                            target={"_blank"}
                        >
                            this guide</a> to get
                        your Microsoft session cookie.
                    </p>


                    <BasicBox className={"p-4 flex flex-row items-center gap-2"}>
                        <div>
                            <h3 className={"font-bold text-gray-700"}>Update your microsoft cookie</h3>
                            <p>If you have changed your Microsoft password, or the token is expired, you need to re
                                enter it
                                below.</p>
                            <input value={microToken || ""} type={"text"}
                                   className={"w-full p-2 border-gray-300 border rounded"}
                                   placeholder={"Paste your Microsoft session cookie here"}
                                   onChange={(e) => setMicroToken(e.target.value)}
                            />
                            <button
                                className={"mt-2 h-8 bg-blue-500 text-white px-2 rounded"}
                                onClick={() => {
                                    putMicrosoftToken(token).then(() => setMicroToken(null));
                                }}
                            >
                                Update
                            </button>
                        </div>
                        <div>
                            <h3 className={"font-bold text-gray-700"}>Disable the internal scraper mode</h3>
                            <p>If you want to stop the scraper, you can disable it here. Your token will be deleted from
                                the
                                database.</p>
                            <button className={"mt-2 h-8 bg-red-500 text-white px-2 rounded"}
                                    onClick={() => {
                                        if (window.confirm("Are you sure ? Your token will be deleted.")) deleteMicrosoftToken().then(null);
                                    }}
                            >
                                Delete my token
                            </button>
                        </div>

                    </BasicBox>


                </div>

            </WindowElem>


            <WindowElem title={<h1 className={"text-2xl"}>Host your own scraper</h1>}>
                <div className={"p-3 flex flex-col"}>
                    <h2 className={"font-bold"}>How it works ?</h2>
                    <p className={"text-gray-500 text-justify"}>
                        The tekbetter data scraper is open-source. You can install on your own
                        server, and use it to get your data.
                        For authentication, you need to provide a token on the scraper configuration, to authorize it to
                        push your data to your account.
                    </p>


                    <h3 className={"font-bold text-gray-700"}>Install the scraper: </h3>
                    <a href={"https://github.com/EliotAmn/tekbetter-scraper"} target={"_blank"}
                       className={"text-blue-500"}>Github repository</a>

                    <h3 className={"font-bold text-gray-700"}>Your upload token: </h3>
                    <code className={"bg-gray-100 p-2 rounded"}>{token}</code>

                    <h3 className={"font-bold text-gray-700"}>This is the api url you need to use on the scraper config: </h3>
                    <code className={"bg-gray-100 p-2 rounded"}>{document.location.origin}</code>

                    <button
                        className={"mt-2 h-8 bg-red-500 text-white px-2 rounded"}
                        onClick={() => {
                            if (window.confirm("Are you sure ? Your token will be regenerated. This token is used for scrapers and the calendar export urls.")) {
                                regenCalendarToken().then((token) => {
                                    setToken(token);
                                });
                            }
                        }}
                    >Reload my token
                    </button>


                </div>

            </WindowElem>
        </div>

    );
}
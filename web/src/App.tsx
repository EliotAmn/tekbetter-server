import './App.css';
import {Route, Routes} from "react-router-dom";
import React, {useEffect} from "react";
import HomePage from "./pages/HomePage";
import MouliPage from "./pages/mouli/MouliPages";
import TopBar from "./comps/TopBar";
import "./assets/styles/base.css"
import CalendarPage from "./pages/CalendarPage";
import SyncPage from "./pages/SyncPage";
import AuthPage from "./pages/AuthPage";
import FullError from "./comps/FullError";
import {vars} from "./api/api";
import Footer from "./comps/Footer";

function App() {

    const [error, setError] = React.useState<{
        title?: string,
        message?: string
    } | null>(null);

    useEffect(() => {
        vars.setErrorPopup = (title: string | null, message: string | null) => {
            setError({
                title: title || "An error occured",
                message: message || "An error occured, please try again later."
            });
        }
    }, []);

    return (
        <div className={"h-screen flex flex-col"}>
            <TopBar/>
            {error && <FullError title={error.title} message={error.message}/>}
            <div className={"overflow-y-auto h-screen"}>
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/auth" element={<AuthPage/>}/>
                    <Route path="/calendar" element={<CalendarPage/>}/>
                    <Route path="/sync" element={<SyncPage/>}/>
                    <Route path="/moulinettes" element={<MouliPage/>}/>
                    <Route path="/moulinettes/:project_slug"
                           element={<MouliPage/>}/>
                </Routes>
            </div>
            <div>
                <Footer/>
            </div>

        </div>
    );
}

export default App;

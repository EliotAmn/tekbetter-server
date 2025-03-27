import './App.css';
import {Route, Routes} from "react-router-dom";
import React, {useEffect} from "react";
import HomePage from "./pages/HomePage";
import MouliPage from "./pages/mouli/MouliPages";
import TopBar from "./comps/TopBar";
import "./assets/styles/base.css"
import CalendarPage from "./pages/CalendarPage";
import SyncPage from "./pages/sync/SyncPage";
import AuthPage from "./pages/AuthPage";
import FullError from "./comps/FullError";
import {vars} from "./api/api";
import Footer from "./comps/Footer";
import ModulePage from "./pages/module/ModulePage";
import SettingsPage from "./pages/SettingsPage";
import {getSyncStatus} from "./api/global.api";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {

    const [error, setError] = React.useState<{
        title?: string,
        message?: string
    } | null>(null);

    const [darkMode, setDarkMode] = React.useState<boolean>(localStorage.getItem("darkMode") === "true");

    localStorage.setItem("darkMode", darkMode.toString());

    useEffect(() => {
        vars.setErrorPopup = (title: string | null, message: string | null) => {
            setError({
                title: title || "An error occured",
                message: message || "An error occured, please try again later."
            });
        }
        const interval = setInterval(async () => {
            getSyncStatus().catch(() => {
            });
        }, 30000);
        getSyncStatus().catch(() => {
        });
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={darkMode ? "dark" : ""}>
            <div className={"h-screen flex flex-col dark:bg-gray-800 dark:text-gray-300 text-gray-600 transition"}>
                <TopBar setDarkMode={setDarkMode} isDarkMode={darkMode}/>
                {error && <FullError title={error.title} message={error.message}/>}
                <div className={"overflow-y-auto h-screen"}>
                    <Routes>
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/auth" element={<AuthPage/>}/>
                        <Route path="/calendar" element={<CalendarPage/>}/>
                        <Route path="/sync" element={<SyncPage/>}/>
                        <Route path="/moulinettes" element={<MouliPage/>}/>
                        <Route path="/modules" element={<ModulePage/>}/>
                        <Route path="/profile" element={<ProfilePage/>}/>

                        <Route path="/moulinettes/:project_slug"
                               element={<MouliPage/>}/>
                        <Route path="/settings" element={<SettingsPage/>}/>
                    </Routes>
                </div>

                <div>
                    <Footer/>
                </div>
            </div>

        </div>
    );
}

export default App;

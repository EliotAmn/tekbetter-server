import ProfileNetSoul from "./ProfileNetSoul";

export default function ProfilePage() {
    return (
        <div className={"flex flex-col gap-4 p-3"}>
            <h1 className={"text-center font-bold text-xl"}>Campus Wifi presence</h1>
            <ProfileNetSoul/>
        </div>
    );
}
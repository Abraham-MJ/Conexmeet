import { ContactsProvider } from "@/app/context/useContactsContext";
import StoriesComponent from "./stories";

export default function Page() {
    return (
        <ContactsProvider>
            <StoriesComponent />
        </ContactsProvider>
    )
}
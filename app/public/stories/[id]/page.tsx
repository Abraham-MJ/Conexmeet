import { ContactsProvider } from "@/app/context/useContactsContext";
import StoriesComponent from "../stories";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    
    return (
        <ContactsProvider>
            <StoriesComponent storyId={id} />
        </ContactsProvider>
    );
}
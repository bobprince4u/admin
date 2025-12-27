import { Contact } from "../types";
import ContactTable from "./ContactTable";

interface ContactsViewProps {
  contacts: Contact[];
  onViewContact: (contact: Contact) => void;
  onUpdateStatus: (id: string, status: Contact["status"]) => void;
  loading?: boolean;
}

export default function ContactsView({
  contacts,
  onViewContact,
  onUpdateStatus,
  loading = false,
}: ContactsViewProps) {
  console.log("=== ContactsView Debug ===");
  console.log("Total contacts:", contacts.length);
  console.log("First contact (raw):", contacts[0]);

  if (contacts[0]) {
    console.log("Company field:", contacts[0].company);
    console.log("Service field:", contacts[0].service);
    console.log("All keys:", Object.keys(contacts[0]));
  }
  return (
    <div>
      <ContactTable
        contacts={contacts}
        onViewContact={onViewContact}
        onUpdateStatus={onUpdateStatus}
        loading={loading}
      />
    </div>
  );
}

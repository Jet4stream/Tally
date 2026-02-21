import Image from "next/image";
import trashIcon from "../assests/trash.svg";
import paperclipIcon from "../assests/paperclip.svg";

type Reimbursement = {
  date: string;
  payTo: string;
  owed: string;
  item: string;
  event: string;
  status: string;
  statusColor: string;
};

export default function DataTable({ data, showDelete = true }: { data: Reimbursement[]; showDelete?: boolean }) {
  return (
    <div>
      <div className="flex text-sm text-black bg-[#F5F5F5] px-3 py-2 mb-2 rounded font-[family-name:var(--font-public-sans)]">
        <span className="w-[12%]">Requested</span>
        <span className="w-[14%]">Pay to</span>
        <span className="w-[10%]">Owed</span>
        <span className="w-[22%]">Item</span>
        <span className="w-[18%]">Event</span>
        <span className="w-[18%]">Status</span>
        <span className="w-[6%]"></span>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((r, i) => (
          <div key={i} className="flex items-center border border-[#8D8B8B] rounded-lg px-3 py-4 text-sm font-[family-name:var(--font-pt-sans)]">
            <span className="w-[12%]">{r.date}</span>
            <span className="w-[14%]">{r.payTo}</span>
            <span className="w-[10%]">{r.owed}</span>
            <span className="w-[22%]">{r.item}</span>
            <span className="w-[18%]">{r.event}</span>
            <span className={`w-[18%] ${r.statusColor}`}>{r.status}</span>
            <span className="w-[6%] flex gap-4 justify-end">
              {showDelete && (
                <button onClick={() => console.log("delete", i)}>
                  <Image src={trashIcon} alt="Delete" width={18} height={18} className="cursor-pointer" />
                </button>
              )}
              <button onClick={() => console.log("attachment", i)}>
                <Image src={paperclipIcon} alt="Attachment" width={18} height={18} className="cursor-pointer" />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


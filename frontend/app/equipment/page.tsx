import TopBar from "@/components/TopBar";
import EquipmentCard from "@/components/EquipmentCard";

export default function EquipmentPage() {
  return (
    <>
      <TopBar title="Equipment Setup" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px] mt-4">
        <EquipmentCard 
          title="Primary Recurve" 
          type="Olympic Recurve"
          status="active"
          stats={[
            { label: "Draw Weight", value: "42 lbs @ 29\"" },
            { label: "Tiller", value: "+4mm top" },
            { label: "Brace Height", value: "22.5 cm" },
            { label: "Nocking Point", value: "+6mm" }
          ]}
        />
        <EquipmentCard 
          title="Backup Recurve" 
          type="Olympic Recurve"
          status="backup"
          stats={[
            { label: "Draw Weight", value: "40 lbs @ 29\"" },
            { label: "Tiller", value: "+3mm top" },
            { label: "Brace Height", value: "22.2 cm" },
            { label: "Nocking Point", value: "+5mm" }
          ]}
        />
        <EquipmentCard 
          title="Indoor Arrows" 
          type="Easton X23"
          status="active"
          stats={[
            { label: "Spine", value: "475" },
            { label: "Length", value: "29.5\"" },
            { label: "Point Weight", value: "150 gr" },
            { label: "Fletching", value: "4\" Feathers" }
          ]}
        />
      </div>
    </>
  );
}

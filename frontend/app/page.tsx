import MapComponent from "@/app/components/Map";
import DiscrepancyTable from "@/app/components/DiscrepancyTable";
import PlaybackSlider from "@/app/components/PlaybackSlider";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 Potion Guard Dashboard</h1>
        
        {/* TODO(Araohat): This is your main layout.
            Assemble all the components here. */}
        <MapComponent />
        <PlaybackSlider />
        {/* This component is a Server Component and uses await */}
        {/* @ts-expect-error Async Server Component */}
        <DiscrepancyTable />
      </div>
    </main>
  );
}

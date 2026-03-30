import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Popup } from "@/components/Popup"

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Popup />
      </main>
      <Footer />
    </div>
  )
}

export default App

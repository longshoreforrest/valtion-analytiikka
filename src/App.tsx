import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import Compare from "./pages/Compare";
import TablePage from "./pages/Table";
import Sources from "./pages/Sources";
import Methodology from "./pages/Methodology";
import About from "./pages/About";
import DataSummary from "./pages/DataSummary";
import PublicFinance from "./pages/PublicFinance";
import Documents from "./pages/Documents";
import Opas from "./pages/Opas";
import PoliittinenAnalyysi from "./pages/PoliittinenAnalyysi";
import { UpdatesList, UpdateDetail } from "./pages/Updates";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/paivitykset" element={<UpdatesList />} />
        <Route path="/paivitykset/:slug" element={<UpdateDetail />} />
        <Route path="/julkinen-talous" element={<PublicFinance />} />
        <Route path="/vertailu" element={<Compare />} />
        <Route path="/taulukko" element={<TablePage />} />
        <Route path="/tiivistelma" element={<DataSummary />} />
        <Route path="/dokumentit" element={<Documents />} />
        <Route path="/poliittinen-analyysi" element={<PoliittinenAnalyysi />} />
        <Route path="/lahteet" element={<Sources />} />
        <Route path="/opas" element={<Opas />} />
        {/* Vanhat reitit ohjautuvat oppaaseen */}
        <Route path="/ohje" element={<Opas />} />
        <Route path="/metodologia" element={<Opas />} />
        <Route path="/tietoja" element={<Opas />} />
        <Route path="/methodology-details" element={<Methodology />} />
        <Route path="/about-details" element={<About />} />
      </Route>
    </Routes>
  );
}

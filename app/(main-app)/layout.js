import Navbar from "../components/Layout/Navbar";

export default function NavbarLayout({ children }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}

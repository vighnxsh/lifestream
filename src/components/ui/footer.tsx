import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-red-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Lifestream</h3>
            <p className="text-red-200">
              Connecting donors and recipients to save lives through blood donation.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-red-200 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blood-inventory" className="text-red-200 hover:text-white transition-colors">
                  Blood Inventory
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-red-200 hover:text-white transition-colors">
                  Become a Donor
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-red-200 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <address className="not-italic text-red-200">
              <p>123 Blood Bank Street</p>
              <p>City, State 12345</p>
              <p>Phone: (123) 456-7890</p>
              <p>Email: info@bloodbank.org</p>
            </address>
          </div>
        </div>
        <div className="border-t border-red-700 mt-8 pt-6 text-center text-red-200">
          <p>&copy; {new Date().getFullYear()} BloodBank. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

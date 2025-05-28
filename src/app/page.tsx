import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col gap-8 py-12">
      {/* Hero Section */}
      <section className="bg-red-700 text-white py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Donate Blood, Save Lives</h1>
            <p className="text-xl mb-6">
              Your donation can make a difference. Join our community of donors and help save lives.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button size="lg">Become a Donor</Button>
              </Link>
              <Link href="/blood-inventory">
                <Button variant="outline" size="lg">View Blood Inventory</Button>
              </Link>
            </div>
          </div>
          <div className="relative w-full max-w-md h-64 md:h-80">
            <Image
              src="/blood-donation.jpg"
              alt="Blood Donation"
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        </div>
      </section>

      {/* Blood Types Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Blood Types We Need</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { type: "A+", description: "Can donate to: A+, AB+" },
              { type: "A-", description: "Can donate to: A+, A-, AB+, AB-" },
              { type: "B+", description: "Can donate to: B+, AB+" },
              { type: "B-", description: "Can donate to: B+, B-, AB+, AB-" },
              { type: "AB+", description: "Can donate to: AB+" },
              { type: "AB-", description: "Can donate to: AB+, AB-" },
              { type: "O+", description: "Can donate to: A+, B+, AB+, O+" },
              { type: "O-", description: "Universal donor" },
            ].map((blood) => (
              <div key={blood.type} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl font-bold text-red-600 mb-2">{blood.type}</div>
                <p className="text-gray-600">{blood.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Register</h3>
              <p className="text-gray-600">Create an account as a donor or recipient to get started.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Schedule</h3>
              <p className="text-gray-600">Book an appointment for blood donation at your convenience.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Donate</h3>
              <p className="text-gray-600">Visit our center on your scheduled date and donate blood.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of donors today and help save lives. Every donation counts!
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">Register Now</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

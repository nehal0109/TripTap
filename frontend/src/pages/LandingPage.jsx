import { Link } from "react-router-dom"

const LandingPage = () => {
  return (
    <div className="bg-cover bg-[url('/assets/main-cover.avif')] h-screen pt-8 flex justify-between flex-col w-full">
        <img className="w-16 ml-8" src="/assets/logo-uber.png" alt="" />
      <div className="bg-white pb-7 py-4 px-4">
        <h2 className="text-2xl font-bold">Get Started with TripTap</h2>
        <Link to='/login' className="flex items-center justify-center w-full bg-black text-white py-3 rounded mt-5">Continue</Link>
      </div>
    </div>
  )
}

export default LandingPage

import React from 'react'
import { useLocation } from 'react-router-dom'

const Footer = () => {

    const { pathname } = useLocation()

    if (pathname.includes("chat")) {
        return (
            <></>
        )
    }

    return (
        <footer className="border-t border-gray-200 bg-gray-900 text-white mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-teal-600 rounded-md"></div>
                            <span className="font-bold">IndoreMart</span>
                        </div>
                        <p className="text-sm text-gray-400">
                            Your trusted multi-shop grocery delivery platform. Fresh products in minutes.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-sm mb-4">Company</p>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="#" className="hover:text-white">
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white">
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white">
                                    Blog
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-sm mb-4">Support</p>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="#" className="hover:text-white">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white">
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-semibold text-sm mb-4">Partner With Us</p>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="#" className="hover:text-white">
                                    Become a Store
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white">
                                    Delivery Partner
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
                    <p>© 2026 IndoreMart. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer

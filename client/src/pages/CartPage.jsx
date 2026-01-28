import { Trash2, Plus, Minus, ShoppingCart, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createOrder, deleteItemFromCart, getCart, updateCart } from "../features/cart/cartSlice"
import LoadingScreen from "../components/LoadingScreen"
import { toast } from "react-toastify"
import axios from "axios"
import { useNavigate } from "react-router-dom"


export default function CartPage() {


    const { cartItems, cartLoading, cartError, cartErrorMessage } = useSelector(state => state.cart)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    let shopId = cartItems ? cartItems?.products[0]?.product?.shop : null



    const [coupon, setCoupon] = useState("")
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [couponCode, setCouponCode] = useState("")
    const [couponApplied, setCouponApplied] = useState(false)
    const [couponError, setCouponError] = useState("")

    const subtotal = cartItems?.products?.reduce((acc, product) => product.product.price * product.qty + acc, 0)
    const discount = couponApplied ? coupon.couponDiscount * subtotal / 100 : 0
    const total = subtotal - discount


    // Remove Item
    const handleRemoveItemFromCart = (pid) => {
        dispatch(deleteItemFromCart(pid))
    }

    // Update Cart
    const handleUpdateCart = (cartDetails) => {
        dispatch(updateCart(cartDetails))
    }


    // Apply Coupon
    const handleApplyCoupon = async () => {

        if (!shopId) {
            toast.error("Please Add Items In Your Cart")
        } else {
            try {
                const response = await axios.post("/api/coupons/apply", { couponCode: couponCode, shopId: shopId })
                setCoupon(response.data)
                setCouponApplied(true)
            } catch (error) {
                setCouponError(error.response.data.message)
            }
        }

    }

    // Remove Coupon
    const handleRemoveCoupon = () => {
        setCouponApplied(false)
    }

    // Place Order
    const handlePlaceOrder = (coupon) => {
        dispatch(createOrder(coupon))
        // navigate("/auth/profile")
    }



    useEffect(() => {

        if (!cartError) {
            dispatch(getCart())
        }

        if (cartError && cartErrorMessage) {
            toast.error(cartErrorMessage)
        }


    }, [cartError, cartErrorMessage])


    if (cartLoading) {
        return (
            <LoadingScreen />
        )
    }


    if (!cartItems || cartItems.products.length === 0) {
        return (
            <div className="mb-8 min-h-[60vh] p-8">
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart size={32} className="text-teal-600" />
                    Shopping Cart
                </h1>
                <p className="text-gray-600 mt-2">{0} items in your cart</p>
            </div>
        )
    }


    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart size={32} className="text-teal-600" />
                        Shopping Cart
                    </h1>
                    <p className="text-gray-600 mt-2">{cartItems?.length || 0} items in your cart</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items Section */}
                    <div className="lg:col-span-2">
                        {/* Cart Items Table */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantity</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {cartItems?.products?.map((item) => (
                                            <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={item.product.productImage || "/placeholder.svg"}
                                                            alt={item.product.name}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{item.product.name}</p>
                                                            <p className="text-xs text-gray-500 mt-1">{item.product.shop}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">₹{item.product.price}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 border border-gray-300 rounded-lg w-fit px-2 py-1">
                                                        <button onClick={() => handleUpdateCart({ cid: cartItems._id, productId: item.product._id, qty: item.qty - 1 })} className="text-gray-600 hover:text-teal-600 transition-colors">
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="text-sm font-semibold text-gray-900 w-6 text-center">{item.qty}</span>
                                                        <button onClick={() => handleUpdateCart({ cid: cartItems._id, productId: item.product._id, qty: item.qty + 1 })} className="text-gray-600 hover:text-teal-600 transition-colors">
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">₹{item.product.price * item.qty}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleRemoveItemFromCart(item.product._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Continue Shopping Button */}
                        <div className="mt-6">
                            <button className="px-6 py-3 border border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors duration-200">
                                ← Continue Shopping
                            </button>
                        </div>
                    </div>

                    {/* Right Sidebar - Coupon & Checkout */}
                    <div className="space-y-6">
                        {/* Coupon Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="font-semibold text-gray-900 text-lg mb-4">Apply Coupon</h3>

                            {!couponApplied ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                    >
                                        Apply Coupon
                                    </button>
                                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                    <p className="text-xs text-gray-500 mt-3">Try code: SAVE10</p>
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-green-900">Coupon Applied!</p>
                                        <p className="text-sm text-green-700 mt-1">Code: {couponCode.toUpperCase()}</p>
                                        <p className="text-xs text-green-600 mt-1">You saved ₹{discount}</p>
                                    </div>
                                    <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-700 flex-shrink-0">
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                            <h3 className="font-semibold text-gray-900 text-lg">Order Summary</h3>

                            <div className="border-b border-gray-200 pb-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">₹{subtotal}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-red-600">Discount (if any)</span>
                                    <span className="font-semibold text-red-600"> - ₹{discount}</span>
                                </div>
                                {couponApplied && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="font-semibold text-green-600">-₹{discount}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-teal-600">₹{total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Proceed to Pay Button */}
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <ShoppingCart size={20} />
                            Proceed to Pay
                        </button>
                    </div>
                </div>
            </main>

            {/* Payment Modal */}
            {isPaymentOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Card Details</h2>
                            <button onClick={() => setIsPaymentOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Payment Form */}
                        <div className="space-y-6">
                            {/* Card Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Card Number</label>
                                <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                />
                            </div>

                            {/* Cardholder Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Cardholder Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                />
                            </div>

                            {/* Expiry & CVV */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">CVV</label>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Order Total */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-semibold">Order Total:</span>
                                    <span className="text-2xl font-bold text-teal-600">₹{total}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <button onClick={() => handlePlaceOrder(couponCode)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                                    Pay ₹{total}
                                </button>
                                <button
                                    onClick={() => setIsPaymentOpen(false)}
                                    className="w-full border border-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Security Info */}
                            <div className="text-center">
                                <p className="text-xs text-gray-500">🔒 Your payment is secure and encrypted</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

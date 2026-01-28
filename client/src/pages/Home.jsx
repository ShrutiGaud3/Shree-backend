import { ShoppingBag, MapPin, Clock, Store, Leaf, Zap, TrendingUp, Menu, Apple, Coffee, Candy, Leaf as LeafIcon, UtensilsCrossed, Cake } from 'lucide-react';
import Hero from "../assets/hero.jpg"
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { getMyShopDetails } from '../features/shop/shopSlice';
import { getProducts, getProductShops } from '../features/product/productSlice';
import LoadingScreen from '../components/LoadingScreen';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCart } from '../features/cart/cartSlice';

function Home() {

    const { user } = useSelector(state => state.auth)
    const { products, productShops, productLoading, productSuccess, productError, productErrorMessage } = useSelector(state => state.product)

    const dispatch = useDispatch()


    useEffect(() => {

        if (!productError) {
            dispatch(getProducts())
            dispatch(getProductShops())
        }

        if (user) {
            dispatch(getCart())
        }

        if (productError && productErrorMessage) {
            toast.error(productErrorMessage)
        }



    }, [productError, productErrorMessage])


    if (productLoading) {
        return <LoadingScreen />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="relative bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Groceries delivered in <span className="text-emerald-600">10 minutes</span>
                            </h1>
                            <p className="text-lg text-gray-600">
                                Shop from multiple stores in your neighborhood. Fresh produce, daily essentials, and more delivered instantly to your doorstep.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter your delivery location"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <button className="px-8 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Find Stores
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <span className="text-sm text-gray-600">10-min delivery</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Store className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <span className="text-sm text-gray-600">Multiple stores</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Leaf className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <span className="text-sm text-gray-600">Fresh products</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                            <img
                                src={Hero}
                                alt="Fresh groceries"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gray-900 overflow-hidden py-4">
                <div className="flex animate-scroll gap-8">
                    <div className="flex gap-8 flex-shrink-0">
                        <div className="flex items-center gap-3 px-6 py-2 bg-emerald-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <TrendingUp className="w-4 h-4" />
                            50% OFF on Fresh Vegetables
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-amber-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <Zap className="w-4 h-4" />
                            Free Delivery Above $25
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-rose-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <ShoppingBag className="w-4 h-4" />
                            Buy 2 Get 1 Free on Dairy
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-teal-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <TrendingUp className="w-4 h-4" />
                            Flat $10 OFF First Order
                        </div>
                    </div>
                    <div className="flex gap-8 flex-shrink-0">
                        <div className="flex items-center gap-3 px-6 py-2 bg-emerald-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <TrendingUp className="w-4 h-4" />
                            50% OFF on Fresh Vegetables
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-amber-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <Zap className="w-4 h-4" />
                            Free Delivery Above $25
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-rose-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <ShoppingBag className="w-4 h-4" />
                            Buy 2 Get 1 Free on Dairy
                        </div>
                        <div className="flex items-center gap-3 px-6 py-2 bg-teal-500 rounded-full whitespace-nowrap text-white font-semibold">
                            <TrendingUp className="w-4 h-4" />
                            Flat $10 OFF First Order
                        </div>
                    </div>
                </div>
                <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 20s linear infinite;
          }
        `}</style>
            </section>

            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Trending Categories</h2>
                        <a className="text-emerald-600 font-medium hover:text-emerald-700">View All</a>
                    </div>
                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-6">
                        <div className="flex-shrink-0 w-32 md:w-auto">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full mb-3 flex items-center justify-center">
                                    <Apple className="w-8 h-8 text-amber-600" />
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-800">Fruits & Vegetables</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-32 md:w-auto">
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full mb-3 flex items-center justify-center">
                                    <Coffee className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-800">Dairy & Breakfast</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-32 md:w-auto">
                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full mb-3 flex items-center justify-center">
                                    <Candy className="w-8 h-8 text-rose-600" />
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-800">Snacks & Beverages</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-32 md:w-auto">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full mb-3 flex items-center justify-center">
                                    <LeafIcon className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-800">Organic & Health</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-32 md:w-auto">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full mb-3 flex items-center justify-center">
                                    <UtensilsCrossed className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-800">Home & Kitchen</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-32 md:w-auto">
                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full mb-3 flex items-center justify-center">
                                    <Cake className="w-8 h-8 text-yellow-600" />
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-800">Bakery & Sweets</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Trending Products</h2>
                        <a className="text-emerald-600 font-medium hover:text-emerald-700">View All</a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {
                            products.map((product, index) => {
                                if (index >= 5) {
                                    return
                                } else {
                                    return (
                                        <div key={product._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                                            <div style={{ backgroundImage: `url(${product.productImage})` }} className="aspect-square bg-center bg-cover"></div>
                                            <div className="p-4">
                                                <div className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded mb-2">
                                                    {product.shop.name}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                                                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                                                    <Link to={`/products/${product._id}`} className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600">View Product</Link>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            })
                        }
                    </div>
                </div>
            </section>

            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Trending Shops</h2>
                        <a className="text-emerald-600 font-medium hover:text-emerald-700">View All</a>
                    </div>
                    <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide lg:grid lg:grid-cols-4">
                        {
                            productShops.map((shop, index) => {
                                if (index <= 4) {
                                    return (
                                        <Link to={`/marketplace/${shop._id}`} key={index} className="flex-shrink-0 w-72 lg:w-auto bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-shadow cursor-pointer">
                                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl mb-4 flex items-center justify-center text-white font-bold text-xl"><ShoppingBag /></div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{shop.name}</h3>
                                            <p className="text-sm text-gray-600 mb-4">{shop.description}</p>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <span className="text-amber-500">★</span>
                                                    4.5
                                                </span>
                                                <span>•</span>
                                                <span>10-15 min</span>
                                            </div>
                                        </Link>
                                    )
                                } else {
                                    return
                                }
                            })
                        }
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

import { configureStore } from "@reduxjs/toolkit";
import auth from "./auth/authSlice"
import admin from "./admin/adminSlice"
import shop from "./shop/shopSlice"
import product from "./product/productSlice"
import cart from "./cart/cartSlice"
import chat from "./chat/chatSlice"

const store = configureStore({
    reducer: { auth, admin, shop, product, cart, chat }
})


export default store
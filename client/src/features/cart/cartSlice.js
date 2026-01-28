import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import cartService from './cartService';

const initialState = {

    cartItems: null,
    cartLoading: false,
    cartSuccess: false,
    cartError: false,
    cartErrorMessage: ""

}

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(addItemToCart.pending, (state, action) => {
                state.cartLoading = true
                state.cartSuccess = false
                state.cartError = false
            })
            .addCase(addItemToCart.fulfilled, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = true
                state.cartItems = action.payload
                state.cartError = false
            })
            .addCase(addItemToCart.rejected, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = false
                state.cartError = true
                state.cartErrorMessage = action.payload
            })
            .addCase(getCart.pending, (state, action) => {
                state.cartLoading = true
                state.cartSuccess = false
                state.cartError = false
            })
            .addCase(getCart.fulfilled, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = true
                state.cartItems = action.payload
                state.cartError = false
            })
            .addCase(getCart.rejected, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = false
                state.cartError = true
                state.cartErrorMessage = action.payload
            })
            .addCase(deleteItemFromCart.pending, (state, action) => {
                state.cartLoading = true
                state.cartSuccess = false
                state.cartError = false
            })
            .addCase(deleteItemFromCart.fulfilled, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = true
                state.cartItems = action.payload
                state.cartError = false
            })
            .addCase(deleteItemFromCart.rejected, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = false
                state.cartError = true
                state.cartErrorMessage = action.payload
            })
            .addCase(updateCart.pending, (state, action) => {
                state.cartLoading = true
                state.cartSuccess = false
                state.cartError = false
            })
            .addCase(updateCart.fulfilled, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = true
                state.cartItems = action.payload
                state.cartError = false
            })
            .addCase(updateCart.rejected, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = false
                state.cartError = true
                state.cartErrorMessage = action.payload
            })
            .addCase(createOrder.pending, (state, action) => {
                state.cartLoading = true
                state.cartSuccess = false
                state.cartError = false
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = true
                state.cartItems = []
                state.cartError = false
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.cartLoading = false
                state.cartSuccess = false
                state.cartError = true
                state.cartErrorMessage = action.payload
            })
    }
});

export const { } = cartSlice.actions

export default cartSlice.reducer



// ADD_TO_CART
export const addItemToCart = createAsyncThunk("CART/ADD", async (cartItem, thunkAPI) => {
    let token = thunkAPI.getState().auth.user.token

    try {
        return await cartService.addToCart(cartItem, token)
    } catch (error) {
        const message = error.response.data.message
        return thunkAPI.rejectWithValue(message)
    }

})

// GET_CART
export const getCart = createAsyncThunk("CART/FETCH", async (_, thunkAPI) => {
    let token = thunkAPI.getState().auth.user.token

    try {
        return await cartService.fetchCart(token)
    } catch (error) {
        const message = error.response.data.message
        return thunkAPI.rejectWithValue(message)
    }

})


// DELETE_Item_CART
export const deleteItemFromCart = createAsyncThunk("CART/REMOVE_ITEM", async (pid, thunkAPI) => {
    let token = thunkAPI.getState().auth.user.token

    try {
        return await cartService.removeItemFromCart(pid, token)
    } catch (error) {
        const message = error.response.data.message
        return thunkAPI.rejectWithValue(message)
    }

})

// UDPATE_CART
export const updateCart = createAsyncThunk("CART/CART_ITEM", async (cartDetails, thunkAPI) => {
    let token = thunkAPI.getState().auth.user.token

    try {
        return await cartService.updateItemFromCart(cartDetails, token)
    } catch (error) {
        const message = error.response.data.message
        return thunkAPI.rejectWithValue(message)
    }

})


// CREATE_ORDER
export const createOrder = createAsyncThunk("ORDER/ADD", async (couponCode, thunkAPI) => {
    let token = thunkAPI.getState().auth.user.token

    try {
        return await cartService.placeOrder({ couponCode: couponCode }, token)
    } catch (error) {
        const message = error.response.data.message
        return thunkAPI.rejectWithValue(message)
    }

})
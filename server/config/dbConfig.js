import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        let conn = await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`DB CONNECTION SUCCESS : ${conn.connection.name}`.bgGreen.black);
    } catch (error) {
        console.log(`DB CONNETION FAILED : ${error.message}`.bgRed.white);
    }
};


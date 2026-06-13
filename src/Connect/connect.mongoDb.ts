import mongoose from "mongoose";

const connectMongo = async (uri: string) => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectMongo;

import mongoose from 'mongoose';

async function connectMongoDB(mongodb_url: string) {
  // mongodb connection
  return mongoose
    .connect(mongodb_url)
    .then(() => {
      console.log('MongoDB Connected...');
    })
    .catch(err => {
      console.log('Mongo Connection Error: ', err);
    });
}

export default connectMongoDB;

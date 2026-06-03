//This is the entry file of our application. It will be responsible for starting the server and loading the environment variables.
import dotenv from "dotenv"
import app from "./app.js";
dotenv.config({
  path: "./.env"
});
import connectDB from "./db/index.js";


const port = process.env.PORT || 3000; //Always store this port in the env

//only listen to the server if the database connection is successful. This ensures that our application doesn't start without a working database connection, which could lead to errors when handling requests that require database access.
connectDB()
  .then(() => {
    app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
  console.error("Failed to connect to the database:", error.message);
  process.exit(1); // Exit the process with failure
} );



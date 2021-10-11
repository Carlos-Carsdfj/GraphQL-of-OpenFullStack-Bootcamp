const mongoose = require("mongoose");
const { MONGO_DB_URI } = process.env;

let connectionString = MONGO_DB_URI;
if (!connectionString) {
  console.error(
    "Recuerda que tienes que tener un archivo .env con las variables de entorno definidas y el MONGO_DB_URI apuntando a una base de datos de mongodb"
  );
}

// conexión a mongodb
mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error(err);
  });

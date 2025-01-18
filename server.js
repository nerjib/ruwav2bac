const dotenv = require('dotenv');


dotenv.config();

const PORT = process.env.PORT || 5001;

const app = require('./app');

app.listen(PORT, () => console.log(`server starting on port ${PORT}!`));
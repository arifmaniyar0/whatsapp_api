const express = require('express');

const cors = require('cors');

const fileupload = require('express-fileupload');


const app = express();

const route = require('../Route/route');

app.use(express.json());
app.use(cors());
app.use(fileupload());

app.use('/api', route)

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json('welcome to node server');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})


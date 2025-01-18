const express = require('express')
const http = require('http')
const dotenv = require('dotenv');
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const app = express();
const multer = require('multer');
// const cloudinary = require('cloudinary');

// const Sites = require('./src/controllers/sites')
// const Folders = require('./src/controllers/folders')
// const Files = require('./src/controllers/files')
// const Categories = require('./src/controllers/categories')
// const Customer = require('./src/controllers/customer')
// const Payments = require('./src/controllers/payments')
const Lodge = require('./src/controllers/lodge')
const Project = require('./src/controllers/projects')


// const Authsignin = require('./src/controllers/auth/authsignin')





app.use(cors())

http.createServer(app);

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json({limit: '20mb'}));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));



app.use(express.static(path.join(__dirname, 'public')));


dotenv.config();


app.use(express.static(path.join(__dirname, 'public')));


// const storage = multer.diskStorage({
//     distination: function (req, file, cb) {
//       cb(null, './src');
//     },
//     filename: function (req, file, cb) {
//       cb(null, file.originalname);
//     },
//   });
//   cloudinary.config({
//     cloud_name: process.env.cloud_name,
//     api_key: process.env.api_key,
//     api_secret: process.env.api_secret,
//   });
//   const fileFilter = (req, file, cb) => {
//     if (file.mimetype === 'image/gif'||'image/png') {
//       cb(null, true);
//     } else {
//       cb(new Error('image is not gif'), false);
//     }
//   };
  
  // const upload = multer({
  //   storage,
  //   fileFilter,
  // });
  

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.headers('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE');
      return res.status(200).json({});
    }
    next();
  });
  
  

  const dataFilePath = path.join(__dirname, 'rooms.json');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage: storage });
  // app.use('/uploads', express.static(uploadsDir));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/', function(req,res){
res.json({
    m:'Welcome to zazzau'
})
})

// app.use('/api/v1/sites', Sites)
// app.use('/api/v1/folders', Folders)
// app.use('/api/v1/files', Files)
// app.use('/api/v1/categories', Categories)
// app.use('/api/v1/customers', Customer)
// app.use('/api/v1/payments', Payments)
app.use('/api/v1/ruwassa', Project)
// app.use('/api/v1/auth/signin', Authsignin)










// ussd feedback


    
module.exports = app;